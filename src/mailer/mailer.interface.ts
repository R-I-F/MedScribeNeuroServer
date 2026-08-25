export type SendMailParams = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  cc?: string;
};

export type SendMailPayload = SendMailParams;

