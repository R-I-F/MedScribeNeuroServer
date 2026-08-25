import { inject, injectable } from "inversify";
import { DataSource } from "typeorm";
import { EliminatorProvider } from "./eliminator.provider";
import { IEliminatorReserveInput } from "./eliminator.interface";

/** Thin passthrough (router → controller → provider), matching this codebase's module shape. */
@injectable()
export class EliminatorController {
  constructor(@inject(EliminatorProvider) private eliminatorProvider: EliminatorProvider) {}

  public handleGetState(campaignId: string, dataSource: DataSource) {
    return this.eliminatorProvider.getState(campaignId, dataSource);
  }

  public handleGetSupervisors(campaignId: string, dataSource: DataSource) {
    return this.eliminatorProvider.getSupervisors(campaignId, dataSource);
  }

  public handleGetSupervisorStatus(campaignId: string, supervisorId: string, dataSource: DataSource) {
    return this.eliminatorProvider.getSupervisorStatus(campaignId, supervisorId, dataSource);
  }

  public handleReserve(campaignId: string, input: IEliminatorReserveInput, dataSource: DataSource) {
    return this.eliminatorProvider.reserve(campaignId, input, dataSource);
  }

  public handleGetStateForForm(formId: string, dataSource: DataSource) {
    return this.eliminatorProvider.getStateForForm(formId, dataSource);
  }

  public handleGetSupervisorsForForm(formId: string, dataSource: DataSource) {
    return this.eliminatorProvider.getSupervisorsForForm(formId, dataSource);
  }

  public handleGetSupervisorStatusForForm(formId: string, supervisorId: string, dataSource: DataSource) {
    return this.eliminatorProvider.getSupervisorStatusForForm(formId, supervisorId, dataSource);
  }

  public handleReserveForForm(formId: string, input: IEliminatorReserveInput, dataSource: DataSource) {
    return this.eliminatorProvider.reserveForForm(formId, input, dataSource);
  }
}
