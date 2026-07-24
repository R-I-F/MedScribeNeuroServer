import "reflect-metadata";
import { injectable } from "inversify";
import { DataSource, MoreThanOrEqual } from "typeorm";
import { InAppSearchEventEntity } from "./inAppSearchEvent.mDbSchema";

/** Repository layer for the in-form search usage log (docs/IN_FORM_SEMANTIC_SEARCH_PLAN.md). */
@injectable()
export class InAppSearchService {
  /** Per-user daily quota basis: this user's searches since `since`. */
  public countByUserSince(userId: string, since: Date, dataSource: DataSource): Promise<number> {
    return dataSource
      .getRepository(InAppSearchEventEntity)
      .count({ where: { userId, createdAt: MoreThanOrEqual(since) } });
  }

  public async record(
    data: { userId: string; userRole: string; departmentId: string | null; type: string },
    dataSource: DataSource
  ): Promise<void> {
    const repo = dataSource.getRepository(InAppSearchEventEntity);
    await repo.save(repo.create(data));
  }
}
