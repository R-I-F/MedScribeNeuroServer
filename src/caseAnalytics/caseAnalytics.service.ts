import { inject, injectable } from "inversify";
import { DataSource } from "typeorm";
import { CaseAnalyticsProvider, CaseAnalyticsFilters } from "./caseAnalytics.provider";

/**
 * Case Analytics service (docs/CASE_ANALYTICS_TOOL_PLAN.md).
 * Thin pass-through to the provider, matching the repo's service/provider idiom.
 */
@injectable()
export class CaseAnalyticsService {
  constructor(@inject(CaseAnalyticsProvider) private provider: CaseAnalyticsProvider) {}

  async getFilters(dataSource: DataSource, departmentId: string | null) {
    try {
      return await this.provider.getFilters(dataSource, departmentId);
    } catch (err: any) {
      throw new Error(err?.message ?? "Failed to load case-analytics filters");
    }
  }

  async getSummary(
    dataSource: DataSource,
    filters: CaseAnalyticsFilters,
    departmentId: string | null
  ) {
    try {
      return await this.provider.getSummary(dataSource, filters, departmentId);
    } catch (err: any) {
      throw new Error(err?.message ?? "Failed to compute case analytics");
    }
  }

  async getCases(
    dataSource: DataSource,
    filters: CaseAnalyticsFilters,
    departmentId: string | null,
    page?: number,
    pageSize?: number
  ) {
    try {
      return await this.provider.getCases(dataSource, filters, departmentId, page, pageSize);
    } catch (err: any) {
      throw new Error(err?.message ?? "Failed to list cases");
    }
  }

  async getAllCasesForExport(
    dataSource: DataSource,
    filters: CaseAnalyticsFilters,
    departmentId: string | null
  ) {
    try {
      return await this.provider.getAllCasesForExport(dataSource, filters, departmentId);
    } catch (err: any) {
      throw new Error(err?.message ?? "Failed to collect cases for export");
    }
  }
}
