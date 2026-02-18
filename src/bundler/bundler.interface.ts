import { IConsumableDoc } from "../consumables/consumables.interface";
import { IEquipmentDoc } from "../equipment/equipment.interface";
import { IApproachDoc } from "../approaches/approaches.interface";
import { IRegionDoc } from "../regions/regions.interface";
import { IPositionDoc } from "../positions/positions.interface";

export interface IBundlerDoc {
  consumables: IConsumableDoc[];
  equipment: IEquipmentDoc[];
  approaches: IApproachDoc[];
  regions: IRegionDoc[];
  positions: IPositionDoc[];
}

/**
 * Combined response for GET /candidate/dashboard (candidate dashboard bundle).
 * Full bundle: when institution is both academic and practical.
 * When institution is also clinical (isClinical: true), includes clinicalSubCand (same as GET /clinicalSub/cand).
 * Each key matches the corresponding single endpoint response.
 */
export interface ICandidateDashboardDoc {
  stats: unknown;
  points: unknown;
  submissions: unknown;
  cptAnalytics: unknown;
  icdAnalytics: unknown;
  supervisorAnalytics: unknown;
  activityTimeline: { items: unknown[] };
  submissionRanking: unknown;
  academicRanking: unknown;
  /** Present when institution is academic + practical + clinical. Same as GET /clinicalSub/cand (censored candidate/supervisor). */
  clinicalSubCand?: unknown[];
}

/**
 * Practical-only dashboard bundle for institutions with isPractical: true, isAcademic: false.
 * Same endpoint GET /candidate/dashboard returns this shape when institution is practical-only.
 */
export interface IPracticalCandidateDashboardDoc {
  stats: unknown;
  submissions: unknown;
  cptAnalytics: unknown;
  icdAnalytics: unknown;
  supervisorAnalytics: unknown;
  activityTimeline: { items: unknown[] };
  submissionRanking: unknown;
}
