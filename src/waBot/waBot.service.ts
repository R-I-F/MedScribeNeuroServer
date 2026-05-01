import { injectable } from "inversify";
import crypto from "crypto";
import axios, { AxiosError } from "axios";

@injectable()
export class WaBotService {
  private messagesEndpoint(): string {
    const phoneId = process.env.WA_PHONE_NUMBER_ID;
    const version = process.env.WA_GRAPH_API_VERSION || "v25.0";
    if (!phoneId) {
      throw new Error("WA_PHONE_NUMBER_ID is not configured");
    }
    return `https://graph.facebook.com/${version}/${phoneId}/messages`;
  }

  private authHeaders(): Record<string, string> {
    const token = process.env.WA_API_KEY;
    if (!token) {
      throw new Error("WA_API_KEY is not configured");
    }
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }

  /**
   * Sends a plain text message (links in body are clickable when preview_url is true).
   */
  public async sendTextMessage(
    to: string,
    body: string,
    previewUrl = true,
  ): Promise<void> | never {
    try {
      await axios.post(
        this.messagesEndpoint(),
        {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to,
          type: "text",
          text: {
            preview_url: previewUrl,
            body,
          },
        },
        { headers: this.authHeaders() },
      );
    } catch (err: any) {
      this.logGraphError("sendTextMessage", err);
      throw new Error(err);
    }
  }

  /**
   * Sends up to 3 reply buttons (WhatsApp Cloud API limit).
   */
  public async sendInteractiveReplyButtons(
    to: string,
    bodyText: string,
    buttons: Array<{ id: string; title: string }>,
  ): Promise<void> | never {
    if (buttons.length === 0 || buttons.length > 3) {
      throw new Error("sendInteractiveReplyButtons requires 1–3 buttons");
    }
    try {
      await axios.post(
        this.messagesEndpoint(),
        {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to,
          type: "interactive",
          interactive: {
            type: "button",
            body: { text: bodyText },
            action: {
              buttons: buttons.map((b) => ({
                type: "reply",
                reply: {
                  id: b.id,
                  title: b.title.slice(0, 20),
                },
              })),
            },
          },
        },
        { headers: this.authHeaders() },
      );
    } catch (err: any) {
      this.logGraphError("sendInteractiveReplyButtons", err);
      throw new Error(err);
    }
  }

  private logGraphError(op: string, err: unknown): void {
    const ax = err as AxiosError<{ error?: { message?: string; code?: number } }>;
    const status = ax.response?.status;
    const data = ax.response?.data;
    console.error(`[WaBotService] ${op} failed`, {
      status,
      message: ax.message,
      graphError: data?.error ?? data,
    });
  }

  /**
   * Verifies the X-Hub-Signature-256 header sent by Meta against the raw request body
   * using HMAC-SHA256 with the app secret. Uses timing-safe comparison.
   *
   * @param rawBody Raw request body buffer (must be the bytes Meta sent, not re-serialized JSON).
   * @param signatureHeader Value of `X-Hub-Signature-256` header (e.g. "sha256=abc123...").
   * @param appSecret Meta App Secret (from Meta App > Settings > Basic).
   */
  public verifySignature(
    rawBody: Buffer | undefined,
    signatureHeader: string | undefined,
    appSecret: string,
  ): boolean | never {
    try {
      if (!rawBody || !signatureHeader || !appSecret) return false;

      const [scheme, providedHex] = signatureHeader.split("=");
      if (scheme !== "sha256" || !providedHex) return false;

      const expectedHex = crypto
        .createHmac("sha256", appSecret)
        .update(rawBody)
        .digest("hex");

      const expectedBuf = Buffer.from(expectedHex, "hex");
      const providedBuf = Buffer.from(providedHex, "hex");

      if (expectedBuf.length !== providedBuf.length) return false;
      return crypto.timingSafeEqual(expectedBuf, providedBuf);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  /**
   * Constant-time string comparison for the GET handshake verify token.
   */
  public safeEqual(a: string, b: string): boolean | never {
    try {
      const bufA = Buffer.from(a);
      const bufB = Buffer.from(b);
      if (bufA.length !== bufB.length) return false;
      return crypto.timingSafeEqual(bufA, bufB);
    } catch (err: any) {
      throw new Error(err);
    }
  }
}
