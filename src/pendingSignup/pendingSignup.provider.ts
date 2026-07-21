import "reflect-metadata";
import { inject, injectable } from "inversify";
import { DataSource } from "typeorm";
import crypto from "crypto";
import bcryptjs from "bcryptjs";
import { MailerService } from "../mailer/mailer.service";
import { PendingSignupService } from "./pendingSignup.service";
import { PendingSignupEntity, TPendingSignupRole } from "./pendingSignup.mDbSchema";
import { CandidateEntity } from "../cand/cand.mDbSchema";
import { SupervisorEntity } from "../supervisor/supervisor.mDbSchema";
import { UserRole } from "../types/role.types";

const OTP_TTL_MS = 15 * 60 * 1000; // 15 minutes, fixed — resend does NOT extend
const MAX_ATTEMPTS = 5;
const MAX_SENDS = 3; // initial + 2 resends
const RESEND_COOLDOWN_MS = 60 * 1000;

export type StartSignupResult =
  | { status: "started"; signupId: string; expiresAt: string; email: string }
  | { status: "email_exists" };

export type VerifyOtpResult =
  | { status: "verified"; user: Record<string, unknown> }
  | { status: "wrong"; attemptsRemaining: number }
  | { status: "expired" }
  | { status: "rejected" }
  | { status: "not_found" };

export type ResendOtpResult =
  | { status: "sent"; sendsRemaining: number; expiresAt: string }
  | { status: "cooldown"; retryInSeconds: number }
  | { status: "exhausted" }
  | { status: "expired" }
  | { status: "not_found" };

/**
 * OTP-verified signup flow (docs/OTP_SIGNUP_VERIFICATION_PLAN.md).
 * Registrations are staged in `pending_signups`; the REAL candidates/supervisors row is
 * created only when the emailed 6-digit code is verified within 15 minutes. Expired or
 * rejected (5 wrong attempts) signups are deleted — the user simply re-registers.
 */
@injectable()
export class PendingSignupProvider {
  constructor(
    @inject(PendingSignupService) private pendingSignupService: PendingSignupService,
    @inject(MailerService) private mailerService: MailerService
  ) {}

  // ── start ────────────────────────────────────────────────────────────────

  public async startSignup(
    role: TPendingSignupRole,
    payload: Record<string, unknown> & { email: string; password: string; departmentId?: string },
    dataSource: DataSource
  ): Promise<StartSignupResult> {
    const email = String(payload.email).trim().toLowerCase();

    // Department must exist in the mirror (both user tables are dept-scoped, NOT NULL).
    await this.assertDepartmentExists(String(payload.departmentId ?? ""), dataSource);

    // Reject if a REAL account already exists for this email+role.
    if (await this.accountEmailExists(role, email, dataSource)) {
      return { status: "email_exists" };
    }

    // One active pending per (email, role): a fresh signup replaces any prior attempt.
    await this.pendingSignupService.deleteByEmailRole(email, role, dataSource);

    // Never store the plaintext password: hash NOW, store the hash in the payload.
    const { password, ...rest } = payload;
    const storedPayload: Record<string, unknown> = {
      ...rest,
      email,
      hashedPassword: await bcryptjs.hash(String(password), 10),
    };

    const code = this.generateCode();
    const now = new Date();
    const row = await this.pendingSignupService.create(
      {
        role,
        email,
        payload: storedPayload,
        otpHash: await bcryptjs.hash(code, 10),
        expiresAt: new Date(now.getTime() + OTP_TTL_MS),
        lastSentAt: now,
      },
      dataSource
    );

    await this.sendOtpEmail(email, String(rest.fullName ?? "there"), code);

    return {
      status: "started",
      signupId: row.id,
      expiresAt: row.expiresAt.toISOString(),
      email,
    };
  }

  // ── verify ───────────────────────────────────────────────────────────────

  public async verifyOtp(signupId: string, code: string, dataSource: DataSource): Promise<VerifyOtpResult> {
    const row = await this.pendingSignupService.findById(signupId, dataSource);
    if (!row) return { status: "not_found" };

    if (row.expiresAt < new Date()) {
      await this.pendingSignupService.deleteById(row.id, dataSource);
      return { status: "expired" };
    }
    if (row.attempts >= MAX_ATTEMPTS) {
      await this.pendingSignupService.deleteById(row.id, dataSource);
      return { status: "rejected" };
    }

    const matches = await bcryptjs.compare(String(code), row.otpHash);
    if (!matches) {
      const attempts = await this.pendingSignupService.incrementAttempts(row.id, dataSource);
      if (attempts >= MAX_ATTEMPTS) {
        await this.pendingSignupService.deleteById(row.id, dataSource);
        return { status: "rejected" };
      }
      return { status: "wrong", attemptsRemaining: MAX_ATTEMPTS - attempts };
    }

    // Correct code → create the real account row + delete the staging row atomically.
    // Email uniqueness is re-checked INSIDE the transaction (race guard: an account could
    // have been created between startSignup and now).
    const user = await dataSource.transaction(async (em) => {
      const exists =
        row.role === "candidate"
          ? await em
              .getRepository(CandidateEntity)
              .createQueryBuilder("c")
              .where("LOWER(c.email) = :email", { email: row.email })
              .getOne()
          : await em
              .getRepository(SupervisorEntity)
              .createQueryBuilder("s")
              .where("LOWER(s.email) = :email", { email: row.email })
              .getOne();
      if (exists) {
        await em.getRepository(PendingSignupEntity).delete({ id: row.id });
        throw new Error("EMAIL_EXISTS_RACE");
      }

      const created =
        row.role === "candidate"
          ? await this.createCandidateRow(em as unknown as { getRepository: DataSource["getRepository"] }, row)
          : await this.createSupervisorRow(em as unknown as { getRepository: DataSource["getRepository"] }, row);

      await em.getRepository(PendingSignupEntity).delete({ id: row.id });
      return created;
    }).catch((err: Error) => {
      if (err.message === "EMAIL_EXISTS_RACE") return null;
      throw err;
    });

    if (!user) return { status: "rejected" };
    return { status: "verified", user };
  }

  // ── resend ───────────────────────────────────────────────────────────────

  public async resendOtp(signupId: string, dataSource: DataSource): Promise<ResendOtpResult> {
    const row = await this.pendingSignupService.findById(signupId, dataSource);
    if (!row) return { status: "not_found" };

    if (row.expiresAt < new Date()) {
      await this.pendingSignupService.deleteById(row.id, dataSource);
      return { status: "expired" };
    }
    if (row.sendCount >= MAX_SENDS) {
      return { status: "exhausted" };
    }
    const sinceLast = Date.now() - new Date(row.lastSentAt).getTime();
    if (sinceLast < RESEND_COOLDOWN_MS) {
      return { status: "cooldown", retryInSeconds: Math.ceil((RESEND_COOLDOWN_MS - sinceLast) / 1000) };
    }

    // New code replaces the old one (old code becomes invalid). Expiry unchanged.
    const code = this.generateCode();
    await this.pendingSignupService.updateOtp(row.id, await bcryptjs.hash(code, 10), dataSource);
    await this.sendOtpEmail(row.email, String(row.payload.fullName ?? "there"), code);

    return {
      status: "sent",
      sendsRemaining: MAX_SENDS - (row.sendCount + 1),
      expiresAt: row.expiresAt.toISOString(),
    };
  }

  // ── purge sweep ──────────────────────────────────────────────────────────

  private purgeTimer: NodeJS.Timeout | null = null;

  /** Periodic hygiene: expired rows are also rejected at read time, this just cleans up. */
  public startPurgeSweep(dataSource: DataSource): void {
    if (this.purgeTimer) return;
    const ms = parseInt(process.env.PENDING_SIGNUP_PURGE_MS || "600000", 10); // 10 min
    this.purgeTimer = setInterval(() => {
      this.purgeExpired(dataSource).catch(() => {
        /* logged inside */
      });
    }, ms);
    this.purgeTimer.unref?.();
    // One early sweep shortly after boot.
    const boot = setTimeout(() => {
      this.purgeExpired(dataSource).catch(() => {
        /* logged inside */
      });
    }, 30_000);
    boot.unref?.();
    console.log(`[PendingSignup] purge sweep started (every ${ms} ms)`);
  }

  public async purgeExpired(dataSource: DataSource): Promise<void> {
    try {
      const purged = await this.pendingSignupService.deleteExpired(dataSource);
      if (purged > 0) console.log(`[PendingSignup] purged ${purged} expired pending signup(s)`);
    } catch (err: any) {
      console.warn(`[PendingSignup] purge sweep failed (next tick retries): ${err?.message ?? err}`);
    }
  }

  // ── internals ────────────────────────────────────────────────────────────

  private generateCode(): string {
    return String(crypto.randomInt(100000, 1000000)); // 6 digits, crypto-strong
  }

  private async assertDepartmentExists(departmentId: string, dataSource: DataSource): Promise<void> {
    if (!departmentId.trim()) throw new Error("departmentId is required to register");
    const rows = await dataSource.query(`SELECT 1 FROM "departments" WHERE "id" = $1`, [departmentId]);
    if (!rows.length) throw new Error(`Unknown departmentId: ${departmentId}`);
  }

  private async accountEmailExists(role: TPendingSignupRole, email: string, dataSource: DataSource): Promise<boolean> {
    const table = role === "candidate" ? "candidates" : "supervisors";
    const rows = await dataSource.query(
      `SELECT 1 FROM "${table}" WHERE LOWER("email") = $1 LIMIT 1`,
      [email]
    );
    return rows.length > 0;
  }

  private async createCandidateRow(
    em: { getRepository: DataSource["getRepository"] },
    row: PendingSignupEntity
  ): Promise<Record<string, unknown>> {
    const p = row.payload as Record<string, any>;
    const repo = em.getRepository(CandidateEntity);
    const created = repo.create({
      email: row.email,
      password: String(p.hashedPassword), // already bcrypt-hashed at startSignup
      fullName: p.fullName,
      phoneNum: p.phoneNum,
      approved: false, // unapproved until the institution approves (unchanged flow)
      role: UserRole.CANDIDATE,
      regNum: p.regNum,
      nationality: p.nationality,
      rank: p.rank,
      regDeg: p.regDeg != null && String(p.regDeg).trim() !== "" ? p.regDeg : null,
      departmentId: p.departmentId,
    });
    (created as any).termsAcceptedAt = new Date(row.createdAt); // accepted at signup time
    const saved = await repo.save(created);
    return this.sanitize(saved as unknown as Record<string, unknown>);
  }

  private async createSupervisorRow(
    em: { getRepository: DataSource["getRepository"] },
    row: PendingSignupEntity
  ): Promise<Record<string, unknown>> {
    const p = row.payload as Record<string, any>;
    const repo = em.getRepository(SupervisorEntity);
    const created = repo.create({
      email: row.email,
      password: String(p.hashedPassword), // already bcrypt-hashed at startSignup
      fullName: p.fullName,
      phoneNum: p.phoneNum,
      approved: false,
      role: UserRole.SUPERVISOR,
      canValidate: false, // no validation rights until granted by admin (unchanged flow)
      departmentId: p.departmentId,
      ...(p.position != null && String(p.position).trim() !== "" && { position: p.position }),
    });
    (created as any).termsAcceptedAt = new Date(row.createdAt);
    const saved = await repo.save(created);
    return this.sanitize(saved as unknown as Record<string, unknown>);
  }

  private sanitize(user: Record<string, unknown>): Record<string, unknown> {
    const { password, google_uid, ...rest } = user as Record<string, unknown> & {
      password?: unknown;
      google_uid?: unknown;
    };
    return rest;
  }

  private async sendOtpEmail(to: string, name: string, code: string): Promise<void> {
    // Staging escape hatch: Mailgun sandbox domains only deliver to authorized recipients.
    if (process.env.OTP_DEV_LOG === "true") {
      console.log(`[PendingSignup][OTP_DEV_LOG] code for ${to}: ${code}`);
    }
    try {
      await this.mailerService.sendMail({
        to,
        subject: "Your verification code - LibelusPro",
        html: this.getOtpEmailHtml(name, code),
        text: this.getOtpEmailText(name, code),
      });
    } catch (err: any) {
      // Don't leak the failure detail to the client; the resend button covers transient issues.
      console.error(`[PendingSignup] OTP email send failed for ${to}: ${err?.message ?? err}`);
      throw new Error("Could not send the verification email. Please try again.");
    }
  }

  private getOtpEmailHtml(name: string, code: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your verification code</title>
</head>
<body style="margin: 0; padding: 24px 16px; background-color: #eff6ff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 480px; margin: 0 auto;">
    <tr>
      <td style="padding: 24px 0 8px; text-align: center;">
        <span style="display: inline-block; padding: 8px 16px; background-color: #dbeafe; color: #1d4ed8; font-size: 14px; font-weight: 600; border-radius: 9999px;">LibelusPro</span>
      </td>
    </tr>
    <tr>
      <td style="padding: 16px 0; font-size: 24px; font-weight: 700; color: #111827; text-align: center;">Verify your email</td>
    </tr>
    <tr>
      <td style="padding: 24px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px;">
        <p style="margin: 0 0 16px; font-size: 16px; color: #4b5563; line-height: 1.5;">Hello ${name},</p>
        <p style="margin: 0 0 16px; font-size: 16px; color: #4b5563; line-height: 1.5;">Enter this code on the signup page to verify your email address:</p>
        <p style="margin: 0 0 20px; text-align: center;">
          <span style="display: inline-block; padding: 14px 28px; background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #1d4ed8; font-family: 'Courier New', monospace;">${code}</span>
        </p>
        <p style="margin: 0; font-size: 14px; color: #6b7280;">This code expires in 15 minutes. If it expires, simply register again.</p>
      </td>
    </tr>
    <tr>
      <td style="padding-top: 16px; padding-bottom: 8px; padding-left: 0; padding-right: 0;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #dbeafe; border: 1px solid #bfdbfe; border-radius: 8px;"><tr><td style="padding: 16px; font-size: 14px; color: #1d4ed8; line-height: 1.5;"><strong>Security:</strong> If you did not sign up for LibelusPro, ignore this email — no account will be created.</td></tr></table>
      </td>
    </tr>
    <tr>
      <td style="padding: 16px 0 0; font-size: 12px; color: #6b7280; text-align: center;">LibelusPro — The intelligent logbook for medical training and practice.</td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  private getOtpEmailText(name: string, code: string): string {
    return [
      `Hello ${name},`,
      ``,
      `Your LibelusPro verification code is: ${code}`,
      ``,
      `Enter it on the signup page to verify your email address.`,
      `This code expires in 15 minutes. If it expires, simply register again.`,
      ``,
      `If you did not sign up for LibelusPro, ignore this email — no account will be created.`,
    ].join("\n");
  }
}
