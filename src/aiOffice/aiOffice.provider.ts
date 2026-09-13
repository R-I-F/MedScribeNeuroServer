import "reflect-metadata";
import { inject, injectable } from "inversify";
import { DataSource } from "typeorm";
import { AiOfficeService } from "./aiOffice.service";
import { MailerService } from "../mailer/mailer.service";
import { PendingSignupProvider } from "../pendingSignup/pendingSignup.provider";
import {
  AI_OFFICE_ACTIVITY_DEFS,
  AI_OFFICE_TEXT_MAX,
  AiOfficeMemberRole,
  isAiOfficeActivityType,
} from "./aiOffice.types";
import {
  AiOfficeError,
  IAiOfficeAccessRequestRow,
  IAiOfficeActivityAdminDoc,
  IAiOfficeActivityDoc,
  IAiOfficeActivityInput,
  IAiOfficeAdminActivitiesQuery,
  IAiOfficeAdminStats,
  IAiOfficeAdminUserRow,
  IAiOfficeAdminUsersQuery,
  IAiOfficeMe,
  IAiOfficeMember,
  IAiOfficeRequestMeta,
  IAiOfficeSignupInput,
  IAiOfficeStats,
  IPaged,
  TAiOfficeSignupResult,
} from "./aiOffice.interface";

const DAY_MS = 24 * 60 * 60 * 1000;

const getNotifyEmail = (): string => process.env.AI_OFFICE_NOTIFY_EMAIL || "medscribeeg@gmail.com";

const getEmailBudgetPerDay = (): number =>
  Number(process.env.AI_OFFICE_REQUEST_EMAIL_BUDGET_PER_DAY) > 0
    ? Number(process.env.AI_OFFICE_REQUEST_EMAIL_BUDGET_PER_DAY)
    : 20;

const getFrontendUrl = (): string => (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * AI Office (docs/AI_OFFICE_PLAN.md): the member role, the activity form that replaces the
 * "AI Office - Activity Registration" Google Form, statistics, the hidden signup and the
 * super-admin console.
 *
 * Identity always comes from the JWT id + role, then the caller's DB row. JWT claims are never
 * trusted for membership: the super-admin can grant or revoke the role at any time and that must
 * apply on the next request, not at the next login.
 */
@injectable()
export class AiOfficeProvider {
  constructor(
    @inject(AiOfficeService) private aiOfficeService: AiOfficeService,
    @inject(MailerService) private mailerService: MailerService,
    @inject(PendingSignupProvider) private pendingSignupProvider: PendingSignupProvider
  ) {}

  // ── member ───────────────────────────────────────────────────────────────

  public async getMe(jwtId: string, jwtRole: string, dataSource: DataSource): Promise<IAiOfficeMe> {
    const row = await this.resolveAccount(jwtId, jwtRole, dataSource);
    if (!row) {
      return {
        member: false,
        role: null,
        aiOfficeMember: false,
        approved: false,
        departmentless: false,
        departmentOther: null,
      };
    }
    return {
      member: this.isMember(row),
      role: row.role,
      aiOfficeMember: row.aiOfficeMember,
      approved: row.approved,
      departmentless: row.departmentId === null,
      departmentOther: row.departmentOther,
    };
  }

  public async listMyActivities(jwtId: string, jwtRole: string, dataSource: DataSource): Promise<IAiOfficeActivityDoc[]> {
    const member = await this.mustGetMember(jwtId, jwtRole, dataSource);
    return this.aiOfficeService.listActivitiesForMember(member.role, member.id, dataSource);
  }

  public async createActivity(
    jwtId: string,
    jwtRole: string,
    input: IAiOfficeActivityInput,
    dataSource: DataSource
  ): Promise<IAiOfficeActivityDoc> {
    const member = await this.mustGetMember(jwtId, jwtRole, dataSource);
    const fields = this.normalizeActivity(input);
    const id = await this.aiOfficeService.createActivity(
      {
        ...fields,
        candidateId: member.role === "candidate" ? member.id : null,
        supervisorId: member.role === "supervisor" ? member.id : null,
      },
      dataSource
    );
    const saved = await this.aiOfficeService.getActivityForMember(id, member.role, member.id, dataSource);
    return saved!;
  }

  public async updateActivity(
    jwtId: string,
    jwtRole: string,
    activityId: string,
    input: IAiOfficeActivityInput,
    dataSource: DataSource
  ): Promise<IAiOfficeActivityDoc> {
    const member = await this.mustGetMember(jwtId, jwtRole, dataSource);
    // Someone else's entry answers exactly like a missing one, so ids cannot be probed.
    const existing = await this.aiOfficeService.getActivityForMember(activityId, member.role, member.id, dataSource);
    if (!existing) {
      throw new AiOfficeError("ACTIVITY_NOT_FOUND", "Activity not found");
    }
    await this.aiOfficeService.updateActivity(activityId, this.normalizeActivity(input), dataSource);
    const saved = await this.aiOfficeService.getActivityForMember(activityId, member.role, member.id, dataSource);
    return saved!;
  }

  public async getMyStats(jwtId: string, jwtRole: string, dataSource: DataSource): Promise<IAiOfficeStats> {
    const member = await this.mustGetMember(jwtId, jwtRole, dataSource);
    return this.aiOfficeService.getStats(this.aiOfficeService.memberScope(member.role, member.id), dataSource);
  }

  // ── super-admin ──────────────────────────────────────────────────────────

  public listUsersForAdmin(
    query: IAiOfficeAdminUsersQuery,
    dataSource: DataSource
  ): Promise<IPaged<IAiOfficeAdminUserRow>> {
    return this.aiOfficeService.listUsersForAdmin(query, dataSource);
  }

  public async setAiOfficeMember(
    role: AiOfficeMemberRole,
    id: string,
    value: boolean,
    dataSource: DataSource
  ): Promise<IAiOfficeMe> {
    const row = await this.aiOfficeService.getMemberRow(role, id, dataSource);
    if (!row || row.archived) {
      throw new AiOfficeError("USER_NOT_FOUND", "User not found");
    }
    // A department-less account exists only because of the AI Office signup; removing the role
    // would leave a user with no department at all (the DB CHECK forbids it).
    if (!value && row.departmentId === null) {
      throw new AiOfficeError(
        "DEPARTMENTLESS_MEMBER",
        "This account has no department (it signed up through the AI Office). Assign a department before removing the AI Office role."
      );
    }
    await this.aiOfficeService.setAiOfficeMember(role, id, value, dataSource);
    const updated = (await this.aiOfficeService.getMemberRow(role, id, dataSource))!;
    return {
      member: this.isMember(updated),
      role,
      aiOfficeMember: updated.aiOfficeMember,
      approved: updated.approved,
      departmentless: updated.departmentId === null,
      departmentOther: updated.departmentOther,
    };
  }

  public listActivitiesForAdmin(
    query: IAiOfficeAdminActivitiesQuery,
    dataSource: DataSource
  ): Promise<IPaged<IAiOfficeActivityAdminDoc>> {
    return this.aiOfficeService.listActivitiesForAdmin(query, dataSource);
  }

  public getAdminStats(query: IAiOfficeAdminActivitiesQuery, dataSource: DataSource): Promise<IAiOfficeAdminStats> {
    return this.aiOfficeService.getAdminStats(query, dataSource);
  }

  public listAccessRequests(
    page: number,
    pageSize: number,
    dataSource: DataSource
  ): Promise<IPaged<IAiOfficeAccessRequestRow>> {
    return this.aiOfficeService.listAccessRequests(page, pageSize, dataSource);
  }

  // ── hidden signup ────────────────────────────────────────────────────────

  public async startSignup(
    input: IAiOfficeSignupInput,
    meta: IAiOfficeRequestMeta,
    dataSource: DataSource
  ): Promise<TAiOfficeSignupResult> {
    const email = String(input.email).trim().toLowerCase();
    const departmentOther = input.departmentOther?.trim() || null;
    const departmentId = departmentOther ? null : input.departmentId?.trim() || null;

    let departmentLabel: string | null = departmentOther;
    if (departmentId) {
      departmentLabel = await this.aiOfficeService.getDepartmentName(departmentId, dataSource);
      if (!departmentLabel) {
        throw new AiOfficeError("UNKNOWN_DEPARTMENT", "Unknown department");
      }
    }

    // One person, one account: an existing candidate or supervisor cannot sign up again. The admins
    // are told instead, so the super-admin can grant the AI Office role to that account.
    const accounts = await this.aiOfficeService.findAccountsByEmail(email, dataSource);
    if (accounts.length > 0) {
      await this.recordAndNotifyExistingAccount(input, email, departmentLabel, accounts[0], meta, dataSource);
      return { status: "email_exists" };
    }

    if (await this.aiOfficeService.phoneExists(input.role, String(input.phoneNum).trim(), dataSource)) {
      return { status: "phone_exists" };
    }

    const common = {
      email,
      password: input.password,
      fullName: String(input.fullName).trim(),
      phoneNum: String(input.phoneNum).trim(),
      departmentId: departmentId ?? undefined,
    };
    const payload =
      input.role === "candidate"
        ? {
            ...common,
            regNum: String(input.regNum ?? "").trim(),
            nationality: String(input.nationality ?? "").trim(),
            rank: input.rank,
            regDeg: input.regDeg ?? null,
          }
        : { ...common, position: input.position ?? null };

    // Same OTP flow as every signup (staging row, emailed code, verify creates the account),
    // including the active-users signup cap.
    const result = await this.pendingSignupProvider.startSignup(input.role, payload, dataSource, {
      aiOffice: true,
      departmentOther,
    });
    return result;
  }

  // ── internals ────────────────────────────────────────────────────────────

  private isMember(row: IAiOfficeMember): boolean {
    return row.approved && row.aiOfficeMember && !row.archived;
  }

  /** Only candidate and supervisor accounts can hold the AI Office role. */
  private async resolveAccount(jwtId: string, jwtRole: string, dataSource: DataSource): Promise<IAiOfficeMember | null> {
    if (jwtRole !== "candidate" && jwtRole !== "supervisor") return null;
    return this.aiOfficeService.getMemberRow(jwtRole, jwtId, dataSource);
  }

  private async mustGetMember(jwtId: string, jwtRole: string, dataSource: DataSource): Promise<IAiOfficeMember> {
    const row = await this.resolveAccount(jwtId, jwtRole, dataSource);
    if (!row || !this.isMember(row)) {
      throw new AiOfficeError("NOT_AI_OFFICE_MEMBER", "The AI Office pages are available to approved AI Office members only");
    }
    return row;
  }

  /**
   * Reduces a submission to what its section actually asks, per AI_OFFICE_ACTIVITY_DEFS. Only the
   * activity type is required (the Google Form has no required questions). Answers to questions a
   * section does not have are dropped rather than stored.
   */
  private normalizeActivity(input: IAiOfficeActivityInput) {
    if (!isAiOfficeActivityType(input.activityType)) {
      throw new AiOfficeError("INVALID_ACTIVITY", "Unknown activity type");
    }
    const def = AI_OFFICE_ACTIVITY_DEFS[input.activityType];

    const text = (value: unknown, field: string): string | null => {
      if (value === undefined || value === null) return null;
      if (typeof value !== "string") throw new AiOfficeError("INVALID_ACTIVITY", `${field} must be text`);
      const trimmed = value.trim();
      if (trimmed.length > AI_OFFICE_TEXT_MAX) {
        throw new AiOfficeError("INVALID_ACTIVITY", `${field} is too long (max ${AI_OFFICE_TEXT_MAX} characters)`);
      }
      return trimmed === "" ? null : trimmed;
    };

    const status = def.statuses.length > 0 ? text(input.status, "status") : null;
    if (status !== null && !def.statuses.includes(status)) {
      throw new AiOfficeError("INVALID_ACTIVITY", `status must be one of: ${def.statuses.join(", ")}`);
    }

    let activityDate: string | null = null;
    if (def.hasDate && input.activityDate) {
      const value = String(input.activityDate).trim();
      const parsed = new Date(`${value}T00:00:00Z`);
      if (!DATE_RE.test(value) || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
        throw new AiOfficeError("INVALID_ACTIVITY", "activityDate must be a valid date (YYYY-MM-DD)");
      }
      activityDate = value;
    }

    const rawDetails = input.details && typeof input.details === "object" ? input.details : {};
    const details: Record<string, unknown> = {};
    for (const field of def.detailFields) {
      const value = (rawDetails as Record<string, unknown>)[field.key];
      if (field.kind === "boolean") {
        if (value === true || value === false) details[field.key] = value;
        else if (value !== undefined && value !== null && value !== "") {
          throw new AiOfficeError("INVALID_ACTIVITY", `${field.key} must be yes or no`);
        }
      } else {
        const t = text(value, field.key);
        if (t !== null) details[field.key] = t;
      }
    }

    return {
      activityType: input.activityType,
      title: def.hasTitle ? text(input.title, "title") : null,
      status,
      activityDate,
      notes: def.hasNotes ? text(input.notes, "notes") : null,
      details,
    };
  }

  private async recordAndNotifyExistingAccount(
    input: IAiOfficeSignupInput,
    email: string,
    departmentLabel: string | null,
    existing: {
      role: AiOfficeMemberRole;
      id: string;
      fullName: string;
      approved: boolean;
      aiOfficeMember: boolean;
      archived: boolean;
      departmentLabel: string | null;
      createdAt: string;
    },
    meta: IAiOfficeRequestMeta,
    dataSource: DataSource
  ): Promise<void> {
    const row = await this.aiOfficeService.createAccessRequest(
      {
        email,
        requestedRole: input.role,
        existingRole: existing.role,
        existingUserId: existing.id,
        fullName: String(input.fullName).trim().slice(0, 120),
        departmentLabel: departmentLabel ? departmentLabel.slice(0, 160) : null,
        ip: (meta.ip || "unknown").slice(0, 64),
        userAgent: meta.userAgent ? meta.userAgent.slice(0, 512) : null,
      },
      dataSource
    );

    // One email per address per 24 h, and a global daily budget, so a script cannot flood the inbox.
    const emailedForAddress = await this.aiOfficeService.countEmailedForEmailSince(
      email,
      new Date(Date.now() - DAY_MS),
      dataSource
    );
    if (emailedForAddress > 0) {
      console.warn(`[AiOffice] access request ${row.id} stored; email skipped (already emailed for ${email} in 24h)`);
      return;
    }
    const startOfUtcDay = new Date();
    startOfUtcDay.setUTCHours(0, 0, 0, 0);
    if ((await this.aiOfficeService.countEmailedSince(startOfUtcDay, dataSource)) >= getEmailBudgetPerDay()) {
      console.warn(`[AiOffice] access request ${row.id} stored; email skipped (daily budget reached)`);
      return;
    }

    try {
      const content = {
        requested: {
          fullName: String(input.fullName).trim(),
          email,
          role: input.role,
          phoneNum: String(input.phoneNum ?? "").trim(),
          department: departmentLabel,
        },
        existing,
        consoleUrl: `${getFrontendUrl()}/dashboard/super-admin/ai-office/users?role=${existing.role}&search=${encodeURIComponent(email)}`,
        ip: row.ip,
        userAgent: row.userAgent,
        at: row.createdAt.toISOString(),
      };
      await this.mailerService.sendMail({
        to: getNotifyEmail(),
        subject: `AI Office signup attempt with an existing account: ${content.requested.fullName}`,
        html: this.buildAccessRequestHtml(content),
        text: this.buildAccessRequestText(content),
      });
      await this.aiOfficeService.markAccessRequestEmailed(row.id, dataSource);
    } catch (err: any) {
      console.error(`[AiOffice] access request ${row.id} notification failed: ${err?.message ?? err}`);
    }
  }

  private escapeHtml(value: unknown): string {
    return String(value ?? "-")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  private roleLabel(role: AiOfficeMemberRole): string {
    return role === "candidate" ? "Candidate" : "Supervisor";
  }

  private buildAccessRequestHtml(c: {
    requested: { fullName: string; email: string; role: AiOfficeMemberRole; phoneNum: string; department: string | null };
    existing: {
      role: AiOfficeMemberRole;
      fullName: string;
      approved: boolean;
      aiOfficeMember: boolean;
      archived: boolean;
      departmentLabel: string | null;
      createdAt: string;
    };
    consoleUrl: string;
    ip: string;
    userAgent: string | null;
    at: string;
  }): string {
    const field = (label: string, value: unknown) => `
        <tr>
          <td style="padding: 6px 12px 6px 0; font-size: 14px; color: #6b7280; white-space: nowrap; vertical-align: top;">${label}</td>
          <td style="padding: 6px 0; font-size: 14px; color: #111827; line-height: 1.5;">${this.escapeHtml(value)}</td>
        </tr>`;
    const yesNo = (v: boolean) => (v ? "Yes" : "No");
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Office signup attempt</title>
</head>
<body style="margin: 0; padding: 24px 16px; background-color: #eff6ff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 560px; margin: 0 auto;">
    <tr><td style="padding: 24px 0 8px; text-align: center;">
      <span style="display: inline-block; padding: 8px 16px; background-color: #dbeafe; color: #1d4ed8; font-size: 14px; font-weight: 600; border-radius: 9999px;">LibelusPro</span>
    </td></tr>
    <tr><td style="padding: 16px 0; font-size: 22px; font-weight: 700; color: #111827; text-align: center;">AI Office signup attempt</td></tr>
    <tr><td style="padding: 24px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px;">
      <p style="margin: 0 0 16px; font-size: 14px; color: #374151; line-height: 1.6;">
        Someone tried to sign up through the AI Office link with an email that already has an account. No new account was created.
        If they belong to the AI Office, grant the role to the existing account from the super-admin console.
      </p>
      <p style="margin: 0 0 6px; font-size: 13px; font-weight: 700; color: #111827;">Requested</p>
      <table cellpadding="0" cellspacing="0" role="presentation" style="width: 100%; margin-bottom: 16px;">
${field("Name", c.requested.fullName)}
${field("Email", c.requested.email)}
${field("Signing up as", this.roleLabel(c.requested.role))}
${field("Phone", c.requested.phoneNum)}
${field("Department", c.requested.department)}
      </table>
      <p style="margin: 0 0 6px; font-size: 13px; font-weight: 700; color: #111827;">Existing account</p>
      <table cellpadding="0" cellspacing="0" role="presentation" style="width: 100%;">
${field("Account type", this.roleLabel(c.existing.role) + (c.existing.archived ? " (archived, promoted)" : ""))}
${field("Name", c.existing.fullName)}
${field("Department", c.existing.departmentLabel)}
${field("Approved", yesNo(c.existing.approved))}
${field("AI Office member", yesNo(c.existing.aiOfficeMember))}
${field("Created", c.existing.createdAt)}
      </table>
      <a href="${this.escapeHtml(c.consoleUrl)}" style="display:inline-block; margin-top: 16px; padding: 8px 16px; background-color: #2563eb; color: #ffffff; font-size: 13px; font-weight: 600; text-decoration: none; border-radius: 6px;">Open in the super-admin console</a>
      <p style="margin: 16px 0 0; font-size: 12px; color: #6b7280; line-height: 1.6;">Submitted ${this.escapeHtml(c.at)} from ${this.escapeHtml(c.ip)} (${this.escapeHtml(c.userAgent)}).</p>
    </td></tr>
    <tr><td style="padding: 16px 0 0; font-size: 12px; color: #6b7280; text-align: center;">Automated notice from the LibelusPro AI Office signup. At most one email per address per day.</td></tr>
  </table>
</body>
</html>
    `.trim();
  }

  private buildAccessRequestText(c: {
    requested: { fullName: string; email: string; role: AiOfficeMemberRole; phoneNum: string; department: string | null };
    existing: {
      role: AiOfficeMemberRole;
      fullName: string;
      approved: boolean;
      aiOfficeMember: boolean;
      archived: boolean;
      departmentLabel: string | null;
      createdAt: string;
    };
    consoleUrl: string;
    ip: string;
    userAgent: string | null;
    at: string;
  }): string {
    const yesNo = (v: boolean) => (v ? "Yes" : "No");
    return [
      `AI Office signup attempt with an existing account`,
      ``,
      `No new account was created. If this person belongs to the AI Office, grant the role to the existing account.`,
      ``,
      `Requested:`,
      `  Name:          ${c.requested.fullName}`,
      `  Email:         ${c.requested.email}`,
      `  Signing up as: ${this.roleLabel(c.requested.role)}`,
      `  Phone:         ${c.requested.phoneNum || "-"}`,
      `  Department:    ${c.requested.department ?? "-"}`,
      ``,
      `Existing account:`,
      `  Account type:     ${this.roleLabel(c.existing.role)}${c.existing.archived ? " (archived, promoted)" : ""}`,
      `  Name:             ${c.existing.fullName}`,
      `  Department:       ${c.existing.departmentLabel ?? "-"}`,
      `  Approved:         ${yesNo(c.existing.approved)}`,
      `  AI Office member: ${yesNo(c.existing.aiOfficeMember)}`,
      `  Created:          ${c.existing.createdAt}`,
      ``,
      `Super-admin console: ${c.consoleUrl}`,
      `Submitted ${c.at} from ${c.ip} (${c.userAgent ?? "-"}).`,
    ].join("\n");
  }
}
