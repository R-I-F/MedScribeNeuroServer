import { inject, injectable } from "inversify";
import { WaBotService } from "./waBot.service";
import {
  IWaMessage,
  IWaParsedEvents,
  IWaWebhookPayload,
  WaHandshakeResult,
} from "./waBot.interface";

const NAMESPACE = "WaBot";

/** Reply button ids we send; must match inbound `interactive.button_reply.id`. */
const BTN_SIGNUP_CANDIDATE = "signup_candidate";
const BTN_SIGNUP_SUPERVISOR = "signup_supervisor";
/** Reserved for a future main-menu “Create account” button. */
const BTN_CREATE_ACCOUNT = "create_account";

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
   * Inbound flow: any text → main menu (“Create new account”) → role picker → signup URL.
   */
  public async handleInboundMessages(events: IWaParsedEvents): Promise<void> {
    try {
      for (const status of events.statuses) {
        console.log(`[${NAMESPACE}] message status`, {
          id: status.id,
          status: status.status,
          recipient_id: status.recipient_id,
          timestamp: status.timestamp,
        });
      }

      for (const msg of events.messages) {
        try {
          await this.handleOneInboundMessage(msg);
        } catch (err: any) {
          console.error(`[${NAMESPACE}] handleOneInboundMessage failed`, {
            id: msg.id,
            err: err?.message ?? err,
          });
        }
      }
    } catch (err: any) {
      console.error(`[${NAMESPACE}] handleInboundMessages error`, err);
    }
  }

  private signupUrls(): { candidate: string; supervisor: string } {
    return {
      candidate:
        process.env.LIBELUS_SIGNUP_CANDIDATE_URL ||
        "https://www.libeluspro.com/signup/candidate",
      supervisor:
        process.env.LIBELUS_SIGNUP_SUPERVISOR_URL ||
        "https://www.libeluspro.com/signup/supervisor",
    };
  }

  private extractButtonReplyId(msg: IWaMessage): string | undefined {
    if (msg.type !== "interactive") return undefined;
    const inter = msg.interactive as
      | { type?: string; button_reply?: { id?: string } }
      | undefined;
    if (inter?.button_reply?.id) return inter.button_reply.id;
    return undefined;
  }

  /** Step 1: greeting + single entry point for account creation. */
  private async sendMainMenuPrompt(to: string): Promise<void> {
    await this.waBotService.sendInteractiveReplyButtons(
      to,
      "Hello, this is the LibelusPro chat bot. Please choose an option from the list.",
      [{ id: BTN_CREATE_ACCOUNT, title: "Create new account" }],
    );
  }

  /** Step 2: after user taps “Create new account”. */
  private async sendSignupRolePrompt(to: string): Promise<void> {
    await this.waBotService.sendInteractiveReplyButtons(
      to,
      "Please choose a role:",
      [
        { id: BTN_SIGNUP_CANDIDATE, title: "Candidate" },
        { id: BTN_SIGNUP_SUPERVISOR, title: "Supervisor" },
      ],
    );
  }

  private async handleOneInboundMessage(msg: IWaMessage): Promise<void> {
    console.log(`[${NAMESPACE}] inbound message`, {
      id: msg.id,
      from: msg.from,
      type: msg.type,
      text: msg.text?.body,
      timestamp: msg.timestamp,
    });

    const from = msg.from;
    if (!from) return;

    const buttonId = this.extractButtonReplyId(msg);
    if (buttonId === BTN_SIGNUP_CANDIDATE) {
      const url = this.signupUrls().candidate;
      await this.waBotService.sendTextMessage(
        from,
        `Open this link to create your LibelusPro account:\n${url}`,
      );
      return;
    }
    if (buttonId === BTN_SIGNUP_SUPERVISOR) {
      const url = this.signupUrls().supervisor;
      await this.waBotService.sendTextMessage(
        from,
        `Open this link to create your LibelusPro account:\n${url}`,
      );
      return;
    }
    if (buttonId === BTN_CREATE_ACCOUNT) {
      await this.sendSignupRolePrompt(from);
      return;
    }

    if (msg.type === "text") {
      const body = (msg.text?.body ?? "").trim();
      if (body.length === 0) return;
      await this.sendMainMenuPrompt(from);
    }
  }
}
