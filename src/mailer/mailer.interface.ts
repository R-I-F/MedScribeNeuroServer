export type MailerEnvKeys =
  | "EMAIL_PASS"
  | "EMAIL_USER"
  | "EMAIL_SERVER"
  | "EMAIL_SMTP_PORT";

export type SendMailParams = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
};

export type SendMailPayload = SendMailParams;

