import { injectable } from "inversify";
import { DefaultDbDataSource } from "../config/defaultdb.config";
import { DataSourceManager } from "../config/datasource.manager";
import { WaSessionRoutingEntity } from "./waSessionRouting.mDbSchema";
import { WhatsappSessionEntity } from "./whatsappSession.mDbSchema";
import {
  WA_CONV_AWAITING_ID,
  WA_CONV_MAIN_MENU,
  WA_ID_UPLOAD_TTL_MS,
} from "./waSession.constants";
import type { WaLinkedRole } from "./whatsappSession.mDbSchema";

async function ensureDefaultDbInitialized(): Promise<void> {
  if (!DefaultDbDataSource.isInitialized) {
    await DefaultDbDataSource.initialize();
  }
}

@injectable()
export class WaSessionService {
  public async getRoutedInstitutionId(waFrom: string): Promise<string | null> {
    await ensureDefaultDbInitialized();
    const row = await DefaultDbDataSource.getRepository(WaSessionRoutingEntity).findOne({
      where: { waFrom },
    });
    return row?.institutionId ?? null;
  }

  public async setRoutedInstitution(waFrom: string, institutionId: string): Promise<void> {
    await ensureDefaultDbInitialized();
    await DefaultDbDataSource.getRepository(WaSessionRoutingEntity).save({
      waFrom,
      institutionId,
    });
  }

  public async getTenantSession(
    institutionId: string,
    waFrom: string,
  ): Promise<WhatsappSessionEntity | null> {
    const ds = await DataSourceManager.getInstance().getDataSource(institutionId);
    return ds.getRepository(WhatsappSessionEntity).findOne({ where: { waFrom } });
  }

  public async saveTenantSession(
    institutionId: string,
    session: WhatsappSessionEntity,
  ): Promise<void> {
    const ds = await DataSourceManager.getInstance().getDataSource(institutionId);
    await ds.getRepository(WhatsappSessionEntity).save(session);
  }

  /**
   * Loads or creates the per-tenant session row for this WhatsApp sender.
   */
  public async ensureTenantSession(
    institutionId: string,
    waFrom: string,
  ): Promise<WhatsappSessionEntity> {
    const ds = await DataSourceManager.getInstance().getDataSource(institutionId);
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
}
