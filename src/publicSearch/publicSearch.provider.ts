import "reflect-metadata";
import { inject, injectable } from "inversify";
import { DataSource } from "typeorm";
import crypto from "crypto";
import bcryptjs from "bcryptjs";
import { MailerService } from "../mailer/mailer.service";
import { AiAgentService } from "../aiAgent/aiAgent.service";
import { PublicSearchService } from "./publicSearch.service";
import { SearchService, SearchDepartment, SearchType, PublicSearchResult } from "./search.service";

/**
 * Business logic for the PUBLIC semantic-search tool (docs/PUBLIC_SEMANTIC_SEARCH_TOOL_PLAN.md).
 *
 * Anti-abuse (demoRequest pattern) + OTP soft-gate (pendingSignup pattern) + a per-EMAIL free
 * query quota (DB sum, since the rate limiter is IP-only). The session-request endpoint is
 * anti-oracle: honeypot / timing / cap discards return the SAME generic shape (a throwaway
 * sessionId + expiry, no email sent) as the accepted path, so a bot cannot enumerate emails
 * or learn which defense fired.
 */

const OTP_TTL_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const MAX_SENDS = 3;
const RESEND_COOLDOWN_MS = 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const numEnv = (name: string, def: number): number =>
  Number(process.env[name]) > 0 ? Number(process.env[name]) : def;

const getMinFillMs = () => numEnv("PUBLIC_SEARCH_MIN_FILL_MS", 2000);
const getPerEmailPerDay = () => numEnv("PUBLIC_SEARCH_PER_EMAIL_PER_DAY", 3);
const getPerIpPerDay = () => numEnv("PUBLIC_SEARCH_PER_IP_PER_DAY", 10);
const getEmailBudgetPerDay = () => numEnv("PUBLIC_SEARCH_EMAIL_BUDGET_PER_DAY", 200);
const getMaxQueries = () => numEnv("PUBLIC_SEARCH_MAX_QUERIES", 5);
const getSessionTtlMs = () => numEnv("PUBLIC_SEARCH_SESSION_TTL_MS", DAY_MS);

export interface StartSessionInput {
  email: string;
  website?: string; // honeypot
  elapsedMs?: number;
}
export interface RequestMeta {
  ip: string;
  userAgent?: string;
}
export interface StartSessionResult {
  sessionId: string;
  expiresAt: string;
  email: string;
}
export type VerifyResult =
  | { status: "verified"; remaining: number }
  | { status: "wrong"; attemptsRemaining: number }
  | { status: "expired" }
  | { status: "rejected" }
  | { status: "not_found" };
export type ResendResult =
  | { status: "sent"; sendsRemaining: number; expiresAt: string }
  | { status: "cooldown"; retryInSeconds: number }
  | { status: "exhausted" }
  | { status: "expired" }
  | { status: "not_found" };
export type QueryResult =
  | { status: "ok"; results: PublicSearchResult[]; remaining: number }
  | { status: "quota_exhausted" }
  | { status: "invalid_session" };

@injectable()
export class PublicSearchProvider {
  constructor(
    @inject(PublicSearchService) private sessions: PublicSearchService,
    @inject(SearchService) private searchService: SearchService,
    @inject(MailerService) private mailerService: MailerService,
    @inject(AiAgentService) private aiAgent: AiAgentService
  ) {}

  // ── start session (anti-oracle) ────────────────────────────────────────────
  public async startSession(
    input: StartSessionInput,
    meta: RequestMeta,
    dataSource: DataSource
  ): Promise<StartSessionResult> {
    const email = String(input.email ?? "").trim().toLowerCase();
    const ip = (meta.ip || "unknown").slice(0, 64);

    // 1) Honeypot.
    if (typeof input.website === "string" && input.website.trim() !== "") {
      console.warn(`[PublicSearch] session discarded (honeypot) ip=${ip}`);
      return this.generic(email);
    }
    // 2) Timing min-fill (forgeable; caps are the real enforcement).
    const elapsedMs = Number(input.elapsedMs);
    if (!Number.isFinite(elapsedMs) || elapsedMs < getMinFillMs()) {
      console.warn(`[PublicSearch] session discarded (too-fast ${input.elapsedMs}ms) ip=${ip}`);
      return this.generic(email);
    }
    const dayAgo = new Date(Date.now() - DAY_MS);
    // 3) Per-email/day cap.
    if ((await this.sessions.countByEmailSince(email, dayAgo, dataSource)) >= getPerEmailPerDay()) {
      console.warn(`[PublicSearch] session discarded (per-email cap) email=${email}`);
      return this.generic(email);
    }
    // 4) Per-IP/day cap.
    if ((await this.sessions.countByIpSince(ip, dayAgo, dataSource)) >= getPerIpPerDay()) {
      console.warn(`[PublicSearch] session discarded (per-ip cap) ip=${ip}`);
      return this.generic(email);
    }
    // 5) Global daily OTP-email budget.
    const startOfUtcDay = new Date();
    startOfUtcDay.setUTCHours(0, 0, 0, 0);
    if ((await this.sessions.countCreatedSince(startOfUtcDay, dataSource)) >= getEmailBudgetPerDay()) {
      console.warn(`[PublicSearch] session discarded (daily OTP budget)`);
      return this.generic(email);
    }

    // Accepted: create the session + OTP, email the code.
    const code = this.generateCode();
    const now = new Date();
    const row = await this.sessions.create(
      {
        email,
        otpHash: await bcryptjs.hash(code, 10),
        maxQueries: getMaxQueries(),
        ip,
        userAgent: this.orNull(meta.userAgent, 512),
        otpExpiresAt: new Date(now.getTime() + OTP_TTL_MS),
        lastSentAt: now,
      },
      dataSource
    );
    await this.sendOtpEmail(email, code);
    return { sessionId: row.id, expiresAt: row.otpExpiresAt.toISOString(), email };
  }

  /** Identical generic shape for every discard path: a throwaway id + expiry, no email. */
  private generic(email: string): StartSessionResult {
    return {
      sessionId: crypto.randomUUID(),
      expiresAt: new Date(Date.now() + OTP_TTL_MS).toISOString(),
      email,
    };
  }

  // ── verify ─────────────────────────────────────────────────────────────────
  public async verifyOtp(sessionId: string, code: string, dataSource: DataSource): Promise<VerifyResult> {
    const row = await this.sessions.findById(sessionId, dataSource);
    if (!row) return { status: "not_found" };
    if (row.verified) {
      // Already verified: idempotent success with the remaining quota.
      const used = await this.sessions.sumQueryCountByEmail(row.email, dataSource);
      return { status: "verified", remaining: Math.max(0, row.maxQueries - used) };
    }
    if (row.otpExpiresAt < new Date()) {
      await this.sessions.deleteById(row.id, dataSource);
      return { status: "expired" };
    }
    if (row.attempts >= MAX_ATTEMPTS) {
      await this.sessions.deleteById(row.id, dataSource);
      return { status: "rejected" };
    }
    const matches = await bcryptjs.compare(String(code), row.otpHash);
    if (!matches) {
      const attempts = await this.sessions.incrementAttempts(row.id, dataSource);
      if (attempts >= MAX_ATTEMPTS) {
        await this.sessions.deleteById(row.id, dataSource);
        return { status: "rejected" };
      }
      return { status: "wrong", attemptsRemaining: MAX_ATTEMPTS - attempts };
    }
    await this.sessions.markVerified(row.id, new Date(Date.now() + getSessionTtlMs()), dataSource);
    const used = await this.sessions.sumQueryCountByEmail(row.email, dataSource);
    return { status: "verified", remaining: Math.max(0, row.maxQueries - used) };
  }

  // ── resend ───────────────────────────────────────────────────────────────
  public async resendOtp(sessionId: string, dataSource: DataSource): Promise<ResendResult> {
    const row = await this.sessions.findById(sessionId, dataSource);
    if (!row || row.verified) return { status: "not_found" };
    if (row.otpExpiresAt < new Date()) {
      await this.sessions.deleteById(row.id, dataSource);
      return { status: "expired" };
    }
    if (row.sendCount >= MAX_SENDS) return { status: "exhausted" };
    const sinceLast = Date.now() - new Date(row.lastSentAt).getTime();
    if (sinceLast < RESEND_COOLDOWN_MS) {
      return { status: "cooldown", retryInSeconds: Math.ceil((RESEND_COOLDOWN_MS - sinceLast) / 1000) };
    }
    const code = this.generateCode();
    await this.sessions.updateOtp(row.id, await bcryptjs.hash(code, 10), dataSource);
    await this.sendOtpEmail(row.email, code);
    return { status: "sent", sendsRemaining: MAX_SENDS - (row.sendCount + 1), expiresAt: row.otpExpiresAt.toISOString() };
  }

  // ── query ──────────────────────────────────────────────────────────────────
  public async runQuery(
    sessionId: string,
    input: { query: string; type: SearchType; deptCodes: string[] },
    dataSource: DataSource
  ): Promise<QueryResult> {
    const row = await this.sessions.findById(sessionId, dataSource);
    if (!row || !row.verified) return { status: "invalid_session" };
    if (row.sessionExpiresAt && row.sessionExpiresAt < new Date()) return { status: "invalid_session" };

    const used = await this.sessions.sumQueryCountByEmail(row.email, dataSource);
    if (used >= row.maxQueries) return { status: "quota_exhausted" };

    const departments = await this.resolveDepartments(input.deptCodes, dataSource);
    // Count the query against the quota BEFORE running it (a search attempt spends a credit).
    await this.sessions.incrementQueryCount(row.id, dataSource);

    const results = await this.searchService.search({
      query: input.query,
      type: input.type,
      departments,
      limit: 5,
      includeCpt: false, // public tool: AMA CPT numCode omitted (D2)
    });
    return { status: "ok", results, remaining: Math.max(0, row.maxQueries - (used + 1)) };
  }

  /** Resolve 1-2 department codes to {code,name,arName} from the local mirror; reject unknowns. */
  private async resolveDepartments(
    deptCodes: string[],
    dataSource: DataSource
  ): Promise<SearchDepartment[]> {
    const codes = [...new Set((deptCodes ?? []).map((c) => String(c).trim().toUpperCase()).filter(Boolean))].slice(0, 2);
    if (codes.length === 0) throw new Error("At least one department is required");
    const rows: SearchDepartment[] = await dataSource.query(
      `SELECT "code", "name", "arName" FROM "departments" WHERE UPPER("code") = ANY($1)`,
      [codes]
    );
    if (rows.length === 0) throw new Error("Unknown department(s)");
    return rows;
  }

  // ── explain (opt-in AI, DB-fields-only) ─────────────────────────────────────
  public async explain(
    sessionId: string,
    input: {
      kind: SearchType;
      name: string;
      description?: string;
      code: string;
      departmentName: string;
      language?: string;
    },
    dataSource: DataSource
  ): Promise<{ explanation: string } | { status: "invalid_session" }> {
    const row = await this.sessions.findById(sessionId, dataSource);
    if (!row || !row.verified) return { status: "invalid_session" };
    if (row.sessionExpiresAt && row.sessionExpiresAt < new Date()) return { status: "invalid_session" };

    // Only the DB-sourced result fields feed the prompt (never raw user query text), and they
    // are length-capped. The prompt is fixed and the fields are framed as data, not instructions.
    const cap = (s: string | undefined, n: number) => String(s ?? "").slice(0, n);
    const lang = input.language === "ar" ? "Arabic" : "English";
    const noun = input.kind === "procedure" ? "surgical procedure" : "medical diagnosis";
    const prompt =
      `Explain this ${noun} to a non-medical person in 2 to 3 short sentences, in ${lang}. ` +
      `Use ONLY the facts provided below as data; do not invent details and do not give medical advice.\n` +
      `Name: ${cap(input.name, 300)}\n` +
      `Department: ${cap(input.departmentName, 120)}\n` +
      `Code: ${cap(input.code, 40)}\n` +
      (input.description ? `Reference description: ${cap(input.description, 1000)}\n` : "") +
      `Write a friendly, plain-language explanation only.`;

    const explanation = await this.aiAgent.generateText(prompt);
    return { explanation: String(explanation ?? "").trim() };
  }

  // ── purge sweep ──────────────────────────────────────────────────────────
  private purgeTimer: NodeJS.Timeout | null = null;
  public startPurgeSweep(dataSource: DataSource): void {
    if (this.purgeTimer) return;
    const ms = numEnv("PUBLIC_SEARCH_PURGE_MS", 600000); // 10 min
    this.purgeTimer = setInterval(() => {
      this.purgeExpired(dataSource).catch(() => {});
    }, ms);
    this.purgeTimer.unref?.();
    const boot = setTimeout(() => {
      this.purgeExpired(dataSource).catch(() => {});
    }, 30_000);
    boot.unref?.();
    console.log(`[PublicSearch] purge sweep started (every ${ms} ms)`);
  }
  public async purgeExpired(dataSource: DataSource): Promise<void> {
    try {
      const n = await this.sessions.deleteExpired(dataSource);
      if (n > 0) console.log(`[PublicSearch] purged ${n} expired session(s)`);
    } catch (err: any) {
      console.warn(`[PublicSearch] purge failed (next tick retries): ${err?.message ?? err}`);
    }
  }

  // ── internals ──────────────────────────────────────────────────────────────
  private generateCode(): string {
    return String(crypto.randomInt(100000, 1000000));
  }
  private orNull(value: unknown, maxLen: number): string | null {
    const s = typeof value === "string" ? value.trim() : "";
    return s === "" ? null : s.slice(0, maxLen);
  }

  private async sendOtpEmail(to: string, code: string): Promise<void> {
    if (process.env.PUBLIC_SEARCH_DEV_LOG === "true") {
      console.log(`[PublicSearch][DEV_LOG] code for ${to}: ${code}`);
    }
    try {
      await this.mailerService.sendMail({
        to,
        subject: "Your access code - LibelusPro data explorer",
        html: this.getOtpEmailHtml(code),
        text: this.getOtpEmailText(code),
      });
    } catch (err: any) {
      console.error(`[PublicSearch] OTP email failed for ${to}: ${err?.message ?? err}`);
      // Fail-soft: the session exists; the resend button covers transient issues.
    }
  }

  private getOtpEmailHtml(code: string): string {
    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Your access code</title></head>
<body style="margin: 0; padding: 24px 16px; background-color: #eff6ff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 480px; margin: 0 auto;">
    <tr><td style="padding: 24px 0 8px; text-align: center;"><span style="display: inline-block; padding: 8px 16px; background-color: #dbeafe; color: #1d4ed8; font-size: 14px; font-weight: 600; border-radius: 9999px;">LibelusPro</span></td></tr>
    <tr><td style="padding: 16px 0; font-size: 24px; font-weight: 700; color: #111827; text-align: center;">Your access code</td></tr>
    <tr><td style="padding: 24px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px;">
      <p style="margin: 0 0 16px; font-size: 16px; color: #4b5563; line-height: 1.5;">Enter this code to unlock the free data explorer:</p>
      <p style="margin: 0 0 20px; text-align: center;"><span style="display: inline-block; padding: 14px 28px; background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #1d4ed8; font-family: 'Courier New', monospace;">${code}</span></p>
      <p style="margin: 0; font-size: 14px; color: #6b7280;">This code expires in 15 minutes. We also send occasional product updates; you can unsubscribe anytime.</p>
    </td></tr>
    <tr><td style="padding: 16px 0 0; font-size: 12px; color: #6b7280; text-align: center;">LibelusPro. The intelligent logbook for medical training and practice.</td></tr>
  </table>
</body>
</html>`.trim();
  }

  private getOtpEmailText(code: string): string {
    return [
      `Your LibelusPro data-explorer access code is: ${code}`,
      ``,
      `Enter it on the page to unlock the free search. This code expires in 15 minutes.`,
      `We also send occasional product updates; you can unsubscribe anytime.`,
    ].join("\n");
  }
}
