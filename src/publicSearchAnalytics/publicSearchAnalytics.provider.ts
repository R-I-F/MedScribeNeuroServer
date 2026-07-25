import { injectable } from "inversify";
import { DataSource } from "typeorm";

/**
 * Public Search Usage analytics provider (docs/PUBLIC_SEARCH_USAGE_ANALYTICS_PLAN.md).
 *
 * Reads ONLY `public_search_sessions` (the public /explore tool's soft-registration table). The
 * public tool records only an aggregate `queryCount` per session (no per-search type, department,
 * or timestamp), so this reports people / searches / conversion / over-time (by registration day).
 * Because the data is all historical session rows, FULL history is covered (no forward-only caveat).
 *
 * D1 (user): session-only, no migration, no by-type/by-department breakdown.
 */

export type Granularity = "daily" | "weekly" | "monthly" | "quarterly";
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

const WINDOW_INTERVAL: Record<UsageWindow, string> = {
  today: "1 day",
  week: "7 days",
  month: "30 days",
  quarter: "3 months",
};

@injectable()
export class PublicSearchAnalyticsProvider {
  /**
   * Analytics: distinct people (emails that ran >=1 search) + total searches over trailing windows,
   * a gap-filled time-series (by registration day), the registered/verified/searchers conversion
   * funnel (trailing quarter), and all-time totals.
   */
  public async getAnalytics(dataSource: DataSource, q: { granularity: Granularity }) {
    const granularity: Granularity = GRAN[q.granularity] ? q.granularity : "monthly";
    const cfg = GRAN[granularity];

    // 1) Summary: distinct searchers + total searches over fixed trailing windows (by createdAt).
    const summaryP = dataSource.query(
      `SELECT
         count(DISTINCT "email") FILTER (WHERE "queryCount" > 0 AND "createdAt" >= now() - interval '1 day')::int    AS people_daily,
         COALESCE(sum("queryCount") FILTER (WHERE "createdAt" >= now() - interval '1 day'), 0)::int                  AS searches_daily,
         count(DISTINCT "email") FILTER (WHERE "queryCount" > 0 AND "createdAt" >= now() - interval '7 days')::int   AS people_weekly,
         COALESCE(sum("queryCount") FILTER (WHERE "createdAt" >= now() - interval '7 days'), 0)::int                 AS searches_weekly,
         count(DISTINCT "email") FILTER (WHERE "queryCount" > 0 AND "createdAt" >= now() - interval '30 days')::int  AS people_monthly,
         COALESCE(sum("queryCount") FILTER (WHERE "createdAt" >= now() - interval '30 days'), 0)::int                AS searches_monthly,
         count(DISTINCT "email") FILTER (WHERE "queryCount" > 0 AND "createdAt" >= now() - interval '3 months')::int AS people_quarterly,
         COALESCE(sum("queryCount") FILTER (WHERE "createdAt" >= now() - interval '3 months'), 0)::int               AS searches_quarterly
       FROM "public_search_sessions"
       WHERE "createdAt" >= now() - interval '3 months'`
    );

    // 2) Series axis + per-bucket searches + distinct people (gap-filled via generate_series).
    const seriesP = dataSource.query(
      `WITH axis AS (
         SELECT generate_series(
           date_trunc($1, now() - ($3)::interval),
           date_trunc($1, now()),
           ($2)::interval
         ) AS bucket_ts
       )
       SELECT to_char(a.bucket_ts, 'YYYY-MM-DD') AS bucket,
              COALESCE(sum(e."queryCount"), 0)::int AS searches,
              count(DISTINCT e."email") FILTER (WHERE e."queryCount" > 0)::int AS people
       FROM axis a
       LEFT JOIN "public_search_sessions" e
         ON date_trunc($1, e."createdAt") = a.bucket_ts
       GROUP BY a.bucket_ts
       ORDER BY a.bucket_ts`,
      [cfg.unit, cfg.step, cfg.lookback]
    );

    // 3) Conversion funnel (trailing 3 months): distinct emails registered / verified / searchers.
    const conversionP = dataSource.query(
      `SELECT
         count(DISTINCT "email")::int AS registered,
         count(DISTINCT "email") FILTER (WHERE "verified")::int AS verified,
         count(DISTINCT "email") FILTER (WHERE "queryCount" > 0)::int AS searchers
       FROM "public_search_sessions"
       WHERE "createdAt" >= now() - interval '3 months'`
    );

    // 4) All-time totals + data-start marker.
    const allTimeP = dataSource.query(
      `SELECT
         count(DISTINCT "email") FILTER (WHERE "queryCount" > 0)::int AS people,
         COALESCE(sum("queryCount"), 0)::int AS searches,
         to_char(min("createdAt"), 'YYYY-MM-DD') AS data_start_date
       FROM "public_search_sessions"`
    );

    const [summaryRows, seriesRows, conversionRows, allTimeRows] = await Promise.all([
      summaryP,
      seriesP,
      conversionP,
      allTimeP,
    ]);

    const s = summaryRows[0] ?? {};
    const summary = {
      daily: { people: s.people_daily ?? 0, searches: s.searches_daily ?? 0 },
      weekly: { people: s.people_weekly ?? 0, searches: s.searches_weekly ?? 0 },
      monthly: { people: s.people_monthly ?? 0, searches: s.searches_monthly ?? 0 },
      quarterly: { people: s.people_quarterly ?? 0, searches: s.searches_quarterly ?? 0 },
    };

    const series = (seriesRows as Array<{ bucket: string; searches: number; people: number }>).map(
      (r) => ({ bucket: r.bucket, searches: r.searches, people: r.people })
    );

    const c = conversionRows[0] ?? {};
    const conversion = {
      registered: c.registered ?? 0,
      verified: c.verified ?? 0,
      searchers: c.searchers ?? 0,
    };

    const a = allTimeRows[0] ?? {};
    return {
      granularity,
      dataStartDate: a.data_start_date ?? null,
      summary,
      series,
      conversion,
      allTime: { people: a.people ?? 0, searches: a.searches ?? 0 },
    };
  }

  /**
   * The drill-down list: each email that ran >=1 search in the window, aggregated across its
   * sessions (total searches, session count, verified flag, first/last seen). Ordered by search
   * count desc, then most recent.
   */
  public async getList(dataSource: DataSource, q: { window: UsageWindow }) {
    const w: UsageWindow = WINDOW_INTERVAL[q.window] ? q.window : "quarter";
    const interval = WINDOW_INTERVAL[w];

    const rows = await dataSource.query(
      `SELECT "email" AS email,
              bool_or("verified") AS verified,
              COALESCE(sum("queryCount"), 0)::int AS search_count,
              count(*)::int AS sessions,
              min("createdAt") AS first_seen,
              max("createdAt") AS last_seen
       FROM "public_search_sessions"
       WHERE "createdAt" >= now() - ($1)::interval
       GROUP BY "email"
       HAVING COALESCE(sum("queryCount"), 0) > 0
       ORDER BY search_count DESC, last_seen DESC`,
      [interval]
    );

    return {
      window: w,
      count: rows.length,
      people: (rows as any[]).map((r) => ({
        email: r.email,
        verified: !!r.verified,
        searchCount: r.search_count,
        sessions: r.sessions,
        firstSeen: r.first_seen,
        lastSeen: r.last_seen,
      })),
    };
  }
}
