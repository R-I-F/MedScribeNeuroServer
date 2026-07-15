import { inject, injectable } from "inversify";
import { DataSource } from "typeorm";
import { ClerkProcEntity } from "./clerkProc.mDbSchema";
import { RefApiClient } from "../refApi/refApi.client";
import { IRefProcSearchHit } from "../refApi/refApi.types";

/**
 * The clerk-procedure learning pipeline (docs/CLERK_PROCS_LEARNING_PIPELINE_PLAN.md §2).
 *
 * resolveOrCreate(): looks the normalized phrase up per department; on first sight it runs
 * ONE hub semantic search and stores the best proc_cpt + its main diagnosis + the score.
 * Repeats reuse the stored row — no re-search, no token spend. The clerk flow NEVER blocks
 * on the hub: search failure leaves the row unresolved (retryable on the next encounter).
 */
@injectable()
export class ClerkProcService {
  constructor(@inject(RefApiClient) private refApiClient: RefApiClient) {}

  /** Trim + collapse internal whitespace; original script/casing kept. */
  public static normalizeTitle(raw: string): string {
    return (raw ?? "").trim().replace(/\s+/g, " ");
  }

  public async resolveOrCreate(
    rawTitle: string,
    departmentId: string,
    clerkId: string | null,
    dataSource: DataSource
  ): Promise<ClerkProcEntity | null> {
    const title = ClerkProcService.normalizeTitle(rawTitle);
    if (!title) return null;

    const repo = dataSource.getRepository(ClerkProcEntity);

    const existing = await repo.findOne({ where: { departmentId, title } });
    if (existing) {
      // Learned already. If a past resolution failed, retry it opportunistically.
      if (!existing.procCptId) {
        await this.tryResolve(existing, dataSource);
      }
      return existing;
    }

    const row = repo.create({ title, departmentId, clerkId });
    await repo.save(row);
    await this.tryResolve(row, dataSource);
    return row;
  }

  /**
   * One semantic search against the hub; stores best procCptId + mainDiagId + score.
   * Ids come from the hub response when present (post-enhancement hubs) and otherwise
   * resolve EXACTLY through the local mirror: (alphaCode,numCode) is unique on proc_cpts
   * and (departmentId,title) is unique on main_diags — verified, deterministic, no guessing.
   * Never throws: failures leave the row unresolved.
   */
  private async tryResolve(row: ClerkProcEntity, dataSource: DataSource): Promise<void> {
    try {
      const deptCode = await this.getDeptCode(row.departmentId, dataSource);
      if (!deptCode) return;

      const hits = await this.refApiClient.procedureSearch(row.title, deptCode, 1);
      const best: IRefProcSearchHit | undefined = hits?.[0];
      if (!best) return;

      let procCptId: string | null = best.procCptId ?? null;
      if (!procCptId) {
        const rows = await dataSource.query(
          `SELECT "id" FROM "proc_cpts" WHERE "alphaCode" = $1 AND "numCode" = $2`,
          [best.alphaCode, best.numCode]
        );
        procCptId = rows[0]?.id ?? null;
      }

      const firstMd = best.mainDiagnoses?.[0];
      let mainDiagId: string | null = firstMd?.id ?? null;
      if (!mainDiagId && firstMd?.title) {
        const rows = await dataSource.query(
          `SELECT "id" FROM "main_diags" WHERE "departmentId" = $1 AND "title" = $2`,
          [row.departmentId, firstMd.title]
        );
        mainDiagId = rows[0]?.id ?? null;
      }

      if (procCptId || mainDiagId) {
        row.procCptId = procCptId;
        row.mainDiagId = mainDiagId;
        row.matchScore = typeof best.similarity === "number" ? best.similarity : null;
        await dataSource.getRepository(ClerkProcEntity).save(row);
      }
    } catch (err: any) {
      console.warn(
        `[ClerkProc] semantic resolution failed for "${row.title}" (left unresolved, retryable): ${err?.message ?? err}`
      );
    }
  }

  private async getDeptCode(departmentId: string, dataSource: DataSource): Promise<string | null> {
    const rows = await dataSource.query(`SELECT "code" FROM "departments" WHERE "id" = $1`, [departmentId]);
    return rows[0]?.code ?? null;
  }

  /** Typeahead source: the department's learned phrases with their resolved context. */
  public async listByDepartment(departmentId: string, dataSource: DataSource) {
    return dataSource.query(
      `SELECT cp."id", cp."title", cp."matchScore",
              p."title" AS "procTitle", p."arTitle" AS "procArTitle", p."alphaCode"
         FROM "clerk_procs" cp
         LEFT JOIN "proc_cpts" p ON p."id" = cp."procCptId"
        WHERE cp."departmentId" = $1
        ORDER BY cp."title"`,
      [departmentId]
    );
  }
}
