import { inject, injectable } from "inversify";
import { DataSource } from "typeorm";
import { ActiveUsersProvider, ActiveUsersQuery, ActiveWindow, Scope } from "./activeUsers.provider";

/**
 * Active-Users analytics service (docs/ACTIVE_USERS_ANALYTICS_PLAN.md, Stage C).
 * Thin pass-through to the provider (matches the repo's service/provider idiom).
 */
@injectable()
export class ActiveUsersService {
  constructor(
    @inject(ActiveUsersProvider) private activeUsersProvider: ActiveUsersProvider
  ) {}

  async getAnalytics(dataSource: DataSource, query: ActiveUsersQuery) {
    try {
      return await this.activeUsersProvider.getAnalytics(dataSource, query);
    } catch (err: any) {
      throw new Error(err?.message ?? "Failed to compute active-users analytics");
    }
  }

  async getList(
    dataSource: DataSource,
    query: { window: ActiveWindow; scope: Scope; deptCode?: string }
  ) {
    try {
      return await this.activeUsersProvider.getActiveUsersList(dataSource, query);
    } catch (err: any) {
      throw new Error(err?.message ?? "Failed to list active users");
    }
  }

  async getUserActivity(
    dataSource: DataSource,
    query: { actorId: string; role?: string; window: ActiveWindow }
  ) {
    try {
      return await this.activeUsersProvider.getUserActivity(dataSource, query);
    } catch (err: any) {
      throw new Error(err?.message ?? "Failed to load user activity");
    }
  }

  async setCap(dataSource: DataSource, maxActiveUsers: number | null) {
    try {
      return await this.activeUsersProvider.setCap(dataSource, maxActiveUsers);
    } catch (err: any) {
      throw new Error(err?.message ?? "Failed to set active-users cap");
    }
  }
}
