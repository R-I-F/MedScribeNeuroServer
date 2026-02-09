export type SendMailParams = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
};

export type SendMailPayload = SendMailParams;

