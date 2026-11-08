import { injectable } from "inversify";
import { DataSource } from "typeorm";
import { Rank } from "../cand/cand.interface";
import { UserRole } from "../types/role.types";

/** A rule failure the router maps to an HTTP status by `code`. */
export class RankChangeError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

export interface RankChangeRequestRow {
  id: string;
  candidateId: string;
  fromRank: string;
  requestedRank: string;
  status: string;
  reviewNote: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
}

export interface AdminRankChangeRequestRow extends RankChangeRequestRow {
  candidateName: string;
  candidateEmail: string;
  regNum: string;
  currentRank: string;
  departmentId: string | null;
  departmentName: string | null;
  departmentArName: string | null;
}

const RANK_VALUES = new Set<string>(Object.values(Rank));
const STATUSES = new Set(["pending", "approved", "rejected", "canceled"]);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const PUBLIC_COLS = `r."id", r."candidateId", r."fromRank", r."requestedRank", r."status",
  r."reviewNote", r."reviewedAt", r."createdAt"`;

/**
 * Candidate rank change requests (docs/RANK_CHANGE_REQUEST_PLAN.md).
 *
 * `candidates.rank` is written in exactly one place: `review()` with an approval, inside the
 * same transaction that closes the request. Candidates can only ask, see and cancel their own.
 */
@injectable()
export class RankChangeRequestProvider {
  /**
   * The JWT role gate (requireCandidate) is hierarchical, so a supervisor or admin token would
   * pass it. Narrow to a real, active candidate row here.
   */
  private async getActiveCandidate(
    candidateId: string | undefined,
    role: string | undefined,
    ds: DataSource
  ): Promise<{ id: string; rank: string }> {
    if (role !== UserRole.CANDIDATE || !candidateId || !UUID_RE.test(candidateId)) {
      throw new RankChangeError("not_candidate", "Only candidates can request a rank change");
    }
    const rows = await ds.query(
      `SELECT "id", "rank"::text AS "rank" FROM "candidates" WHERE "id" = $1 AND "archivedAt" IS NULL`,
      [candidateId]
    );
    if (!rows[0]) throw new RankChangeError("not_candidate", "Candidate account not found");
    return rows[0];
  }

  /** The candidate's most recent request (any status), or null if they never asked. */
  public async getMine(candidateId: string | undefined, role: string | undefined, ds: DataSource) {
    const cand = await this.getActiveCandidate(candidateId, role, ds);
    const rows = await ds.query(
      `SELECT ${PUBLIC_COLS} FROM "rank_change_requests" r
        WHERE r."candidateId" = $1 ORDER BY r."createdAt" DESC LIMIT 1`,
      [cand.id]
    );
    return { currentRank: cand.rank, latest: (rows[0] as RankChangeRequestRow) ?? null };
  }

  public async create(
    candidateId: string | undefined,
    role: string | undefined,
    requestedRank: unknown,
    ds: DataSource
  ): Promise<RankChangeRequestRow> {
    const cand = await this.getActiveCandidate(candidateId, role, ds);
    const wanted = typeof requestedRank === "string" ? requestedRank.trim().toLowerCase() : "";
    if (!RANK_VALUES.has(wanted)) {
      throw new RankChangeError("invalid_rank", "requestedRank is not a valid rank");
    }
    if (wanted === cand.rank) {
      throw new RankChangeError("same_rank", "That is already your current rank");
    }
    try {
      const rows = await ds.query(
        `INSERT INTO "rank_change_requests" ("candidateId", "fromRank", "requestedRank")
         VALUES ($1, $2, $3)
         RETURNING "id", "candidateId", "fromRank", "requestedRank", "status",
                   "reviewNote", "reviewedAt", "createdAt"`,
        [cand.id, cand.rank, wanted]
      );
      return rows[0];
    } catch (err: any) {
      // UQ_rcr_one_pending: a second pending request for the same candidate.
      if (err?.code === "23505") {
        throw new RankChangeError(
          "already_pending",
          "You already have a pending rank change request. Cancel it first to ask for a different rank."
        );
      }
      throw err;
    }
  }

  public async cancelMine(candidateId: string | undefined, role: string | undefined, ds: DataSource) {
    const cand = await this.getActiveCandidate(candidateId, role, ds);
    const rows = await ds.query(
      `UPDATE "rank_change_requests" SET "status" = 'canceled', "updatedAt" = now()
        WHERE "candidateId" = $1 AND "status" = 'pending'
        RETURNING "id"`,
      [cand.id]
    );
    // TypeORM returns [rows, affectedCount] for UPDATE ... RETURNING on Postgres.
    const list = Array.isArray(rows?.[0]) ? rows[0] : rows;
    if (!list?.length) throw new RankChangeError("not_found", "You have no pending rank change request");
    return { canceled: true };
  }

  /**
   * Requests visible to an admin. `departmentId` NULL = institution-wide (super admin, or an
   * admin row with no department). Archived (promoted) candidates are left out.
   * `status` defaults to pending; "all" returns every status.
   */
  public async listForAdmin(
    departmentId: string | null,
    status: string | undefined,
    ds: DataSource
  ): Promise<AdminRankChangeRequestRow[]> {
    const wanted = status === "all" ? null : status || "pending";
    if (wanted && !STATUSES.has(wanted)) {
      throw new RankChangeError("invalid_status", "status must be pending, approved, rejected, canceled or all");
    }
    return ds.query(
      `SELECT ${PUBLIC_COLS},
              c."fullName" AS "candidateName", c."email" AS "candidateEmail", c."regNum",
              c."rank"::text AS "currentRank", c."departmentId",
              d."name" AS "departmentName", d."arName" AS "departmentArName"
         FROM "rank_change_requests" r
         JOIN "candidates" c ON c."id" = r."candidateId"
         LEFT JOIN "departments" d ON d."id" = c."departmentId"
        WHERE c."archivedAt" IS NULL
          AND ($1::uuid IS NULL OR c."departmentId" = $1::uuid)
          AND ($2::varchar IS NULL OR r."status" = $2::varchar)
        ORDER BY (r."status" = 'pending') DESC, r."createdAt" DESC
        LIMIT 500`,
      [departmentId, wanted]
    );
  }

  public async countPending(departmentId: string | null, ds: DataSource): Promise<number> {
    const rows = await ds.query(
      `SELECT count(*)::int AS "n"
         FROM "rank_change_requests" r
         JOIN "candidates" c ON c."id" = r."candidateId"
        WHERE r."status" = 'pending' AND c."archivedAt" IS NULL
          AND ($1::uuid IS NULL OR c."departmentId" = $1::uuid)`,
      [departmentId]
    );
    return rows[0]?.n ?? 0;
  }

  /**
   * Approve or reject. One transaction: lock the request, re-check it is still pending and in
   * the admin's department, then (approve only) write the candidate's rank.
   */
  public async review(
    requestId: string,
    decision: unknown,
    note: unknown,
    reviewer: { id: string | undefined; role: string | undefined; departmentId: string | null },
    ds: DataSource
  ): Promise<RankChangeRequestRow> {
    if (!UUID_RE.test(requestId)) throw new RankChangeError("not_found", "Request not found");
    if (decision !== "approve" && decision !== "reject") {
      throw new RankChangeError("invalid_decision", "decision must be approve or reject");
    }
    const reviewNote = typeof note === "string" && note.trim() ? note.trim().slice(0, 500) : null;

    return ds.transaction(async (m) => {
      const rows = await m.query(
        `SELECT r."id", r."status", r."requestedRank", r."candidateId",
                c."departmentId", c."archivedAt"
           FROM "rank_change_requests" r
           JOIN "candidates" c ON c."id" = r."candidateId"
          WHERE r."id" = $1
          FOR UPDATE OF r`,
        [requestId]
      );
      const row = rows[0];
      if (!row) throw new RankChangeError("not_found", "Request not found");
      if (reviewer.departmentId && row.departmentId !== reviewer.departmentId) {
        // Same answer as a missing id, so an admin cannot probe other departments.
        throw new RankChangeError("not_found", "Request not found");
      }
      if (row.status !== "pending") {
        throw new RankChangeError("not_pending", `This request was already ${row.status}`);
      }
      if (row.archivedAt) {
        throw new RankChangeError("not_pending", "This candidate is no longer an active candidate");
      }

      if (decision === "approve") {
        await m.query(
          `UPDATE "candidates" SET "rank" = $1::"candidates_rank_enum", "updatedAt" = now() WHERE "id" = $2`,
          [row.requestedRank, row.candidateId]
        );
      }
      await m.query(
        `UPDATE "rank_change_requests"
            SET "status" = $1, "reviewedById" = $2, "reviewedByRole" = $3,
                "reviewNote" = $4, "reviewedAt" = now(), "updatedAt" = now()
          WHERE "id" = $5`,
        [decision === "approve" ? "approved" : "rejected", reviewer.id ?? null, reviewer.role ?? null, reviewNote, requestId]
      );
      const out = await m.query(`SELECT ${PUBLIC_COLS} FROM "rank_change_requests" r WHERE r."id" = $1`, [
        requestId,
      ]);
      return out[0] as RankChangeRequestRow;
    });
  }
}
