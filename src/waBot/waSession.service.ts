import { injectable } from "inversify";
import { AppDataSource, initializeDatabase } from "../config/database.config";
import { getInstitution } from "../institution/institution.service";
import { WhatsappSessionEntity } from "./whatsappSession.mDbSchema";
import {
  WA_CONV_AWAITING_ID,
  WA_CONV_MAIN_MENU,
  WA_CONV_USER_HOME,
  WA_ID_UPLOAD_TTL_MS,
} from "./waSession.constants";
import type { WaLinkedRole } from "./whatsappSession.mDbSchema";

export interface IWaLinkUserInput {
  role: Extract<WaLinkedRole, "candidate" | "supervisor">;
  userId: string;
  candidateId?: string | null;
  supervisorId?: string | null;
}

@injectable()
export class WaSessionService {
  /**
   * Single-institution (KA spoke) mode: every WhatsApp sender routes to the one static
   * institution. The former defaultdb `wa_session_routing` lookup table is gone.
   */
  public async getRoutedInstitutionId(_waFrom: string): Promise<string | null> {
    return (await getInstitution()).id;
  }

  /** The single KA database. There is one institution, so no per-tenant routing. */
  private async ds() {
    if (!AppDataSource.isInitialized) {
      await initializeDatabase();
    }
    return AppDataSource;
  }

  /** No-op in single-institution mode — there is only one tenant to route to. */
  public async setRoutedInstitution(_waFrom: string, _institutionId: string): Promise<void> {
    // intentionally no-op
  }

  public async getTenantSession(
    institutionId: string,
    waFrom: string,
  ): Promise<WhatsappSessionEntity | null> {
    const ds = await this.ds();
    return ds.getRepository(WhatsappSessionEntity).findOne({ where: { waFrom } });
  }

  public async saveTenantSession(
    institutionId: string,
    session: WhatsappSessionEntity,
  ): Promise<void> {
    const ds = await this.ds();
    await ds.getRepository(WhatsappSessionEntity).save(session);
  }

  /**
   * Loads or creates the per-tenant session row for this WhatsApp sender.
   */
  public async ensureTenantSession(
    institutionId: string,
    waFrom: string,
  ): Promise<WhatsappSessionEntity> {
    const ds = await this.ds();
    const repo = ds.getRepository(WhatsappSessionEntity);
    let row = await repo.findOne({ where: { waFrom } });
    if (!row) {
      row = repo.create({
        waFrom,
        linkedUserId: null,
        linkedRole: "unknown",
        linkedCandidateId: null,
        linkedSupervisorId: null,
        conversationState: WA_CONV_MAIN_MENU,
        contextJson: null,
        expiresAt: null,
      });
      row = await repo.save(row);
    }
    return row;
  }

  /**
   * If awaiting_id_upload TTL passed, reset to main_menu (mirrors prior in-memory prune).
   */
  public async expireAwaitingIdIfNeeded(
    institutionId: string,
    session: WhatsappSessionEntity,
  ): Promise<WhatsappSessionEntity> {
    if (session.conversationState !== WA_CONV_AWAITING_ID) {
      return session;
    }
    if (!session.expiresAt || session.expiresAt.getTime() >= Date.now()) {
      return session;
    }
    session.conversationState = WA_CONV_MAIN_MENU;
    session.expiresAt = null;
    session.linkedRole = "unknown";
    await this.saveTenantSession(institutionId, session);
    return session;
  }

  public async setConversationState(
    institutionId: string,
    waFrom: string,
    state: string,
  ): Promise<WhatsappSessionEntity> {
    const session = await this.ensureTenantSession(institutionId, waFrom);
    session.conversationState = state;
    await this.saveTenantSession(institutionId, session);
    return session;
  }

  public async resetToMainMenu(
    institutionId: string,
    waFrom: string,
  ): Promise<WhatsappSessionEntity> {
    const session = await this.ensureTenantSession(institutionId, waFrom);
    session.conversationState = WA_CONV_MAIN_MENU;
    session.expiresAt = null;
    await this.saveTenantSession(institutionId, session);
    return session;
  }

  public async setAwaitingIdUpload(
    institutionId: string,
    waFrom: string,
    role: Extract<WaLinkedRole, "candidate" | "supervisor">,
  ): Promise<void> {
    const session = await this.ensureTenantSession(institutionId, waFrom);
    session.conversationState = WA_CONV_AWAITING_ID;
    session.linkedRole = role;
    session.expiresAt = new Date(Date.now() + WA_ID_UPLOAD_TTL_MS);
    await this.saveTenantSession(institutionId, session);
  }

  public async clearAfterIdSubmission(
    institutionId: string,
    waFrom: string,
  ): Promise<void> {
    const session = await this.ensureTenantSession(institutionId, waFrom);
    session.conversationState = WA_CONV_MAIN_MENU;
    session.expiresAt = null;
    session.linkedRole = "unknown";
    await this.saveTenantSession(institutionId, session);
  }

  /**
   * Persist the matched candidate/supervisor on the tenant `whatsapp_sessions` row and
   * advance state to `user_home` (placeholder until the real user menu lands).
   */
  public async linkUser(
    institutionId: string,
    waFrom: string,
    input: IWaLinkUserInput,
  ): Promise<void> {
    const session = await this.ensureTenantSession(institutionId, waFrom);
    session.linkedRole = input.role;
    session.linkedUserId = input.userId;
    session.linkedCandidateId = input.candidateId ?? null;
    session.linkedSupervisorId = input.supervisorId ?? null;
    session.conversationState = WA_CONV_USER_HOME;
    session.expiresAt = null;
    await this.saveTenantSession(institutionId, session);
  }
}
