import "reflect-metadata";
import { inject, injectable } from "inversify";
import { DataSource } from "typeorm";
import { DemoRequestService } from "./demoRequest.service";
import { MailerService } from "../mailer/mailer.service";

/**
 * Business logic for the public landing-page "Book a demo" form
 * (docs/BOOK_A_DEMO_PLAN.md).
 *
 * ANTI-ORACLE RULE: every discard path below returns normally — the router
 * always answers the identical generic 201, so a bot can never learn which
 * defense (honeypot, timing, per-email cap, per-IP cap) caught it. This
 * method must NEVER throw for a business reason.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

const getMinFillMs = (): number =>
  Number(process.env.DEMO_REQUEST_MIN_FILL_MS) > 0
    ? Number(process.env.DEMO_REQUEST_MIN_FILL_MS)
    : 3000;

const getPerEmailPerDay = (): number =>
  Number(process.env.DEMO_REQUEST_PER_EMAIL_PER_DAY) > 0
    ? Number(process.env.DEMO_REQUEST_PER_EMAIL_PER_DAY)
    : 1;

const getPerIpPerDay = (): number =>
  Number(process.env.DEMO_REQUEST_PER_IP_PER_DAY) > 0
    ? Number(process.env.DEMO_REQUEST_PER_IP_PER_DAY)
    : 3;

const getEmailBudgetPerDay = (): number =>
  Number(process.env.DEMO_REQUEST_EMAIL_BUDGET_PER_DAY) > 0
    ? Number(process.env.DEMO_REQUEST_EMAIL_BUDGET_PER_DAY)
    : 20;

const getNotifyEmail = (): string =>
  process.env.DEMO_REQUEST_NOTIFY_EMAIL || "contact@medscribe.health";

export interface IDemoRequestInput {
  fullName: string;
  email: string;
  organization?: string;
  phoneNum?: string;
  message?: string;
  /** Honeypot — humans never see this field; any content = bot. */
  website?: string;
  /** ms between form render and submit (client-supplied heuristic — forgeable). */
  elapsedMs?: number;
}

export interface IDemoRequestMeta {
  ip: string;
  userAgent?: string;
}

@injectable()
export class DemoRequestProvider {
  constructor(
    @inject(DemoRequestService) private demoRequestService: DemoRequestService,
    @inject(MailerService) private mailerService: MailerService
  ) {}

  public async submit(
    input: IDemoRequestInput,
    meta: IDemoRequestMeta,
    dataSource: DataSource
  ): Promise<void> {
    const email = String(input.email ?? "").trim().toLowerCase();
    const ip = (meta.ip || "unknown").slice(0, 64);

    // 1) Honeypot: the hidden "website" field is invisible to humans.
    if (typeof input.website === "string" && input.website.trim() !== "") {
      console.warn(`[DemoRequest] discarded (honeypot) email=${email} ip=${ip}`);
      return;
    }

    // 2) Timing heuristic: real users need a few seconds to fill the form.
    //    Client-supplied and forgeable — the caps below are the real enforcement.
    const elapsedMs = Number(input.elapsedMs);
    if (!Number.isFinite(elapsedMs) || elapsedMs < getMinFillMs()) {
      console.warn(`[DemoRequest] discarded (too-fast ${input.elapsedMs}ms) email=${email} ip=${ip}`);
      return;
    }

    const dayAgo = new Date(Date.now() - DAY_MS);

    // 3) Per-email cap: one accepted request per email per 24h.
    const emailCount = await this.demoRequestService.countByEmailSince(email, dayAgo, dataSource);
    if (emailCount >= getPerEmailPerDay()) {
      console.warn(`[DemoRequest] discarded (per-email cap) email=${email} ip=${ip}`);
      return;
    }

    // 4) Per-IP cap.
    const ipCount = await this.demoRequestService.countByIpSince(ip, dayAgo, dataSource);
    if (ipCount >= getPerIpPerDay()) {
      console.warn(`[DemoRequest] discarded (per-ip cap) email=${email} ip=${ip}`);
      return;
    }

    // 5) Store the lead FIRST — it is never lost even if the email fails.
    const row = await this.demoRequestService.create(
      {
        fullName: String(input.fullName).trim(),
        email,
        organization: this.orNull(input.organization, 160),
        phoneNum: this.orNull(input.phoneNum, 32),
        message: this.orNull(input.message, 2000),
        ip,
        userAgent: this.orNull(meta.userAgent, 512),
      },
      dataSource
    );
    console.log(`[DemoRequest] stored lead ${row.id} email=${email} ip=${ip}`);

    // 6) Global daily email budget: protects the inbox + Mailgun reputation even
    //    against distributed bots. Beyond the budget the lead is stored silently.
    const startOfUtcDay = new Date();
    startOfUtcDay.setUTCHours(0, 0, 0, 0);
    const emailedToday = await this.demoRequestService.countEmailedSince(startOfUtcDay, dataSource);
    if (emailedToday >= getEmailBudgetPerDay()) {
      console.warn(`[DemoRequest] email budget exhausted (${emailedToday} today) — stored ${row.id} without email`);
      return;
    }

    // 7) Notify. Failure keeps the row with emailedAt NULL — still a success to the caller.
    try {
      const text = this.getDemoEmailText(row);
      if (process.env.DEMO_REQUEST_DEV_LOG === "true") {
        console.log(`[DemoRequest][DEV_LOG] would email ${getNotifyEmail()}:\n${text}`);
      }
      await this.mailerService.sendMail({
        to: getNotifyEmail(),
        subject: `New demo request — ${String(input.fullName).trim()}`,
        html: this.getDemoEmailHtml(row),
        text,
      });
      await this.demoRequestService.markEmailed(row.id, dataSource);
    } catch (err: any) {
      console.error(`[DemoRequest] notification email failed for ${row.id}: ${err?.message ?? err}`);
    }
  }

  private orNull(value: unknown, maxLen: number): string | null {
    const s = typeof value === "string" ? value.trim() : "";
    return s === "" ? null : s.slice(0, maxLen);
  }

  /** All user-supplied text lands in a trusted inbox — escape everything. */
  private escapeHtml(value: string | null): string {
    return String(value ?? "—")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  private getDemoEmailHtml(row: {
    fullName: string;
    email: string;
    organization: string | null;
    phoneNum: string | null;
    message: string | null;
    ip: string;
    userAgent: string | null;
    createdAt: Date;
  }): string {
    const field = (label: string, value: string | null) => `
        <tr>
          <td style="padding: 6px 12px 6px 0; font-size: 14px; color: #6b7280; white-space: nowrap; vertical-align: top;">${label}</td>
          <td style="padding: 6px 0; font-size: 14px; color: #111827; line-height: 1.5;">${this.escapeHtml(value)}</td>
        </tr>`;
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New demo request</title>
</head>
<body style="margin: 0; padding: 24px 16px; background-color: #eff6ff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 520px; margin: 0 auto;">
    <tr>
      <td style="padding: 24px 0 8px; text-align: center;">
        <span style="display: inline-block; padding: 8px 16px; background-color: #dbeafe; color: #1d4ed8; font-size: 14px; font-weight: 600; border-radius: 9999px;">LibelusPro</span>
      </td>
    </tr>
    <tr>
      <td style="padding: 16px 0; font-size: 24px; font-weight: 700; color: #111827; text-align: center;">New demo request</td>
    </tr>
    <tr>
      <td style="padding: 24px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px;">
        <table cellpadding="0" cellspacing="0" role="presentation" style="width: 100%;">
${field("Name", row.fullName)}
${field("Email", row.email)}
${field("Organization", row.organization)}
${field("Phone", row.phoneNum)}
${field("Message", row.message)}
${field("Submitted", row.createdAt.toISOString())}
${field("IP", row.ip)}
${field("User agent", row.userAgent)}
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding: 16px 0 0; font-size: 12px; color: #6b7280; text-align: center;">LibelusPro — landing-page demo request. Reply directly to the requester's email above.</td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  private getDemoEmailText(row: {
    fullName: string;
    email: string;
    organization: string | null;
    phoneNum: string | null;
    message: string | null;
    ip: string;
    userAgent: string | null;
    createdAt: Date;
  }): string {
    return [
      `New demo request`,
      ``,
      `Name:         ${row.fullName}`,
      `Email:        ${row.email}`,
      `Organization: ${row.organization ?? "—"}`,
      `Phone:        ${row.phoneNum ?? "—"}`,
      `Message:      ${row.message ?? "—"}`,
      ``,
      `Submitted:    ${row.createdAt.toISOString()}`,
      `IP:           ${row.ip}`,
      `User agent:   ${row.userAgent ?? "—"}`,
    ].join("\n");
  }
}
