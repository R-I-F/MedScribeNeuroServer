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
}
