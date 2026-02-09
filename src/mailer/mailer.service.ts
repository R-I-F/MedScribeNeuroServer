import { injectable } from "inversify";
import FormData from "form-data";
import Mailgun, { MailgunMessageData } from "mailgun.js";
import nodemailer, { Transporter } from "nodemailer";
import { MailerEnvKeys, SendMailParams } from "./mailer.interface";

const MAILGUN_EU_API = "https://api.eu.mailgun.net";

@injectable()
export class MailerService {
  private transporter: Transporter | null = null;

  constructor() {
    // Lazy init: do not create transporter or touch env at startup so PaaS (e.g. Railway)
    // does not hit SMTP timeouts or missing env and SIGTERM.
  }

  private useMailgunApi(): boolean {
    return !!(process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN);
  }

  private getMailgunClient() {
    const mailgun = new Mailgun(FormData);
    return mailgun.client({
      username: "api",
      key: process.env.MAILGUN_API_KEY!,
      url: process.env.MAILGUN_API_BASE || MAILGUN_EU_API,
    });
  }

  private async sendViaMailgunApi({ from, to, subject, text, html }: SendMailParams): Promise<{ messageId?: string }> {
    const domain = process.env.MAILGUN_DOMAIN;
    if (!domain) throw new Error("MAILGUN_DOMAIN is required for Mailgun API.");
    const fromAddress = from ?? process.env.EMAIL_USER ?? `noreply@${domain}`;
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
  }

  private getTransporter(): Transporter {
    if (this.transporter) return this.transporter;
    this.ensureEnvVars(["EMAIL_PASS", "EMAIL_USER", "EMAIL_SERVER", "EMAIL_SMTP_PORT"]);
    const smtpPort = this.parsePort(process.env.EMAIL_SMTP_PORT);
    const secure = smtpPort === 465;
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER,
      port: smtpPort,
      secure,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    return this.transporter;
  }

  public async sendMail(params: SendMailParams) {
    const { from, to, subject, text, html } = params;
    const fromAddress = from ?? process.env.EMAIL_USER;
    if (!fromAddress && !this.useMailgunApi()) {
      throw new Error("Missing 'from' address for email.");
    }

    if (this.useMailgunApi()) {
      return this.sendViaMailgunApi({ from: fromAddress ?? undefined, to, subject, text, html });
    }

    return this.getTransporter().sendMail({
      from: fromAddress!,
      to,
      subject,
      text,
      html,
    });
  }

  private ensureEnvVars(keys: MailerEnvKeys[]) {
    const missingKeys = keys.filter((key) => !process.env[key]);

    if (missingKeys.length > 0) {
      throw new Error(
        `Missing required mailer environment variables: ${missingKeys.join(", ")}`
      );
    }
  }

  private parsePort(portValue: string | undefined, fallback = 465): number {
    if (!portValue) {
      return fallback;
    }

    const parsed = Number(portValue);

    if (Number.isNaN(parsed)) {
      throw new Error(`Invalid EMAIL_SMTP_PORT value: ${portValue}`);
    }

    return parsed;
  }
}