import "reflect-metadata";
import { injectable } from "inversify";
import { DataSource } from "typeorm";

export type InAppSearchPurpose = "assist" | "missing";

/**
 * Repository layer for the in-form search log (docs/IN_FORM_SEMANTIC_SEARCH_PLAN.md, extended by
 * docs/OTHER_FIELD_SEMANTIC_SEARCH_PLAN.md). Each row is one search: who, where, what they typed,
 * what came back and what they did next. The daily quotas count rows per purpose.
 */
@injectable()
export class InAppSearchService {
  /** Per-user daily quota basis: this user's searches of one purpose since `since`. */
  public async countByUserSince(
    userId: string,
    purpose: InAppSearchPurpose,
    since: Date,
    dataSource: DataSource
  ): Promise<number> {
    const rows = await dataSource.query(
      `SELECT count(*)::int AS n FROM "in_app_search_events"
        WHERE "userId" = $1 AND "purpose" = $2 AND "createdAt" >= $3`,
      [userId, purpose, since]
    );
    return rows[0]?.n ?? 0;
  }

  /** Spend the credit and log the query before the search runs; returns the event id. */
  public async record(
    data: {
      userId: string;
      userRole: string;
      departmentId: string | null;
      type: string;
      purpose: InAppSearchPurpose;
      query: string;
      mainDiagId: string | null;
    },
    dataSource: DataSource
  ): Promise<string> {
    const rows = await dataSource.query(
      `INSERT INTO "in_app_search_events"
         ("userId", "userRole", "departmentId", "type", "purpose", "query", "mainDiagId")
       VALUES ($1::uuid, $2::varchar, $3::uuid, $4::varchar, $5::varchar, $6::text, $7::uuid)
       RETURNING "id"`,
      [data.userId, data.userRole, data.departmentId, data.type, data.purpose, data.query, data.mainDiagId]
    );
    return rows[0].id;
  }

  public async saveResults(id: string, results: unknown[], dataSource: DataSource): Promise<void> {
    await dataSource.query(
      `UPDATE "in_app_search_events" SET "results" = $2::jsonb WHERE "id" = $1::uuid`,
      [id, JSON.stringify(results)]
    );
  }

  /** Record what the user did after the search. Only the user's own event; returns false if not found. */
  public async setOutcome(
    id: string,
    userId: string,
    outcome: "picked" | "none",
    pickedCode: string | null,
    dataSource: DataSource
  ): Promise<boolean> {
    const rows = await dataSource.query(
      `UPDATE "in_app_search_events" SET "outcome" = $3::varchar, "pickedCode" = $4::varchar
        WHERE "id" = $1::uuid AND "userId" = $2::uuid
        RETURNING "id"`,
      [id, userId, outcome, pickedCode]
    );
    // TypeORM returns [rows, count] for UPDATE ... RETURNING on Postgres.
    const returned = Array.isArray(rows[0]) ? rows[0] : rows;
    return returned.length > 0;
  }

  /** A 'missing' search event that belongs to this user, or null (used to link catalog_gaps). */
  public async ownMissingEvent(id: string, userId: string, dataSource: DataSource): Promise<string | null> {
    const rows = await dataSource.query(
      `SELECT "id" FROM "in_app_search_events"
        WHERE "id" = $1::uuid AND "userId" = $2::uuid AND "purpose" = 'missing' LIMIT 1`,
      [id, userId]
    );
    return rows[0]?.id ?? null;
  }
}
