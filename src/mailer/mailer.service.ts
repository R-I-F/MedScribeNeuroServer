import { injectable } from "inversify";
import FormData from "form-data";
import Mailgun, { MailgunMessageData } from "mailgun.js";
import { SendMailParams } from "./mailer.interface";

const MAILGUN_EU_API = "https://api.eu.mailgun.net";

@injectable()
export class MailerService {
  constructor() {}

  private getMailgunClient() {
    const mailgun = new Mailgun(FormData);
    return mailgun.client({
      username: "api",
      key: process.env.MAILGUN_API_KEY!,
      url: process.env.MAILGUN_API_BASE || MAILGUN_EU_API,
    });
  }

  /**
   * Mailgun expects the sending domain only (e.g. mailer.example.com), not a full email.
   * If MAILGUN_DOMAIN was set to an email (e.g. noreply@mailer.example.com), extract the domain.
   */
  private resolveMailgunDomain(domain: string): { domain: string; fromAddress: string } {
    const trimmed = domain.trim();
    if (trimmed.includes("@")) {
      const domainPart = trimmed.split("@")[1];
      if (domainPart) {
        console.warn("[Mailer] MAILGUN_DOMAIN should be the domain only (e.g. mailer.example.com). Detected email format; using domain part:", domainPart);
        return { domain: domainPart, fromAddress: trimmed };
      }
    }
    return { domain: trimmed, fromAddress: `noreply@${trimmed}` };
  }

  public async sendMail(params: SendMailParams): Promise<{ messageId?: string }> {
    const { from, to, subject, text, html } = params;
    const apiKey = process.env.MAILGUN_API_KEY;
    const domainRaw = process.env.MAILGUN_DOMAIN;
    if (!apiKey || !domainRaw) {
      console.error("[Mailer] Missing config: MAILGUN_API_KEY=", !!apiKey, "MAILGUN_DOMAIN=", !!domainRaw);
      throw new Error(
        "Mailer requires MAILGUN_API_KEY and MAILGUN_DOMAIN. Set both in your environment."
      );
    }
    const { domain, fromAddress: defaultFrom } = this.resolveMailgunDomain(domainRaw);
    // Use MAILGUN_DOMAIN-derived sender (noreply@MAILGUN_DOMAIN) unless caller provides explicit from
    const fromAddress = from ?? defaultFrom;
    try {
      const mg = this.getMailgunClient();
      const messageData: MailgunMessageData = {
        from: fromAddress,
        to: [to],
        subject,
        text: text ?? "",
        html,
      };
      const data = await mg.messages.create(domain, messageData);
      const id = (data as { id?: string })?.id;
      return { messageId: id };
    } catch (err: any) {
      console.error("[Mailer] Mailgun error:", err?.message ?? err);
      if (err?.response?.body || err?.status) {
        console.error("[Mailer] Mailgun response:", err.status, err.response?.body);
      }
      throw err;
    }
  }
}
