/**
 * Meta WhatsApp Cloud API webhook payload shapes.
 * Reference: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples
 */

export interface IWaVerifyQuery {
  "hub.mode": string;
  "hub.verify_token": string;
  "hub.challenge": string;
}

export interface IWaMessage {
  id: string;
  from: string;
  timestamp: string;
  type: string;
  text?: { body?: string };
  // other message-type fields (image, audio, button, interactive, etc.) intentionally
  // left as unknown until handlers are implemented for each type
  [key: string]: unknown;
}

export interface IWaStatus {
  id: string;
  status: string;
  timestamp: string;
  recipient_id: string;
  conversation?: { id?: string; origin?: { type?: string } };
  errors?: Array<{ code?: number; title?: string; message?: string }>;
}

export interface IWaChangeValue {
  messaging_product: "whatsapp";
  metadata?: { display_phone_number?: string; phone_number_id?: string };
  contacts?: Array<{ wa_id?: string; profile?: { name?: string } }>;
  messages?: IWaMessage[];
  statuses?: IWaStatus[];
}

export interface IWaChange {
  field: string;
  value: IWaChangeValue;
}

export interface IWaEntry {
  id: string;
  changes: IWaChange[];
}

export interface IWaWebhookPayload {
  object: string;
  entry: IWaEntry[];
}

export interface IWaParsedEvents {
  messages: IWaMessage[];
  statuses: IWaStatus[];
}

export type WaHandshakeResult =
  | { ok: true; challenge: string }
  | { ok: false; reason: string };
