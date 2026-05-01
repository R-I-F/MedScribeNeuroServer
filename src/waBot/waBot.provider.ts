import { inject, injectable } from "inversify";
import { WaBotService } from "./waBot.service";
import {
  IWaParsedEvents,
  IWaWebhookPayload,
  WaHandshakeResult,
} from "./waBot.interface";

const NAMESPACE = "WaBot";

/**
 * Express / `qs` may represent Meta's `hub.*` query params as either flat keys
 * (`"hub.mode"`) or a nested `hub` object. `express-validator` `matchedData()` can
 * also drop dotted keys, so we always read from the raw query object.
 */
function pickHubQueryString(
  q: Record<string, unknown>,
  dottedKey: string,
  nestedKey: string,
): string | undefined {
  const flat = q[dottedKey];
  if (typeof flat === "string" && flat.length > 0) return flat;
  if (Array.isArray(flat) && typeof flat[0] === "string") return flat[0];

  const hub = q.hub;
  if (hub && typeof hub === "object" && !Array.isArray(hub)) {
    const nest = (hub as Record<string, unknown>)[nestedKey];
    if (typeof nest === "string" && nest.length > 0) return nest;
    if (Array.isArray(nest) && typeof nest[0] === "string") return nest[0];
  }
  return undefined;
}

@injectable()
export class WaBotProvider {
  constructor(@inject(WaBotService) private waBotService: WaBotService) {}

  /**
   * Validates Meta's GET handshake. Returns the challenge to echo back when valid.
   * Fails closed if env config is missing.
   */
  public handleVerification(query: Record<string, unknown>): WaHandshakeResult | never {
    try {
      const verifyToken = process.env.WA_VERIFY_TOKEN;
      if (!verifyToken) {
        console.error(`[${NAMESPACE}] Missing WA_VERIFY_TOKEN env var`);
        return { ok: false, reason: "server_misconfigured" };
      }

      const mode = pickHubQueryString(query, "hub.mode", "mode");
      const token = pickHubQueryString(query, "hub.verify_token", "verify_token");
      const challenge = pickHubQueryString(query, "hub.challenge", "challenge");

      if (mode !== "subscribe") {
        return { ok: false, reason: "invalid_mode" };
      }

      if (!token || !this.waBotService.safeEqual(token, verifyToken)) {
        return { ok: false, reason: "invalid_verify_token" };
      }

      if (typeof challenge !== "string" || challenge.length === 0) {
        return { ok: false, reason: "missing_challenge" };
      }

      return { ok: true, challenge };
    } catch (err: any) {
      throw new Error(err);
    }
  }

  /**
   * Verifies the inbound webhook signature against the raw body.
   * Fails closed if WA_APP_SECRET is missing.
   */
  public verifyInboundSignature(
    rawBody: Buffer | undefined,
    signatureHeader: string | undefined,
  ): { ok: boolean; reason?: string } | never {
    try {
      const appSecret = process.env.WA_APP_SECRET;
      if (!appSecret) {
        console.error(`[${NAMESPACE}] Missing WA_APP_SECRET env var`);
        return { ok: false, reason: "server_misconfigured" };
      }

      if (!signatureHeader) {
        return { ok: false, reason: "missing_signature" };
      }

      const valid = this.waBotService.verifySignature(
        rawBody,
        signatureHeader,
        appSecret,
      );
      return valid ? { ok: true } : { ok: false, reason: "invalid_signature" };
    } catch (err: any) {
      throw new Error(err);
    }
  }

  /**
   * Flattens the nested entry/changes/value structure into simple message and status arrays
   * for easier downstream handling and logging.
   */
  public parseEvents(payload: IWaWebhookPayload): IWaParsedEvents | never {
    try {
      const messages: IWaParsedEvents["messages"] = [];
      const statuses: IWaParsedEvents["statuses"] = [];

      const entries = Array.isArray(payload?.entry) ? payload.entry : [];
      for (const entry of entries) {
        const changes = Array.isArray(entry?.changes) ? entry.changes : [];
        for (const change of changes) {
          const value = change?.value;
          if (!value) continue;
          if (Array.isArray(value.messages)) messages.push(...value.messages);
          if (Array.isArray(value.statuses)) statuses.push(...value.statuses);
        }
      }

      return { messages, statuses };
    } catch (err: any) {
      throw new Error(err);
    }
  }

  /**
   * Logs structured info for inbound events. Acts as a placeholder until per-type
   * handlers (text, button, interactive, etc.) and DB persistence are added.
   */
  public dispatchEvents(events: IWaParsedEvents): void {
    try {
      for (const msg of events.messages) {
        console.log(`[${NAMESPACE}] inbound message`, {
          id: msg.id,
          from: msg.from,
          type: msg.type,
          text: msg.text?.body,
          timestamp: msg.timestamp,
        });
      }
      for (const status of events.statuses) {
        console.log(`[${NAMESPACE}] message status`, {
          id: status.id,
          status: status.status,
          recipient_id: status.recipient_id,
          timestamp: status.timestamp,
        });
      }
    } catch (err: any) {
      console.error(`[${NAMESPACE}] dispatchEvents error`, err);
    }
  }
}
