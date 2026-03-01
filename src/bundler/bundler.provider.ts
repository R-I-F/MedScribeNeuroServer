import { inject, injectable } from "inversify";
import { DataSource } from "typeorm";
import { Request, Response } from "express";
import { IBundlerDoc, ICandidateDashboardDoc, IPracticalCandidateDashboardDoc } from "./bundler.interface";
import { ConsumablesProvider } from "../consumables/consumables.provider";
import { EquipmentProvider } from "../equipment/equipment.provider";
import { ApproachesProvider } from "../approaches/approaches.provider";
import { RegionsProvider } from "../regions/regions.provider";
import { PositionsProvider } from "../positions/positions.provider";
import { SubController } from "../sub/sub.controller";
import { SubProvider } from "../sub/sub.provider";
import { toCandidateSubmissionsResponse } from "../sub/sub.mapper";
import { ISubDoc } from "../sub/interfaces/sub.interface";
import { EventController } from "../event/event.controller";
import { ActivityTimelineController } from "../activityTimeline/activityTimeline.controller";
import { ClinicalSubController } from "../clinicalSub/clinicalSub.controller";
import { IInstitution } from "../institution/institution.service";

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
    @inject(SubProvider) private subProvider: SubProvider,
    @inject(EventController) private eventController: EventController,
    @inject(ActivityTimelineController) private activityTimelineController: ActivityTimelineController,
    @inject(ClinicalSubController) private clinicalSubController: ClinicalSubController
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
   * Single submission load per request: fetches submissions once, then derives stats, list, CPT, ICD, supervisor analytics in memory.
   * When institution.isClinical is true, also includes clinicalSubCand (GET /clinicalSub/cand).
   * No server-side caching.
   */
  public async getCandidateDashboard(
    req: Request,
    res: Response,
    institution: IInstitution
  ): Promise<ICandidateDashboardDoc> {
    const dataSource = (req as any).institutionDataSource as DataSource;
    if (!dataSource) {
      throw new Error("Institution DataSource not resolved");
    }
    const jwt = res.locals.jwt as { id?: string; _id?: string; role?: string } | undefined;
    const candidateId = jwt?.id ?? jwt?._id;
    const role = jwt?.role ?? "candidate";
    if (!candidateId) {
      throw new Error("Unauthorized: No candidate ID found in token");
    }

    const subs = await this.subProvider.getCandidateSubmissions(candidateId, dataSource);
    const approved = subs.filter((s: ISubDoc) => s.subStatus === "approved");
    const stats = this.subProvider.getCandidateSubmissionsStatsFromSubs(subs);
    const submissions = toCandidateSubmissionsResponse(subs as unknown as Record<string, unknown>[]);
    const cptAnalytics = this.subProvider.getCptAnalyticsFromSubs(approved, role);
    const icdAnalytics = this.subProvider.getIcdAnalyticsFromSubs(approved);
    const supervisorAnalytics = this.subProvider.getSupervisorAnalyticsFromSubs(approved);

    const clinicalPromise = institution.isClinical
      ? this.clinicalSubController.handleGetMine(req, res)
      : Promise.resolve(null as unknown[] | null);

    const [points, activityTimeline, submissionRanking, academicRanking, clinicalSubCand] = await Promise.all([
      this.eventController.handleGetMyPoints(req, res),
      this.activityTimelineController.handleGetActivityTimeline(req, res),
      this.subController.handleGetSubmissionRanking(req, res),
      this.eventController.handleGetAcademicRanking(req, res),
      clinicalPromise,
    ]);

    const result: ICandidateDashboardDoc = {
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
    if (institution.isClinical && clinicalSubCand != null) {
      result.clinicalSubCand = clinicalSubCand as unknown[];
    }
    return result;
  }

  /**
   * Practical-only dashboard bundle: stats, submissions, cpt/icd/supervisor analytics,
   * activity timeline, submission ranking. No points or academic ranking.
   * Single submission load per request; no server-side caching.
   */
  public async getCandidateDashboardPractical(req: Request, res: Response): Promise<IPracticalCandidateDashboardDoc> {
    const dataSource = (req as any).institutionDataSource as DataSource;
    if (!dataSource) {
      throw new Error("Institution DataSource not resolved");
    }
    const jwt = res.locals.jwt as { id?: string; _id?: string; role?: string } | undefined;
    const candidateId = jwt?.id ?? jwt?._id;
    const role = jwt?.role ?? "candidate";
    if (!candidateId) {
      throw new Error("Unauthorized: No candidate ID found in token");
    }

    const subs = await this.subProvider.getCandidateSubmissions(candidateId, dataSource);
    const approved = subs.filter((s: ISubDoc) => s.subStatus === "approved");
    const stats = this.subProvider.getCandidateSubmissionsStatsFromSubs(subs);
    const submissions = toCandidateSubmissionsResponse(subs as unknown as Record<string, unknown>[]);
    const cptAnalytics = this.subProvider.getCptAnalyticsFromSubs(approved, role);
    const icdAnalytics = this.subProvider.getIcdAnalyticsFromSubs(approved);
    const supervisorAnalytics = this.subProvider.getSupervisorAnalyticsFromSubs(approved);

    const [activityTimeline, submissionRanking] = await Promise.all([
      this.activityTimelineController.handleGetActivityTimeline(req, res),
      this.subController.handleGetSubmissionRanking(req, res),
    ]);

    return {
      stats,
      submissions,
      cptAnalytics,
      icdAnalytics,
      supervisorAnalytics,
      activityTimeline: activityTimeline as { items: unknown[] },
      submissionRanking,
    };
  }
}
