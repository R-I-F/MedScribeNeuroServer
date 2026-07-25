import { inject, injectable } from "inversify";
import { DataSource } from "typeorm";
import {
  SearchAnalyticsProvider,
  SearchUsageQuery,
  Scope,
  UsageWindow,
} from "./searchAnalytics.provider";

/**
 * AI Search Usage analytics service (docs/SEARCH_USAGE_ANALYTICS_PLAN.md).
 * Thin pass-through to the provider (matches the repo's service/provider idiom).
 */
@injectable()
export class SearchAnalyticsService {
  constructor(
    @inject(SearchAnalyticsProvider) private provider: SearchAnalyticsProvider
  ) {}

  async getAnalytics(dataSource: DataSource, query: SearchUsageQuery) {
    try {
      return await this.provider.getAnalytics(dataSource, query);
    } catch (err: any) {
      throw new Error(err?.message ?? "Failed to compute search-usage analytics");
    }
  }

  async getList(
    dataSource: DataSource,
    query: { window: UsageWindow; scope: Scope; deptCode?: string }
  ) {
    try {
      return await this.provider.getList(dataSource, query);
    } catch (err: any) {
      throw new Error(err?.message ?? "Failed to list search usage");
    }
  }

  async getUser(
    dataSource: DataSource,
    query: { actorId: string; role?: string; window: UsageWindow }
  ) {
    try {
      return await this.provider.getUser(dataSource, query);
    } catch (err: any) {
      throw new Error(err?.message ?? "Failed to load user search usage");
    }
  }
}
