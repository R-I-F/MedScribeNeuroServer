import "reflect-metadata";
import { injectable } from "inversify";
import { DataSource, MoreThanOrEqual } from "typeorm";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import { AiOfficeActivityEntity } from "./aiOfficeActivity.mDbSchema";
import { AiOfficeAccessRequestEntity } from "./aiOfficeAccessRequest.mDbSchema";
import { AI_OFFICE_DONE_STATUSES, AiOfficeMemberRole } from "./aiOffice.types";
import {
  IAiOfficeAccessRequestRow,
  IAiOfficeActivityAdminDoc,
  IAiOfficeActivityDoc,
  IAiOfficeAdminActivitiesQuery,
  IAiOfficeAdminStats,
  IAiOfficeAdminUserRow,
  IAiOfficeAdminUsersQuery,
  IAiOfficeMember,
  IAiOfficeStats,
  IPaged,
} from "./aiOffice.interface";

const USER_TABLE: Record<AiOfficeMemberRole, string> = {
  candidate: "candidates",
  supervisor: "supervisors",
};

const MEMBER_COLUMN: Record<AiOfficeMemberRole, "candidateId" | "supervisorId"> = {
  candidate: "candidateId",
  supervisor: "supervisorId",
};

/**
 * Timestamps are stored as UTC wall clock (server timezone GMT). node-postgres would parse them
 * as the process's LOCAL time, so they are formatted in SQL instead.
 */
const iso = (expr: string) => `to_char(${expr}, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')`;

/** Every activity query reads through the same joins, so filters can name any of them. */
const ACTIVITY_FROM = `
  FROM "ai_office_activities" a
  LEFT JOIN "candidates" c ON c."id" = a."candidateId"
  LEFT JOIN "supervisors" s ON s."id" = a."supervisorId"
  LEFT JOIN "departments" d ON d."id" = COALESCE(c."departmentId", s."departmentId")`;

const ACTIVITY_COLUMNS = `
  a."id", a."activityType", a."title", a."status",
  to_char(a."activityDate", 'YYYY-MM-DD') AS "activityDate",
  a."notes", a."details", ${iso('a."createdAt"')} AS "createdAt", ${iso('a."updatedAt"')} AS "updatedAt"`;

const MEMBER_COLUMNS = `
  COALESCE(a."candidateId", a."supervisorId") AS "memberId",
  CASE WHEN a."candidateId" IS NOT NULL THEN 'candidate' ELSE 'supervisor' END AS "memberRole",
  COALESCE(c."fullName", s."fullName") AS "memberName",
  d."name" AS "departmentName", d."arName" AS "departmentArName",
  COALESCE(c."departmentOther", s."departmentOther") AS "departmentOther"`;

export interface ISqlScope {
  sql: string;
  params: unknown[];
}

/** Escapes LIKE wildcards so a search for "50%" matches literally. */
const likeTerm = (term: string) => `%${term.replace(/[\\%_]/g, (ch) => `\\${ch}`)}%`;

/**
 * Repository layer for the AI Office (docs/AI_OFFICE_PLAN.md). Business rules (who is a member,
 * what a valid activity is, signup handling) live in the provider.
 */
@injectable()
export class AiOfficeService {
  // ── members ──────────────────────────────────────────────────────────────

  public async getMemberRow(
    role: AiOfficeMemberRole,
    id: string,
    dataSource: DataSource
  ): Promise<IAiOfficeMember | null> {
    const archived = role === "candidate" ? `(u."archivedAt" IS NOT NULL)` : `false`;
    const rows = await dataSource.query(
      `SELECT u."id", u."fullName", u."email", u."approved", u."aiOfficeMember",
              u."departmentId", u."departmentOther", ${archived} AS "archived"
         FROM "${USER_TABLE[role]}" u
        WHERE u."id" = $1`,
      [id]
    );
    return rows[0] ? { ...rows[0], role } : null;
  }

  // ── activities ───────────────────────────────────────────────────────────

  public async createActivity(
    data: Omit<AiOfficeActivityEntity, "id" | "createdAt" | "updatedAt">,
    dataSource: DataSource
  ): Promise<string> {
    const repo = dataSource.getRepository(AiOfficeActivityEntity);
    const saved = await repo.save(repo.create(data));
    return saved.id;
  }

  public async updateActivity(
    id: string,
    data: Pick<AiOfficeActivityEntity, "activityType" | "title" | "status" | "activityDate" | "notes" | "details">,
    dataSource: DataSource
  ): Promise<void> {
    // TypeORM's partial-entity type cannot express an arbitrary jsonb object; the provider has
    // already reduced `details` to the section's own fields.
    await dataSource
      .getRepository(AiOfficeActivityEntity)
      .update({ id }, data as QueryDeepPartialEntity<AiOfficeActivityEntity>);
  }

  public async getActivityForMember(
    id: string,
    role: AiOfficeMemberRole,
    memberId: string,
    dataSource: DataSource
  ): Promise<IAiOfficeActivityDoc | null> {
    const rows = await dataSource.query(
      `SELECT ${ACTIVITY_COLUMNS} FROM "ai_office_activities" a
        WHERE a."id" = $1 AND a."${MEMBER_COLUMN[role]}" = $2`,
      [id, memberId]
    );
    return rows[0] ?? null;
  }

  public async listActivitiesForMember(
    role: AiOfficeMemberRole,
    memberId: string,
    dataSource: DataSource
  ): Promise<IAiOfficeActivityDoc[]> {
    return dataSource.query(
      `SELECT ${ACTIVITY_COLUMNS} FROM "ai_office_activities" a
        WHERE a."${MEMBER_COLUMN[role]}" = $1
        ORDER BY a."createdAt" DESC`,
      [memberId]
    );
  }

  /** The scope a member's own statistics are computed over. */
  public memberScope(role: AiOfficeMemberRole, memberId: string): ISqlScope {
    return { sql: `a."${MEMBER_COLUMN[role]}" = $1`, params: [memberId] };
  }

  public adminActivityScope(query: IAiOfficeAdminActivitiesQuery): ISqlScope {
    const where: string[] = ["TRUE"];
    const params: unknown[] = [];
    const add = (sql: (n: string) => string, value: unknown) => {
      params.push(value);
      where.push(sql(`$${params.length}`));
    };
    if (query.activityType) add((n) => `a."activityType" = ${n}`, query.activityType);
    if (query.status) add((n) => `a."status" = ${n}`, query.status);
    if (query.role === "candidate") where.push(`a."candidateId" IS NOT NULL`);
    if (query.role === "supervisor") where.push(`a."supervisorId" IS NOT NULL`);
    if (query.memberId) add((n) => `COALESCE(a."candidateId", a."supervisorId") = ${n}`, query.memberId);
    if (query.departmentId === "none") where.push(`COALESCE(c."departmentId", s."departmentId") IS NULL`);
    else if (query.departmentId && query.departmentId !== "all") {
      add((n) => `COALESCE(c."departmentId", s."departmentId") = ${n}`, query.departmentId);
    }
    if (query.from) add((n) => `a."createdAt" >= ${n}::date`, query.from);
    if (query.to) add((n) => `a."createdAt" < (${n}::date + interval '1 day')`, query.to);
    return { sql: where.join(" AND "), params };
  }

  public async listActivitiesForAdmin(
    query: IAiOfficeAdminActivitiesQuery,
    dataSource: DataSource
  ): Promise<IPaged<IAiOfficeActivityAdminDoc>> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 25;
    const scope = this.adminActivityScope(query);
    const [countRows, items] = await Promise.all([
      dataSource.query(`SELECT COUNT(*)::int AS "n" ${ACTIVITY_FROM} WHERE ${scope.sql}`, scope.params),
      dataSource.query(
        `SELECT ${ACTIVITY_COLUMNS}, ${MEMBER_COLUMNS}
           ${ACTIVITY_FROM}
          WHERE ${scope.sql}
          ORDER BY a."createdAt" DESC
          LIMIT $${scope.params.length + 1} OFFSET $${scope.params.length + 2}`,
        [...scope.params, pageSize, (page - 1) * pageSize]
      ),
    ]);
    return { items, total: countRows[0]?.n ?? 0, page, pageSize };
  }

  // ── statistics ───────────────────────────────────────────────────────────

  public async getStats(scope: ISqlScope, dataSource: DataSource): Promise<IAiOfficeStats> {
    const doneParam = `$${scope.params.length + 1}`;
    const [totals, byType, byStatus, byMonth] = await Promise.all([
      dataSource.query(
        `SELECT COUNT(*)::int AS "total",
                COUNT(*) FILTER (WHERE a."status" = ANY(${doneParam}::text[]))::int AS "done",
                COUNT(*) FILTER (WHERE a."createdAt" >= date_trunc('quarter', now()))::int AS "thisQuarter",
                ${iso('MAX(a."createdAt")')} AS "lastActivityAt"
           ${ACTIVITY_FROM}
          WHERE ${scope.sql}`,
        [...scope.params, AI_OFFICE_DONE_STATUSES]
      ),
      dataSource.query(
        `SELECT a."activityType", COUNT(*)::int AS "count"
           ${ACTIVITY_FROM}
          WHERE ${scope.sql}
          GROUP BY a."activityType"
          ORDER BY "count" DESC`,
        scope.params
      ),
      dataSource.query(
        `SELECT a."status", COUNT(*)::int AS "count"
           ${ACTIVITY_FROM}
          WHERE ${scope.sql} AND a."status" IS NOT NULL
          GROUP BY a."status"
          ORDER BY "count" DESC`,
        scope.params
      ),
      dataSource.query(
        `SELECT to_char(m."month", 'YYYY-MM') AS "month", COALESCE(x."n", 0)::int AS "count"
           FROM generate_series(date_trunc('month', now()) - interval '11 months',
                                date_trunc('month', now()), interval '1 month') AS m("month")
           LEFT JOIN (
             SELECT date_trunc('month', a."createdAt") AS "month", COUNT(*) AS "n"
               ${ACTIVITY_FROM}
              WHERE ${scope.sql}
              GROUP BY 1
           ) x ON x."month" = m."month"
          ORDER BY m."month"`,
        scope.params
      ),
    ]);
    return { ...totals[0], byType, byStatus, byMonth };
  }

  public async getAdminStats(
    query: IAiOfficeAdminActivitiesQuery,
    dataSource: DataSource
  ): Promise<IAiOfficeAdminStats> {
    const scope = this.adminActivityScope(query);
    const [base, members, byMember, byDepartment] = await Promise.all([
      this.getStats(scope, dataSource),
      dataSource.query(
        `SELECT
           (SELECT COUNT(*) FROM "candidates" WHERE "aiOfficeMember" AND "archivedAt" IS NULL)::int
           + (SELECT COUNT(*) FROM "supervisors" WHERE "aiOfficeMember")::int AS "membersTotal",
           (SELECT COUNT(DISTINCT COALESCE(a."candidateId", a."supervisorId")) ${ACTIVITY_FROM} WHERE ${scope.sql})::int
             AS "activeMembers"`,
        scope.params
      ),
      dataSource.query(
        `SELECT ${MEMBER_COLUMNS}, COUNT(*)::int AS "count", ${iso('MAX(a."createdAt")')} AS "lastActivityAt"
           ${ACTIVITY_FROM}
          WHERE ${scope.sql}
          GROUP BY 1, 2, 3, 4, 5, 6
          ORDER BY "count" DESC, "memberName"
          LIMIT 100`,
        scope.params
      ),
      dataSource.query(
        `SELECT d."name" AS "departmentName", d."arName" AS "departmentArName",
                CASE WHEN d."id" IS NULL THEN COALESCE(c."departmentOther", s."departmentOther") END AS "departmentOther",
                COUNT(*)::int AS "count"
           ${ACTIVITY_FROM}
          WHERE ${scope.sql}
          GROUP BY 1, 2, 3
          ORDER BY "count" DESC`,
        scope.params
      ),
    ]);
    return { ...base, ...members[0], byMember, byDepartment };
  }

  // ── super-admin user console ─────────────────────────────────────────────

  public async listUsersForAdmin(
    query: IAiOfficeAdminUsersQuery,
    dataSource: DataSource
  ): Promise<IPaged<IAiOfficeAdminUserRow>> {
    const role = query.role;
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 25;
    const where: string[] = [role === "candidate" ? `u."archivedAt" IS NULL` : "TRUE"];
    const params: unknown[] = [];
    const add = (sql: (n: string) => string, value: unknown) => {
      params.push(value);
      where.push(sql(`$${params.length}`));
    };
    if (query.departmentId === "none") where.push(`u."departmentId" IS NULL`);
    else if (query.departmentId && query.departmentId !== "all") add((n) => `u."departmentId" = ${n}`, query.departmentId);
    if (query.aiOffice === "yes") where.push(`u."aiOfficeMember"`);
    if (query.aiOffice === "no") where.push(`NOT u."aiOfficeMember"`);
    if (query.approved === "yes") where.push(`u."approved"`);
    if (query.approved === "no") where.push(`NOT u."approved"`);
    if (query.search?.trim()) {
      add(
        (n) => `(u."fullName" ILIKE ${n} OR u."email" ILIKE ${n} OR u."phoneNum" ILIKE ${n})`,
        likeTerm(query.search.trim())
      );
    }
    const roleColumns =
      role === "supervisor"
        ? `u."canValidate", u."canValClin", u."position"`
        : `u."rank"::text AS "rank", u."regDeg"::text AS "regDeg"`;
    const whereSql = where.join(" AND ");

    const [countRows, items] = await Promise.all([
      dataSource.query(`SELECT COUNT(*)::int AS "n" FROM "${USER_TABLE[role]}" u WHERE ${whereSql}`, params),
      dataSource.query(
        `SELECT u."id", '${role}' AS "role", u."fullName", u."email", u."phoneNum", u."approved",
                u."aiOfficeMember", u."departmentId", d."name" AS "departmentName",
                d."arName" AS "departmentArName", u."departmentOther",
                ${iso('u."createdAt"')} AS "createdAt", ${roleColumns},
                (SELECT COUNT(*)::int FROM "ai_office_activities" a
                  WHERE a."${MEMBER_COLUMN[role]}" = u."id") AS "activityCount"
           FROM "${USER_TABLE[role]}" u
           LEFT JOIN "departments" d ON d."id" = u."departmentId"
          WHERE ${whereSql}
          ORDER BY u."createdAt" DESC
          LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, pageSize, (page - 1) * pageSize]
      ),
    ]);
    return { items, total: countRows[0]?.n ?? 0, page, pageSize };
  }

  public async setAiOfficeMember(
    role: AiOfficeMemberRole,
    id: string,
    value: boolean,
    dataSource: DataSource
  ): Promise<void> {
    await dataSource.query(
      `UPDATE "${USER_TABLE[role]}" SET "aiOfficeMember" = $1, "updatedAt" = now() WHERE "id" = $2`,
      [value, id]
    );
  }

  // ── signup support ───────────────────────────────────────────────────────

  /**
   * Every account with this email in either user table, active ones first. A promoted candidate
   * shows up twice (archived candidate row + supervisor row), so the supervisor row leads.
   */
  public async findAccountsByEmail(
    email: string,
    dataSource: DataSource
  ): Promise<
    Array<{
      role: AiOfficeMemberRole;
      id: string;
      fullName: string;
      approved: boolean;
      aiOfficeMember: boolean;
      archived: boolean;
      departmentLabel: string | null;
      createdAt: string;
    }>
  > {
    return dataSource.query(
      `SELECT * FROM (
         SELECT 'candidate' AS "role", c."id", c."fullName", c."approved", c."aiOfficeMember",
                (c."archivedAt" IS NOT NULL) AS "archived",
                COALESCE(d."name", c."departmentOther") AS "departmentLabel",
                ${iso('c."createdAt"')} AS "createdAt"
           FROM "candidates" c LEFT JOIN "departments" d ON d."id" = c."departmentId"
          WHERE LOWER(c."email") = $1
         UNION ALL
         SELECT 'supervisor', s."id", s."fullName", s."approved", s."aiOfficeMember", false,
                COALESCE(d."name", s."departmentOther"), ${iso('s."createdAt"')}
           FROM "supervisors" s LEFT JOIN "departments" d ON d."id" = s."departmentId"
          WHERE LOWER(s."email") = $1
       ) x
       ORDER BY x."archived" ASC, x."role" DESC`,
      [email]
    );
  }

  public async phoneExists(role: AiOfficeMemberRole, phoneNum: string, dataSource: DataSource): Promise<boolean> {
    const rows = await dataSource.query(
      `SELECT 1 FROM "${USER_TABLE[role]}" WHERE "phoneNum" = $1 LIMIT 1`,
      [phoneNum]
    );
    return rows.length > 0;
  }

  public async getDepartmentName(id: string, dataSource: DataSource): Promise<string | null> {
    const rows = await dataSource.query(`SELECT "name" FROM "departments" WHERE "id" = $1`, [id]);
    return rows[0]?.name ?? null;
  }

  // ── access requests ──────────────────────────────────────────────────────

  public async createAccessRequest(
    data: Omit<AiOfficeAccessRequestEntity, "id" | "createdAt" | "emailedAt">,
    dataSource: DataSource
  ): Promise<AiOfficeAccessRequestEntity> {
    const repo = dataSource.getRepository(AiOfficeAccessRequestEntity);
    return repo.save(repo.create({ ...data, emailedAt: null }));
  }

  /** Notification emails already sent for this address since `since` (the per-email cap). */
  public async countEmailedForEmailSince(email: string, since: Date, dataSource: DataSource): Promise<number> {
    return dataSource.getRepository(AiOfficeAccessRequestEntity).count({
      where: { email, emailedAt: MoreThanOrEqual(since) },
    });
  }

  /** Notification emails sent since `since` for any address (the daily budget). */
  public async countEmailedSince(since: Date, dataSource: DataSource): Promise<number> {
    return dataSource.getRepository(AiOfficeAccessRequestEntity).count({
      where: { emailedAt: MoreThanOrEqual(since) },
    });
  }

  public async markAccessRequestEmailed(id: string, dataSource: DataSource): Promise<void> {
    await dataSource.getRepository(AiOfficeAccessRequestEntity).update({ id }, { emailedAt: new Date() });
  }

  public async listAccessRequests(
    page: number,
    pageSize: number,
    dataSource: DataSource
  ): Promise<IPaged<IAiOfficeAccessRequestRow>> {
    const [countRows, items] = await Promise.all([
      dataSource.query(`SELECT COUNT(*)::int AS "n" FROM "ai_office_access_requests"`),
      dataSource.query(
        `SELECT "id", "email", "requestedRole", "existingRole", "existingUserId", "fullName",
                "departmentLabel", ("emailedAt" IS NOT NULL) AS "emailed", ${iso('"createdAt"')} AS "createdAt"
           FROM "ai_office_access_requests"
          ORDER BY "createdAt" DESC
          LIMIT $1 OFFSET $2`,
        [pageSize, (page - 1) * pageSize]
      ),
    ]);
    return { items, total: countRows[0]?.n ?? 0, page, pageSize };
  }
}
