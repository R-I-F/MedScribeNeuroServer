import { inject, injectable } from "inversify";
import { DataSource } from "typeorm";
import { Request, Response } from "express";
import { IBundlerDoc, ICandidateDashboardDoc } from "./bundler.interface";
import { ConsumablesProvider } from "../consumables/consumables.provider";
import { EquipmentProvider } from "../equipment/equipment.provider";
import { ApproachesProvider } from "../approaches/approaches.provider";
import { RegionsProvider } from "../regions/regions.provider";
import { PositionsProvider } from "../positions/positions.provider";
import { SubController } from "../sub/sub.controller";
import { EventController } from "../event/event.controller";
import { ActivityTimelineController } from "../activityTimeline/activityTimeline.controller";

/**
 * Provider for bundled endpoints: references (GET /references) and candidate dashboard (GET /candidate/dashboard).
 * References: caches per institution; cache invalidated only on process restart.
 * Candidate dashboard: no caching; data is per-candidate and subject to change.
 */
@injectable()
export class BundlerProvider {
  private readonly cache = new Map<string, IBundlerDoc>();
  private readonly loadPromises = new Map<string, Promise<IBundlerDoc>>();

  constructor(
    @inject(ConsumablesProvider) private consumablesProvider: ConsumablesProvider,
    @inject(EquipmentProvider) private equipmentProvider: EquipmentProvider,
    @inject(ApproachesProvider) private approachesProvider: ApproachesProvider,
    @inject(RegionsProvider) private regionsProvider: RegionsProvider,
    @inject(PositionsProvider) private positionsProvider: PositionsProvider,
    @inject(SubController) private subController: SubController,
    @inject(EventController) private eventController: EventController,
    @inject(ActivityTimelineController) private activityTimelineController: ActivityTimelineController
  ) {}

  public async getAll(dataSource: DataSource, institutionId: string): Promise<IBundlerDoc> {
    const cached = this.cache.get(institutionId);
    if (cached) {
      return cached;
    }

    const inProgress = this.loadPromises.get(institutionId);
    if (inProgress) {
      return inProgress;
    }

    const loadPromise = this.loadAndCache(dataSource, institutionId);
    this.loadPromises.set(institutionId, loadPromise);

    try {
      const result = await loadPromise;
      this.cache.set(institutionId, result);
      this.loadPromises.delete(institutionId);
      return result;
    } catch (error) {
      this.loadPromises.delete(institutionId);
      throw error;
    }
  }

  private async loadAndCache(dataSource: DataSource, institutionId: string): Promise<IBundlerDoc> {
    const [consumables, equipment, approaches, regions, positions] = await Promise.all([
      this.consumablesProvider.getAll(dataSource),
      this.equipmentProvider.getAll(dataSource),
      this.approachesProvider.getAll(dataSource),
      this.regionsProvider.getAll(dataSource),
      this.positionsProvider.getAll(dataSource),
    ]);

    return {
      consumables,
      equipment,
      approaches,
      regions,
      positions,
    };
  }

  /**
   * Candidate dashboard bundle: aggregates 9 candidate endpoints into one response.
   * No server-side caching.
   */
  public async getCandidateDashboard(req: Request, res: Response): Promise<ICandidateDashboardDoc> {
    const [
      stats,
      points,
      submissions,
      cptAnalytics,
      icdAnalytics,
      supervisorAnalytics,
      activityTimeline,
      submissionRanking,
      academicRanking,
    ] = await Promise.all([
      this.subController.handleGetCandidateSubmissionsStats(req, res),
      this.eventController.handleGetMyPoints(req, res),
      this.subController.handleGetCandidateSubmissions(req, res),
      this.subController.handleGetCptAnalytics(req, res),
      this.subController.handleGetIcdAnalytics(req, res),
      this.subController.handleGetSupervisorAnalytics(req, res),
      this.activityTimelineController.handleGetActivityTimeline(req, res),
      this.subController.handleGetSubmissionRanking(req, res),
      this.eventController.handleGetAcademicRanking(req, res),
    ]);

    return {
      stats,
      points,
      submissions,
      cptAnalytics,
      icdAnalytics,
      supervisorAnalytics,
      activityTimeline: activityTimeline as { items: unknown[] },
      submissionRanking,
      academicRanking,
    };
  }
}
