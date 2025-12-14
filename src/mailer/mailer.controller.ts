import { inject, injectable } from "inversify";
import { MailerService } from "./mailer.service";
import { SendMailPayload } from "./mailer.interface";

@injectable()
export class MailerController {
  constructor(
    @inject(MailerService) private mailerService: MailerService
  ) {}

  public async handleSendMail(payload: SendMailPayload): Promise<{ to: string }> {
    const { to, subject, text, html, from } = payload;

    await this.mailerService.sendMail({
      from: typeof from === "string" && from.trim().length > 0 ? from.trim() : undefined,
      to: to.trim(),
      subject: subject.trim(),
      text: typeof text === "string" && text.trim().length > 0 ? text.trim() : undefined,
      html: typeof html === "string" && html.trim().length > 0 ? html.trim() : undefined,
    });

    return { to: to.trim() };
  }
}
