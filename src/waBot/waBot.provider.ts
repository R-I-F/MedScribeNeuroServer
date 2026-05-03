import { inject, injectable } from "inversify";
import {
  getAllActiveInstitutions,
  getInstitutionById,
  type IInstitution,
} from "../institution/institution.service";
import { WaBotService } from "./waBot.service";
import { WaSessionService } from "./waSession.service";
import {
  WA_CONV_AWAITING_ID,
  WA_CONV_ROLE_PICK,
  WA_INST_BUTTON_PREFIX,
} from "./waSession.constants";
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
  constructor(
    @inject(WaBotService) private waBotService: WaBotService,
    @inject(WaSessionService) private waSessionService: WaSessionService,
  ) {}

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
   * Inbound flow: institution picker → main menu → role → signup (2 msgs) → user sends ID image/PDF → under review + tutorials.
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

  private async sendCandidateSignupSequence(
    to: string,
    institutionId: string,
  ): Promise<void> {
    const signupUrl = this.signupUrls().candidate;
    await this.waBotService.sendTextMessage(to, this.signupInstructionMessage(), true);
    await this.waBotService.sendTextMessage(
      to,
      `*Your signup link:*\n${signupUrl}`,
      true,
    );
    await this.waSessionService.setAwaitingIdUpload(institutionId, to, "candidate");
  }

  private async sendSupervisorSignupSequence(
    to: string,
    institutionId: string,
  ): Promise<void> {
    const signupUrl = this.signupUrls().supervisor;
    await this.waBotService.sendTextMessage(to, this.signupInstructionMessage(), true);
    await this.waBotService.sendTextMessage(
      to,
      `*Your signup link:*\n${signupUrl}`,
      true,
    );
    await this.waSessionService.setAwaitingIdUpload(institutionId, to, "supervisor");
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

  /** Body text for picker: name plus department when set (disambiguates duplicate names). */
  private formatInstitutionPickerLine(inst: IInstitution): string {
    const dept = (inst.department ?? "").trim();
    if (!dept) return inst.name.trim();
    return `${inst.name.trim()} — ${dept}`;
  }

  /** Reply-button titles are capped at 20 chars by WhatsApp; prefer department/code over long names. */
  private institutionPickerButtonTitle(order: number, inst: IInstitution): string {
    const short =
      (inst.department ?? "").trim() ||
      (inst.code ?? "").trim() ||
      inst.name.trim();
    return `${order}. ${short}`.slice(0, 20);
  }

  /** Opening lines on the first institution-picker message (same voice as the main menu). */
  private institutionPickerFirstMessageIntro(): string[] {
    return [
      "Hello, this is the LibelusPro chat bot.",
      "Please choose your institution below.",
      "",
    ];
  }

  /**
   * Lists active institutions: full names in the body, up to 3 reply buttons per message
   * (Graph API limit). Button ids: `inst_<institutionUuid>`.
   */
  private async sendInstitutionPicker(to: string): Promise<void> {
    const institutions = await getAllActiveInstitutions();
    if (institutions.length === 0) {
      await this.waBotService.sendTextMessage(
        to,
        "No institutions are available at the moment. Please try again later.",
        true,
      );
      return;
    }

    for (let offset = 0; offset < institutions.length; offset += 3) {
      const chunk = institutions.slice(offset, offset + 3);
      const prefix =
        offset === 0
          ? this.institutionPickerFirstMessageIntro()
          : ["More institutions:", ""];
      const bodyLines = [
        ...prefix,
        "*Choose your institution*",
        "",
        ...chunk.map((inst, idx) =>
          `${offset + idx + 1}. ${this.formatInstitutionPickerLine(inst)}`,
        ),
        "",
        "Tap a button below to continue.",
      ];
      const buttons = chunk.map((inst, idx) => ({
        id: `${WA_INST_BUTTON_PREFIX}${inst.id}`,
        title: this.institutionPickerButtonTitle(offset + idx + 1, inst),
      }));
      await this.waBotService.sendInteractiveReplyButtons(to, bodyLines.join("\n"), buttons);
    }
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

    const routedInstitutionId = await this.waSessionService.getRoutedInstitutionId(from);

    if (this.isUnionIdMediaMessage(msg)) {
      if (!routedInstitutionId) {
        await this.waBotService.sendTextMessage(
          from,
          "Please choose your institution first by sending a text message.",
          true,
        );
        return;
      }
      let session = await this.waSessionService.ensureTenantSession(routedInstitutionId, from);
      session = await this.waSessionService.expireAwaitingIdIfNeeded(
        routedInstitutionId,
        session,
      );
      if (session.conversationState !== WA_CONV_AWAITING_ID) {
        return;
      }
      const role =
        session.linkedRole === "candidate" || session.linkedRole === "supervisor"
          ? session.linkedRole
          : undefined;
      if (!role) {
        return;
      }
      await this.sendPostIdSubmissionSequence(from, role);
      await this.waSessionService.clearAfterIdSubmission(routedInstitutionId, from);
      return;
    }

    const buttonId = this.extractButtonReplyId(msg);

    if (buttonId?.startsWith(WA_INST_BUTTON_PREFIX)) {
      const institutionId = buttonId.slice(WA_INST_BUTTON_PREFIX.length);
      const inst = await getInstitutionById(institutionId);
      if (!inst) {
        await this.waBotService.sendTextMessage(
          from,
          "That institution is not available. Please open the list again from a text message.",
          true,
        );
        return;
      }
      await this.waSessionService.setRoutedInstitution(from, institutionId);
      await this.waSessionService.ensureTenantSession(institutionId, from);
      await this.sendMainMenuPrompt(from);
      return;
    }

    if (!routedInstitutionId) {
      if (
        buttonId === BTN_SIGNUP_CANDIDATE ||
        buttonId === BTN_SIGNUP_SUPERVISOR ||
        buttonId === BTN_CREATE_ACCOUNT
      ) {
        await this.sendInstitutionPicker(from);
        return;
      }
      if (msg.type === "text") {
        const body = (msg.text?.body ?? "").trim();
        if (body.length === 0) return;
        await this.sendInstitutionPicker(from);
      }
      return;
    }

    const tenantSession = await this.waSessionService.ensureTenantSession(
      routedInstitutionId,
      from,
    );
    await this.waSessionService.expireAwaitingIdIfNeeded(routedInstitutionId, tenantSession);

    if (buttonId === BTN_SIGNUP_CANDIDATE) {
      await this.sendCandidateSignupSequence(from, routedInstitutionId);
      return;
    }
    if (buttonId === BTN_SIGNUP_SUPERVISOR) {
      await this.sendSupervisorSignupSequence(from, routedInstitutionId);
      return;
    }
    if (buttonId === BTN_CREATE_ACCOUNT) {
      await this.waSessionService.setConversationState(
        routedInstitutionId,
        from,
        WA_CONV_ROLE_PICK,
      );
      await this.sendSignupRolePrompt(from);
      return;
    }

    if (msg.type === "text") {
      const body = (msg.text?.body ?? "").trim();
      if (body.length === 0) return;
      await this.waSessionService.resetToMainMenu(routedInstitutionId, from);
      await this.sendMainMenuPrompt(from);
    }
  }
}
