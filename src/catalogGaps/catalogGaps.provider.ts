import "reflect-metadata";
import { injectable } from "inversify";
import { DataSource } from "typeorm";

export type GapStatus = "open" | "reported" | "dismissed";
export type GapKind = "procedure" | "diagnosis";

/**
 * "Not in catalogue" list (docs/OTHER_FIELD_SEMANTIC_SEARCH_PLAN.md, J5): what users described
 * because the catalogue did not have it, grouped by category + kind + normalized text, so the
 * department can ask the hub for real items. Raw SQL on catalog_gaps (no entity).
 */
@injectable()
export class CatalogGapsProvider {
  /** Grouped list within a department scope (null = institution-wide). */
  public async list(
    dataSource: DataSource,
    q: { departmentId: string | null; status: GapStatus | null; kind: GapKind | null }
  ) {
    const rows: Array<{
      kind: GapKind;
      main_diag_id: string | null;
      main_diag_title: string | null;
      main_diag_ar_title: string | null;
      dept_code: string | null;
      normalized_text: string;
      text: string;
      times: number;
      first_seen: string;
      last_seen: string;
      status: GapStatus;
    }> = await dataSource.query(
      `SELECT g."kind", g."mainDiagId" AS main_diag_id, md."title" AS main_diag_title,
              md."arTitle" AS main_diag_ar_title, d."code" AS dept_code,
              g."normalizedText" AS normalized_text,
              (array_agg(g."text" ORDER BY g."createdAt" DESC))[1] AS text,
              count(*)::int AS times,
              min(g."createdAt") AS first_seen,
              max(g."createdAt") AS last_seen,
              CASE WHEN bool_or(g."status" = 'open') THEN 'open'
                   WHEN bool_or(g."status" = 'reported') THEN 'reported'
                   ELSE 'dismissed' END AS status
         FROM "catalog_gaps" g
         LEFT JOIN "main_diags" md ON md."id" = g."mainDiagId"
         LEFT JOIN "departments" d ON d."id" = g."departmentId"
        WHERE ($1::uuid IS NULL OR g."departmentId" = $1::uuid)
          AND ($2::text IS NULL OR g."kind" = $2)
        GROUP BY g."kind", g."mainDiagId", md."title", md."arTitle", d."code", g."normalizedText"
       HAVING ($3::text IS NULL
               OR (CASE WHEN bool_or(g."status" = 'open') THEN 'open'
                        WHEN bool_or(g."status" = 'reported') THEN 'reported'
                        ELSE 'dismissed' END) = $3)
        ORDER BY count(*) DESC, max(g."createdAt") DESC
        LIMIT 500`,
      [q.departmentId, q.kind, q.status]
    );
    return {
      items: rows.map((r) => ({
        kind: r.kind,
        mainDiagId: r.main_diag_id,
        mainDiagTitle: r.main_diag_title,
        mainDiagArTitle: r.main_diag_ar_title,
        deptCode: r.dept_code,
        normalizedText: r.normalized_text,
        text: r.text,
        times: r.times,
        firstSeen: r.first_seen,
        lastSeen: r.last_seen,
        status: r.status,
      })),
    };
  }

  /** Set the status of one group, inside the caller's scope. Returns the number of rows changed. */
  public async setStatus(
    dataSource: DataSource,
    q: {
      departmentId: string | null;
      kind: GapKind;
      mainDiagId: string | null;
      normalizedText: string;
      status: GapStatus;
    }
  ): Promise<number> {
    const rows = await dataSource.query(
      `UPDATE "catalog_gaps" SET "status" = $1::varchar, "updatedAt" = now()
        WHERE "kind" = $2::varchar
          AND "normalizedText" = $3::varchar
          AND "mainDiagId" IS NOT DISTINCT FROM $4::uuid
          AND ($5::uuid IS NULL OR "departmentId" = $5::uuid)
        RETURNING "id"`,
      [q.status, q.kind, q.normalizedText, q.mainDiagId, q.departmentId]
    );
    // TypeORM returns [rows, count] for UPDATE ... RETURNING on Postgres.
    const returned = Array.isArray(rows[0]) ? rows[0] : rows;
    return returned.length;
  }
}
