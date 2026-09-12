import { inject, injectable } from "inversify";
import { DataSource } from "typeorm";
import { JournalEliminatorProvider } from "./journalEliminator.provider";
import { IJournalReserveInput } from "./journalEliminator.interface";

/** Thin passthrough (router to controller to provider), matching this codebase's module shape. */
@injectable()
export class JournalEliminatorController {
  constructor(@inject(JournalEliminatorProvider) private provider: JournalEliminatorProvider) {}

  public handleGetState(candidateId: string, dataSource: DataSource) {
    return this.provider.getState(candidateId, dataSource);
  }

  public handleReserve(candidateId: string, input: IJournalReserveInput, dataSource: DataSource) {
    return this.provider.reserve(candidateId, input, dataSource);
  }

  public handleListCampaigns(dataSource: DataSource) {
    return this.provider.listCampaignsForAdmin(dataSource);
  }

  public handleSetOpen(campaignId: string, open: boolean, dataSource: DataSource) {
    return this.provider.setJournalsOpen(campaignId, open, dataSource);
  }
}
