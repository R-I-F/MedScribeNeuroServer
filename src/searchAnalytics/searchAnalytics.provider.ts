import { injectable } from "inversify";
import { DataSource } from "typeorm";

/**
 * AI Search Usage analytics provider (docs/SEARCH_USAGE_ANALYTICS_PLAN.md).
 *
 * Reads EXCLUSIVELY from the `in_app_search_events` table (one row per credit-consuming
 * in-form semantic search). This is deliberately SEPARATE from the Active Users analytics:
 * a search is NOT an activity (a submission already counts), so it is never mixed into
 * `activity_read_model` or the signup cap. superAdmin rows are excluded from every count,
 * consistent with Active Users.
 *
 * Every event carries the RESOLVED departmentId (never NULL in practice), so the department
 * breakdown is a clean inner join. Window filtering uses rolling trailing intervals, and the
 * time-series is gap-filled with generate_series (same idiom as activeUsers.provider).
 */

export type Granularity = "daily" | "weekly" | "monthly" | "quarterly";
export type Scope = "institution" | "department";
export type UsageWindow = "today" | "week" | "month" | "quarter";

interface GranCfg {
  unit: string; // date_trunc field
  step: string; // generate_series step interval
  lookback: string; // trailing window as an interval
}

// Bucket count per granularity: daily=30, weekly=12, monthly=12, quarterly=8.
const GRAN: Record<Granularity, GranCfg> = {
  daily: { unit: "day", step: "1 day", lookback: "29 days" },
  weekly: { unit: "week", step: "1 week", lookback: "77 days" },
  monthly: { unit: "month", step: "1 month", lookback: "11 months" },
  quarterly: { unit: "quarter", step: "3 months", lookback: "21 months" },
};

// Excluded from every count (owner role; consistent with Active Users).
const EXCLUDE_ROLE = "superAdmin";

// Drill-down windows for the usage list (match the summary stat cards).
const WINDOW_INTERVAL: Record<UsageWindow, string> = {
  today: "1 day",
  week: "7 days",
  month: "30 days",
  quarter: "3 months",
};

export interface SearchUsageQuery {
  granularity: Granularity;
  scope: Scope;
  deptCode?: string | null;
}

@injectable()
export class SearchAnalyticsProvider {
  /**
   * The analytics summary: distinct users AND total searches over trailing windows, a gap-filled
   * time-series (searches + users, plus per-type split), and by-type / by-role / by-department
   * breakdowns. Department scope filters every query by a resolved deptId; institution scope
   * (deptId NULL) aggregates across all departments and adds the byDepartment breakdown.
   */
  public async getAnalytics(dataSource: DataSource, q: SearchUsageQuery) {
    const granularity: Granularity = GRAN[q.granularity] ? q.granularity : "monthly";
    const scope: Scope = q.scope === "department" ? "department" : "institution";
    const cfg = GRAN[granularity];

    const deptId: string | null =
      scope === "department" ? await this.resolveDeptId(dataSource, q.deptCode) : null;

    // 1) Summary: distinct users + total searches over fixed trailing windows (rolling).
    const summaryP = dataSource.query(
      `SELECT
         count(DISTINCT "userId") FILTER (WHERE "createdAt" >= now() - interval '1 day')::int    AS users_daily,
         count(*)                 FILTER (WHERE "createdAt" >= now() - interval '1 day')::int    AS searches_daily,
         count(DISTINCT "userId") FILTER (WHERE "createdAt" >= now() - interval '7 days')::int   AS users_weekly,
         count(*)                 FILTER (WHERE "createdAt" >= now() - interval '7 days')::int   AS searches_weekly,
         count(DISTINCT "userId") FILTER (WHERE "createdAt" >= now() - interval '30 days')::int  AS users_monthly,
         count(*)                 FILTER (WHERE "createdAt" >= now() - interval '30 days')::int  AS searches_monthly,
         count(DISTINCT "userId") FILTER (WHERE "createdAt" >= now() - interval '3 months')::int AS users_quarterly,
         count(*)                 FILTER (WHERE "createdAt" >= now() - interval '3 months')::int AS searches_quarterly
       FROM "in_app_search_events"
       WHERE "userRole" <> $1
         AND "createdAt" >= now() - interval '3 months'
         AND ($2::uuid IS NULL OR "departmentId" = $2)`,
      [EXCLUDE_ROLE, deptId]
    );

    // 2) Series axis + per-bucket searches + distinct users (gap-filled via generate_series).
    //    count("id") (not count(*)) so gap-filled empty axis rows read 0, not 1.
    const seriesTotalsP = dataSource.query(
      `WITH axis AS (
         SELECT generate_series(
           date_trunc($2, now() - ($4)::interval),
           date_trunc($2, now()),
           ($3)::interval
         ) AS bucket_ts
       )
       SELECT to_char(a.bucket_ts, 'YYYY-MM-DD') AS bucket,
              count(e."id")::int AS searches,
              count(DISTINCT e."userId")::int AS users
       FROM axis a
       LEFT JOIN "in_app_search_events" e
         ON date_trunc($2, e."createdAt") = a.bucket_ts
        AND e."userRole" <> $1
        AND ($5::uuid IS NULL OR e."departmentId" = $5)
       GROUP BY a.bucket_ts
       ORDER BY a.bucket_ts`,
      [EXCLUDE_ROLE, cfg.unit, cfg.step, cfg.lookback, deptId]
    );

    // 3) Per-bucket, per-type search volume (procedure/diagnosis) for the stacked trend.
    const seriesTypeP = dataSource.query(
      `SELECT to_char(date_trunc($2, "createdAt"), 'YYYY-MM-DD') AS bucket,
              "type" AS t,
              count(*)::int AS c
       FROM "in_app_search_events"
       WHERE "userRole" <> $1
         AND "createdAt" >= date_trunc($2, now() - ($3)::interval)
         AND ($4::uuid IS NULL OR "departmentId" = $4)
       GROUP BY 1, 2`,
      [EXCLUDE_ROLE, cfg.unit, cfg.lookback, deptId]
    );

    // 4) Search volume by type over the same window.
    const byTypeP = dataSource.query(
      `SELECT "type" AS t, count(*)::int AS c
       FROM "in_app_search_events"
       WHERE "userRole" <> $1
         AND "createdAt" >= date_trunc($2, now() - ($3)::interval)
         AND ($4::uuid IS NULL OR "departmentId" = $4)
       GROUP BY 1
       ORDER BY c DESC`,
      [EXCLUDE_ROLE, cfg.unit, cfg.lookback, deptId]
    );

    // 5) Search volume by role over the same window.
    const byRoleP = dataSource.query(
      `SELECT "userRole" AS role, count(*)::int AS c
       FROM "in_app_search_events"
       WHERE "userRole" <> $1
         AND "createdAt" >= date_trunc($2, now() - ($3)::interval)
         AND ($4::uuid IS NULL OR "departmentId" = $4)
       GROUP BY 1
       ORDER BY c DESC`,
      [EXCLUDE_ROLE, cfg.unit, cfg.lookback, deptId]
    );

    // 6) Users + searches per department (institution scope only; trailing 3 months).
    const byDeptP =
      scope === "institution"
        ? dataSource.query(
            `SELECT d."code" AS dept_code, d."name" AS dept_name, d."arName" AS dept_ar_name,
                    count(DISTINCT e."userId")::int AS users,
                    count(*)::int AS searches
             FROM "in_app_search_events" e
             JOIN "departments" d ON d."id" = e."departmentId"
             WHERE e."userRole" <> $1
               AND e."createdAt" >= now() - interval '3 months'
             GROUP BY d."code", d."name", d."arName"
             ORDER BY searches DESC`,
            [EXCLUDE_ROLE]
          )
        : Promise.resolve([]);

    // 7) Data-start marker (earliest recorded search).
    const metaP = dataSource.query(
      `SELECT to_char(min("createdAt"), 'YYYY-MM-DD') AS data_start_date
       FROM "in_app_search_events" WHERE "userRole" <> $1`,
      [EXCLUDE_ROLE]
    );

    const [summaryRows, totals, typeSeriesRows, typeRows, roleRows, deptRows, metaRows] =
      await Promise.all([summaryP, seriesTotalsP, seriesTypeP, byTypeP, byRoleP, byDeptP, metaP]);

    // --- shape ---

    const typeByBucket = new Map<string, Record<string, number>>();
    for (const r of typeSeriesRows as Array<{ bucket: string; t: string; c: number }>) {
      const m = typeByBucket.get(r.bucket) ?? {};
      m[r.t] = r.c;
      typeByBucket.set(r.bucket, m);
    }
    const series = (totals as Array<{ bucket: string; searches: number; users: number }>).map(
      (row) => ({
        bucket: row.bucket,
        searches: row.searches,
        users: row.users,
        byType: typeByBucket.get(row.bucket) ?? {},
      })
    );

    const byType: Record<string, number> = {};
    for (const t of typeRows as Array<{ t: string; c: number }>) byType[t.t] = t.c;

    const byRole: Record<string, number> = {};
    for (const r of roleRows as Array<{ role: string; c: number }>) byRole[r.role] = r.c;

    const byDepartment = (deptRows as Array<{
      dept_code: string;
      dept_name: string;
      dept_ar_name: string | null;
      users: number;
      searches: number;
    }>).map((d) => ({
      deptCode: d.dept_code,
      name: d.dept_name,
      arName: d.dept_ar_name,
      users: d.users,
      searches: d.searches,
    }));

    const s = summaryRows[0] ?? {};
    const summary = {
      daily: { users: s.users_daily ?? 0, searches: s.searches_daily ?? 0 },
      weekly: { users: s.users_weekly ?? 0, searches: s.searches_weekly ?? 0 },
      monthly: { users: s.users_monthly ?? 0, searches: s.searches_monthly ?? 0 },
      quarterly: { users: s.users_quarterly ?? 0, searches: s.searches_quarterly ?? 0 },
    };

    return {
      granularity,
      scope,
      deptCode: scope === "department" ? (q.deptCode || process.env.REF_DEPT_CODE || "NS") : null,
      dataStartDate: metaRows[0]?.data_start_date ?? null,
      summary,
      series,
      byType,
      byRole,
      byDepartment,
    };
  }

  /**
   * The drill-down list: every distinct user who searched in the window (superAdmin excluded),
   * resolved to name/email/department, with their search count (total + procedure/diagnosis split)
   * and last-search time. Ordered by search count desc, then most recent.
   */
  public async getList(
    dataSource: DataSource,
    q: { window: UsageWindow; scope: Scope; deptCode?: string | null }
  ) {
    const w: UsageWindow = WINDOW_INTERVAL[q.window] ? q.window : "quarter";
    const interval = WINDOW_INTERVAL[w];
    const scope: Scope = q.scope === "department" ? "department" : "institution";
    const deptId: string | null =
      scope === "department" ? await this.resolveDeptId(dataSource, q.deptCode) : null;

    const rows = await dataSource.query(
      `SELECT e."userId" AS actor_id,
              e."userRole" AS role,
              count(*)::int AS search_count,
              count(*) FILTER (WHERE e."type" = 'procedure')::int AS procedure_count,
              count(*) FILTER (WHERE e."type" = 'diagnosis')::int AS diagnosis_count,
              max(e."createdAt") AS last_search,
              COALESCE(c."fullName", s."fullName", cl."fullName", ia."fullName") AS name,
              COALESCE(c."email", s."email", cl."email", ia."email") AS email,
              d."code" AS dept_code, d."name" AS dept_name, d."arName" AS dept_ar_name
         FROM "in_app_search_events" e
         LEFT JOIN "candidates" c        ON e."userRole" = 'candidate'      AND c."id"  = e."userId"
         LEFT JOIN "supervisors" s       ON e."userRole" = 'supervisor'     AND s."id"  = e."userId"
         LEFT JOIN "clerks" cl           ON e."userRole" = 'clerk'          AND cl."id" = e."userId"
         LEFT JOIN "institute_admins" ia ON e."userRole" = 'instituteAdmin' AND ia."id" = e."userId"
         LEFT JOIN "departments" d       ON d."id" = e."departmentId"
        WHERE e."userRole" <> $1
          AND e."createdAt" >= now() - ($2)::interval
          AND ($3::uuid IS NULL OR e."departmentId" = $3)
        GROUP BY e."userId", e."userRole", d."code", d."name", d."arName",
                 c."fullName", s."fullName", cl."fullName", ia."fullName",
                 c."email", s."email", cl."email", ia."email"
        ORDER BY search_count DESC, last_search DESC`,
      [EXCLUDE_ROLE, interval, deptId]
    );

    return {
      window: w,
      scope,
      deptCode: scope === "department" ? (q.deptCode || process.env.REF_DEPT_CODE || "NS") : null,
      count: rows.length,
      users: (rows as any[]).map((r) => ({
        actorId: r.actor_id,
        role: r.role,
        name: r.name ?? null,
        email: r.email ?? null,
        deptCode: r.dept_code ?? null,
        deptName: r.dept_name ?? null,
        deptArName: r.dept_ar_name ?? null,
        searchCount: r.search_count,
        procedureCount: r.procedure_count,
        diagnosisCount: r.diagnosis_count,
        lastSearch: r.last_search,
      })),
    };
  }

  /**
   * One user's search usage within a window: identity (name/email/department), the by-type
   * breakdown, and the search-event timeline (each with its type + department), most recent
   * first, capped at 1000.
   */
  public async getUser(
    dataSource: DataSource,
    q: { actorId: string; role?: string | null; window: UsageWindow }
  ) {
    const w: UsageWindow = WINDOW_INTERVAL[q.window] ? q.window : "quarter";
    const interval = WINDOW_INTERVAL[w];

    const identityP = dataSource.query(
      `SELECT COALESCE(c."fullName", s."fullName", cl."fullName", ia."fullName") AS name,
              COALESCE(c."email", s."email", cl."email", ia."email") AS email,
              d."code" AS dept_code, d."name" AS dept_name, d."arName" AS dept_ar_name
         FROM (SELECT $1::uuid AS id) x
         LEFT JOIN "candidates" c        ON c."id"  = x.id
         LEFT JOIN "supervisors" s       ON s."id"  = x.id
         LEFT JOIN "clerks" cl           ON cl."id" = x.id
         LEFT JOIN "institute_admins" ia ON ia."id" = x.id
         LEFT JOIN "departments" d       ON d."id" = COALESCE(c."departmentId", s."departmentId", cl."departmentId", ia."departmentId")`,
      [q.actorId]
    );

    const eventsP = dataSource.query(
      `SELECT e."type" AS t, e."createdAt" AS occurred_at, d."code" AS dept_code
         FROM "in_app_search_events" e
         LEFT JOIN "departments" d ON d."id" = e."departmentId"
        WHERE e."userId" = $1
          AND ($2::text IS NULL OR e."userRole" = $2)
          AND e."userRole" <> $3
          AND e."createdAt" >= now() - ($4)::interval
        ORDER BY e."createdAt" DESC
        LIMIT 1000`,
      [q.actorId, q.role ?? null, EXCLUDE_ROLE, interval]
    );

    const [identityRows, rows] = (await Promise.all([identityP, eventsP])) as [
      Array<{ name: string | null; email: string | null; dept_code: string | null; dept_name: string | null; dept_ar_name: string | null }>,
      Array<{ t: string; occurred_at: string; dept_code: string | null }>
    ];
    const id = identityRows[0] ?? ({} as any);

    const byType: Record<string, number> = {};
    for (const r of rows) byType[r.t] = (byType[r.t] ?? 0) + 1;

    return {
      actorId: q.actorId,
      role: q.role ?? null,
      window: w,
      name: id.name ?? null,
      email: id.email ?? null,
      deptCode: id.dept_code ?? null,
      deptName: id.dept_name ?? null,
      deptArName: id.dept_ar_name ?? null,
      total: rows.length,
      byType,
      events: rows.map((r) => ({
        type: r.t,
        occurredAt: r.occurred_at,
        deptCode: r.dept_code ?? null,
      })),
    };
  }

  /** Resolve a deptCode to a departmentId (case-insensitive); default REF_DEPT_CODE (NS). */
  private async resolveDeptId(
    dataSource: DataSource,
    deptCode: string | null | undefined
  ): Promise<string> {
    const code = (deptCode || process.env.REF_DEPT_CODE || "NS").trim();
    const rows = await dataSource.query(
      `SELECT "id" FROM "departments" WHERE UPPER("code") = UPPER($1) LIMIT 1`,
      [code]
    );
    if (rows.length === 0) {
      throw new Error(`Unknown deptCode: ${code}`);
    }
    return rows[0].id;
  }
}
