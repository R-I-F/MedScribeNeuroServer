import { injectable } from "inversify";
import { DataSource } from "typeorm";

/**
 * Active-Users analytics provider (docs/ACTIVE_USERS_ANALYTICS_PLAN.md, Stage C).
 *
 * Reads exclusively from the `activity_read_model` VIEW (the read side; the operational
 * tables stay the single source of truth). Every figure is computed on demand with
 * indexed range scans; the several independent queries run concurrently.
 *
 * "Active users" = COUNT(DISTINCT actorId). superAdmin activity is deliberately EXCLUDED
 * from every count and from the cap metric (the owner viewing the dashboard must not
 * inflate the user base). The `login` signal only accrues from deployment forward
 * (logins had no history), surfaced via `loginTrackingStartedAt`.
 */

export type Granularity = "daily" | "weekly" | "monthly" | "quarterly";
export type Scope = "institution" | "department";

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

// Excluded from every active-user count (owner role).
const EXCLUDE_ROLE = "superAdmin";

// Drill-down windows for the active-users list (match the summary stat cards).
export type ActiveWindow = "today" | "week" | "month" | "quarter";
const WINDOW_INTERVAL: Record<ActiveWindow, string> = {
  today: "1 day",
  week: "7 days",
  month: "30 days",
  quarter: "3 months",
};

export interface ActiveUsersQuery {
  granularity: Granularity;
  scope: Scope;
  deptCode?: string | null;
}

export interface SignupGate {
  maxActiveUsers: number | null;
  currentCount: number;
  signupsOpen: boolean;
}

@injectable()
export class ActiveUsersProvider {
  /**
   * The signup gate: the stored cap vs the live rolling-quarterly (trailing 3 months)
   * institution-wide distinct active-users count (superAdmin excluded). signupsOpen is
   * derived, never stored - it flips automatically as the rolling count crosses the cap.
   */
  public async getSignupGate(dataSource: DataSource): Promise<SignupGate> {
    const rows = await dataSource.query(
      `SELECT
         (SELECT "maxActiveUsers" FROM "institutions" ORDER BY "createdAt" LIMIT 1) AS max_active_users,
         (SELECT count(DISTINCT "actorId")::int FROM "activity_read_model"
           WHERE "actorRole" <> $1 AND "occurredAt" >= now() - interval '3 months') AS current_count`,
      [EXCLUDE_ROLE]
    );
    const rawMax = rows[0]?.max_active_users ?? null;
    const maxActiveUsers = rawMax === null ? null : Number(rawMax);
    const currentCount = rows[0]?.current_count ?? 0;
    return {
      maxActiveUsers,
      currentCount,
      signupsOpen: maxActiveUsers === null ? true : currentCount < maxActiveUsers,
    };
  }

  /** Set (or clear with null) the max-active-users cap on the single institution row. */
  public async setCap(dataSource: DataSource, maxActiveUsers: number | null): Promise<SignupGate> {
    await dataSource.query(
      `UPDATE "institutions" SET "maxActiveUsers" = $1, "updatedAt" = now()
       WHERE "id" = (SELECT "id" FROM "institutions" ORDER BY "createdAt" LIMIT 1)`,
      [maxActiveUsers]
    );
    return this.getSignupGate(dataSource);
  }

  /**
   * The drill-down list: every distinct active user in the window (superAdmin excluded),
   * resolved to name/email/department via role-specific joins, with their activity count
   * and last-active time. Ordered most-recently-active first.
   */
  public async getActiveUsersList(
    dataSource: DataSource,
    q: { window: ActiveWindow; scope: Scope; deptCode?: string | null }
  ) {
    const w: ActiveWindow = WINDOW_INTERVAL[q.window] ? q.window : "quarter";
    const interval = WINDOW_INTERVAL[w];
    const scope: Scope = q.scope === "department" ? "department" : "institution";
    const deptId: string | null =
      scope === "department" ? await this.resolveDeptId(dataSource, q.deptCode) : null;

    const rows = await dataSource.query(
      `SELECT arm."actorId" AS actor_id,
              arm."actorRole" AS role,
              count(*)::int AS activity_count,
              max(arm."occurredAt") AS last_active,
              COALESCE(c."fullName", s."fullName", cl."fullName", ia."fullName") AS name,
              COALESCE(c."email", s."email", cl."email", ia."email") AS email,
              d."code" AS dept_code, d."name" AS dept_name, d."arName" AS dept_ar_name
         FROM "activity_read_model" arm
         LEFT JOIN "candidates" c        ON arm."actorRole" = 'candidate'      AND c."id"  = arm."actorId"
         LEFT JOIN "supervisors" s       ON arm."actorRole" = 'supervisor'     AND s."id"  = arm."actorId"
         LEFT JOIN "clerks" cl           ON arm."actorRole" = 'clerk'          AND cl."id" = arm."actorId"
         LEFT JOIN "institute_admins" ia ON arm."actorRole" = 'instituteAdmin' AND ia."id" = arm."actorId"
         LEFT JOIN "departments" d       ON d."id" = arm."departmentId"
        WHERE arm."actorRole" <> $1
          AND arm."occurredAt" >= now() - ($2)::interval
          AND ($3::uuid IS NULL OR arm."departmentId" = $3)
        GROUP BY arm."actorId", arm."actorRole", d."code", d."name", d."arName",
                 c."fullName", s."fullName", cl."fullName", ia."fullName",
                 c."email", s."email", cl."email", ia."email"
        ORDER BY last_active DESC`,
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
        activityCount: r.activity_count,
        lastActive: r.last_active,
      })),
    };
  }

  /**
   * One user's activity within a window: the by-type breakdown, total, and a capped
   * recent timeline (most recent first). Powers the per-user drill-down.
   */
  public async getUserActivity(
    dataSource: DataSource,
    q: { actorId: string; role?: string | null; window: ActiveWindow }
  ) {
    const w: ActiveWindow = WINDOW_INTERVAL[q.window] ? q.window : "quarter";
    const interval = WINDOW_INTERVAL[w];
    const rows = (await dataSource.query(
      `SELECT "activityType" AS activity_type, "occurredAt" AS occurred_at
         FROM "activity_read_model"
        WHERE "actorId" = $1
          AND ($2::text IS NULL OR "actorRole" = $2)
          AND "actorRole" <> $3
          AND "occurredAt" >= now() - ($4)::interval
        ORDER BY "occurredAt" DESC`,
      [q.actorId, q.role ?? null, EXCLUDE_ROLE, interval]
    )) as Array<{ activity_type: string; occurred_at: string }>;

    const byType: Record<string, number> = {};
    for (const r of rows) byType[r.activity_type] = (byType[r.activity_type] ?? 0) + 1;

    return {
      actorId: q.actorId,
      role: q.role ?? null,
      window: w,
      total: rows.length,
      byType,
      recent: rows.slice(0, 50).map((r) => ({
        activityType: r.activity_type,
        occurredAt: r.occurred_at,
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

  public async getAnalytics(dataSource: DataSource, q: ActiveUsersQuery) {
    const granularity: Granularity = GRAN[q.granularity] ? q.granularity : "monthly";
    const scope: Scope = q.scope === "department" ? "department" : "institution";
    const cfg = GRAN[granularity];

    // Department filter: null for institution scope (no filter), a uuid for department scope.
    const deptId: string | null =
      scope === "department" ? await this.resolveDeptId(dataSource, q.deptCode) : null;

    // --- queries (run concurrently) ---

    // 1) Summary: distinct active users over fixed trailing windows (rolling, not calendar).
    const summaryP = dataSource.query(
      `SELECT
         count(DISTINCT "actorId") FILTER (WHERE "occurredAt" >= now() - interval '1 day')::int    AS daily,
         count(DISTINCT "actorId") FILTER (WHERE "occurredAt" >= now() - interval '7 days')::int   AS weekly,
         count(DISTINCT "actorId") FILTER (WHERE "occurredAt" >= now() - interval '30 days')::int  AS monthly,
         count(DISTINCT "actorId") FILTER (WHERE "occurredAt" >= now() - interval '3 months')::int AS quarterly
       FROM "activity_read_model"
       WHERE "actorRole" <> $1
         AND "occurredAt" >= now() - interval '3 months'
         AND ($2::uuid IS NULL OR "departmentId" = $2)`,
      [EXCLUDE_ROLE, deptId]
    );

    // 2) Series axis + per-bucket distinct active users (gap-filled via generate_series).
    const seriesTotalsP = dataSource.query(
      `WITH axis AS (
         SELECT generate_series(
           date_trunc($2, now() - ($4)::interval),
           date_trunc($2, now()),
           ($3)::interval
         ) AS bucket_ts
       )
       SELECT to_char(a.bucket_ts, 'YYYY-MM-DD') AS bucket,
              count(DISTINCT arm."actorId")::int AS active_users
       FROM axis a
       LEFT JOIN "activity_read_model" arm
         ON date_trunc($2, arm."occurredAt") = a.bucket_ts
        AND arm."actorRole" <> $1
        AND ($5::uuid IS NULL OR arm."departmentId" = $5)
       GROUP BY a.bucket_ts
       ORDER BY a.bucket_ts`,
      [EXCLUDE_ROLE, cfg.unit, cfg.step, cfg.lookback, deptId]
    );

    // 3) Per-bucket, per-role distinct active users (only where present).
    const seriesRolesP = dataSource.query(
      `SELECT to_char(date_trunc($2, "occurredAt"), 'YYYY-MM-DD') AS bucket,
              "actorRole" AS role,
              count(DISTINCT "actorId")::int AS c
       FROM "activity_read_model"
       WHERE "actorRole" <> $1
         AND "occurredAt" >= date_trunc($2, now() - ($3)::interval)
         AND ($4::uuid IS NULL OR "departmentId" = $4)
       GROUP BY 1, 2`,
      [EXCLUDE_ROLE, cfg.unit, cfg.lookback, deptId]
    );

    // 4) Activity VOLUME by type over the same window (events, not distinct people).
    const byTypeP = dataSource.query(
      `SELECT "activityType" AS activity_type, count(*)::int AS c
       FROM "activity_read_model"
       WHERE "actorRole" <> $1
         AND "occurredAt" >= date_trunc($2, now() - ($3)::interval)
         AND ($4::uuid IS NULL OR "departmentId" = $4)
       GROUP BY 1
       ORDER BY c DESC`,
      [EXCLUDE_ROLE, cfg.unit, cfg.lookback, deptId]
    );

    // 5) Distinct active users per department (institution scope only; trailing 3 months).
    //    Rows with a NULL departmentId cannot be attributed and are excluded.
    const byDeptP =
      scope === "institution"
        ? dataSource.query(
            `SELECT d."code" AS dept_code, d."name" AS dept_name, d."arName" AS dept_ar_name,
                    count(DISTINCT arm."actorId")::int AS active_users
             FROM "activity_read_model" arm
             JOIN "departments" d ON d."id" = arm."departmentId"
             WHERE arm."actorRole" <> $1
               AND arm."occurredAt" >= now() - interval '3 months'
             GROUP BY d."code", d."name", d."arName"
             ORDER BY active_users DESC`,
            [EXCLUDE_ROLE]
          )
        : Promise.resolve([]);

    // 6) Cap: stored max + the live rolling-quarterly institution-wide distinct count.
    const gateP = this.getSignupGate(dataSource);

    // 7) Data-start markers (overall + login-tracking honesty note).
    const metaP = dataSource.query(
      `SELECT
         (SELECT to_char(min("occurredAt"), 'YYYY-MM-DD') FROM "activity_read_model" WHERE "actorRole" <> $1) AS data_start_date,
         (SELECT to_char(min("loggedInAt"), 'YYYY-MM-DD') FROM "login_events" WHERE "userRole" <> $1) AS login_tracking_started_at`,
      [EXCLUDE_ROLE]
    );

    const [summaryRows, totals, roleRows, typeRows, deptRows, gate, metaRows] =
      await Promise.all([
        summaryP,
        seriesTotalsP,
        seriesRolesP,
        byTypeP,
        byDeptP,
        gateP,
        metaP,
      ]);

    // --- shape ---

    // byRole: bucket -> { role: count }
    const roleByBucket = new Map<string, Record<string, number>>();
    for (const r of roleRows as Array<{ bucket: string; role: string; c: number }>) {
      const m = roleByBucket.get(r.bucket) ?? {};
      m[r.role] = r.c;
      roleByBucket.set(r.bucket, m);
    }
    const series = (totals as Array<{ bucket: string; active_users: number }>).map((row) => ({
      bucket: row.bucket,
      activeUsers: row.active_users,
      byRole: roleByBucket.get(row.bucket) ?? {},
    }));

    const byActivityType: Record<string, number> = {};
    for (const t of typeRows as Array<{ activity_type: string; c: number }>) {
      byActivityType[t.activity_type] = t.c;
    }

    const byDepartment = (deptRows as Array<{
      dept_code: string;
      dept_name: string;
      dept_ar_name: string | null;
      active_users: number;
    }>).map((d) => ({
      deptCode: d.dept_code,
      name: d.dept_name,
      arName: d.dept_ar_name,
      activeUsers: d.active_users,
    }));

    const summary = summaryRows[0] ?? { daily: 0, weekly: 0, monthly: 0, quarterly: 0 };

    return {
      granularity,
      scope,
      deptCode: scope === "department" ? (q.deptCode || process.env.REF_DEPT_CODE || "NS") : null,
      dataStartDate: metaRows[0]?.data_start_date ?? null,
      loginTrackingStartedAt: metaRows[0]?.login_tracking_started_at ?? null,
      summary,
      series,
      byActivityType,
      byDepartment,
      cap: gate,
    };
  }
}
