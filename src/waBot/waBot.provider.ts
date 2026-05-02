import { inject, injectable } from "inversify";
import { WaBotService } from "./waBot.service";
import {
  IWaMessage,
  IWaParsedEvents,
  IWaWebhookPayload,
  WaHandshakeResult,
} from "./waBot.interface";

const NAMESPACE = "WaBot";

/** Users who completed the signup link step and must upload union ID; tutorials sent after upload. */
const ID_UPLOAD_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const awaitingIdUpload = new Map<
  string,
  { role: "candidate" | "supervisor"; expiresAt: number }
>();

function pruneExpiredIdSessions(): void {
  const now = Date.now();
  for (const [phone, v] of awaitingIdUpload) {
    if (v.expiresAt < now) awaitingIdUpload.delete(phone);
  }
}

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
   * Inbound flow: text → main menu → role → signup (2 msgs) → user sends ID image/PDF → under review + tutorials.
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

  private registerAwaitingIdUpload(
    phone: string,
    role: "candidate" | "supervisor",
  ): void {
    pruneExpiredIdSessions();
    awaitingIdUpload.set(phone, {
      role,
      expiresAt: Date.now() + ID_UPLOAD_TTL_MS,
    });
  }

  private takeAwaitingIdRole(
    phone: string,
  ): "candidate" | "supervisor" | undefined {
    pruneExpiredIdSessions();
    const v = awaitingIdUpload.get(phone);
    if (!v || v.expiresAt < Date.now()) {
      awaitingIdUpload.delete(phone);
      return undefined;
    }
    awaitingIdUpload.delete(phone);
    return v.role;
  }

  /** Optional overrides for tutorial / promo links after signup. */
  private tutorialUrls(): {
    candidateDrive: string;
    candidateYoutube: string;
    supervisorDrive: string;
  } {
    return {
      candidateDrive:
        process.env.LIBELUS_TUTORIAL_CANDIDATE_DRIVE_URL ||
        "https://drive.google.com/file/d/1QsYdA_AAo31vgUDDnAvfkDg09c8a5clR/view?usp=sharing",
      candidateYoutube:
        process.env.LIBELUS_TUTORIAL_CANDIDATE_YOUTUBE_URL ||
        "https://www.youtube.com/shorts/vkfg19cfdbg?feature=share",
      supervisorDrive:
        process.env.LIBELUS_TUTORIAL_SUPERVISOR_DRIVE_URL ||
        "https://drive.google.com/file/d/1ipWqBHfVX_i1xD7SoLls_UTq9EPf39Ye/view?usp=sharing",
    };
  }

  /** Message 1 of 2: instructions (WhatsApp *bold* and "- " bullets). */
  private signupInstructionMessage(): string {
    return [
      "*LibelusPro — Account registration*",
      "",
      "Please follow these steps:",
      "",
      "- *Step 1:* Open the *signup link* we send in the next message and complete the form.",
      "- *Step 2:* Enter your union registry number in the field *رقم القيد على كارنيه النقابة*.",
      "- *Step 3:* After registration, send a *photo* or *PDF* of your union ID here in this chat.",
      "",
      "Tutorial videos will be sent *after* we receive your document. Your account will then be *under review*.",
    ].join("\n");
  }

  private async sendCandidateSignupSequence(to: string): Promise<void> {
    const signupUrl = this.signupUrls().candidate;
    await this.waBotService.sendTextMessage(to, this.signupInstructionMessage(), true);
    await this.waBotService.sendTextMessage(
      to,
      `*Your signup link:*\n${signupUrl}`,
      true,
    );
    this.registerAwaitingIdUpload(to, "candidate");
  }

  private async sendSupervisorSignupSequence(to: string): Promise<void> {
    const signupUrl = this.signupUrls().supervisor;
    await this.waBotService.sendTextMessage(to, this.signupInstructionMessage(), true);
    await this.waBotService.sendTextMessage(
      to,
      `*Your signup link:*\n${signupUrl}`,
      true,
    );
    this.registerAwaitingIdUpload(to, "supervisor");
  }

  /** After user sends image or PDF of union ID while session is active. */
  private async sendPostIdSubmissionSequence(
    to: string,
    role: "candidate" | "supervisor",
  ): Promise<void> {
    await this.waBotService.sendTextMessage(
      to,
      [
        "*Thank you — we received your document.*",
        "",
        "Your LibelusPro account is *under review*. Our team will verify your details and follow up as needed.",
        "",
        "Below are tutorial resources you can use while you wait:",
      ].join("\n"),
      true,
    );

    const tut = this.tutorialUrls();
    if (role === "candidate") {
      await this.waBotService.sendTextMessage(
        to,
        [
          "*Coordination tutorial (video):*",
          tut.candidateDrive,
          "",
          "*New AI voice-to-text feature for surgical notes:*",
          tut.candidateYoutube,
        ].join("\n"),
        true,
      );
    } else {
      await this.waBotService.sendTextMessage(
        to,
        ["*Coordination tutorial (video):*", tut.supervisorDrive].join("\n"),
        true,
      );
    }
  }

  private isUnionIdMediaMessage(msg: IWaMessage): boolean {
    if (msg.type === "image") return true;
    if (msg.type === "document") return true;
    return false;
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

    if (this.isUnionIdMediaMessage(msg)) {
      const role = this.takeAwaitingIdRole(from);
      if (role) {
        await this.sendPostIdSubmissionSequence(from, role);
      }
      return;
    }

    const buttonId = this.extractButtonReplyId(msg);
    if (buttonId === BTN_SIGNUP_CANDIDATE) {
      await this.sendCandidateSignupSequence(from);
      return;
    }
    if (buttonId === BTN_SIGNUP_SUPERVISOR) {
      await this.sendSupervisorSignupSequence(from);
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
