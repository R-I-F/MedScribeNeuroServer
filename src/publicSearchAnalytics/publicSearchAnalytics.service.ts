import { inject, injectable } from "inversify";
import { DataSource } from "typeorm";
import {
  PublicSearchAnalyticsProvider,
  Granularity,
  UsageWindow,
} from "./publicSearchAnalytics.provider";

/**
 * Public Search Usage analytics service (docs/PUBLIC_SEARCH_USAGE_ANALYTICS_PLAN.md).
 * Thin pass-through to the provider (matches the repo's service/provider idiom).
 */
@injectable()
export class PublicSearchAnalyticsService {
  constructor(
    @inject(PublicSearchAnalyticsProvider) private provider: PublicSearchAnalyticsProvider
  ) {}

  async getAnalytics(dataSource: DataSource, query: { granularity: Granularity }) {
    try {
      return await this.provider.getAnalytics(dataSource, query);
    } catch (err: any) {
      throw new Error(err?.message ?? "Failed to compute public-search-usage analytics");
    }
  }

  async getList(dataSource: DataSource, query: { window: UsageWindow }) {
    try {
      return await this.provider.getList(dataSource, query);
    } catch (err: any) {
      throw new Error(err?.message ?? "Failed to list public-search usage");
    }
  }
}
