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

  public async sendMail(params: SendMailParams): Promise<{ messageId?: string }> {
    const { from, to, subject, text, html } = params;
    const apiKey = process.env.MAILGUN_API_KEY;
    const domain = process.env.MAILGUN_DOMAIN;
    if (!apiKey || !domain) {
      throw new Error(
        "Mailer requires MAILGUN_API_KEY and MAILGUN_DOMAIN. Set both in your environment."
      );
    }
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
}
