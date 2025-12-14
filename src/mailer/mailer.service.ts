import { injectable } from "inversify";
import nodemailer, { Transporter } from "nodemailer";
import { MailerEnvKeys, SendMailParams } from "./mailer.interface";

@injectable()
export class MailerService {
  private readonly transporter: Transporter;

  constructor() {
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

    this.transporter.verify((error) => {
      if (error) {
        console.error("[MailerService] Transporter verification failed:", error);
      }
    });
  }

  public async sendMail({ from, to, subject, text, html }: SendMailParams) {
    const fromAddress = from ?? process.env.EMAIL_USER;

    if (!fromAddress) {
      throw new Error("Missing 'from' address for email.");
    }

    return this.transporter.sendMail({
      from: fromAddress,
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