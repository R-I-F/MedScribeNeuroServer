import { inject, injectable } from "inversify";
import { DataSource, IsNull, LessThan } from "typeorm";
import { ClerkProcEntity } from "./clerkProc.mDbSchema";
import { RefApiClient } from "../refApi/refApi.client";
import { IRefProcSearchHit } from "../refApi/refApi.types";
import { ProcPhraseService } from "./procPhrase.service";

/**
 * The clerk-procedure learning pipeline (docs/CLERK_PROCS_LEARNING_PIPELINE_PLAN.md §2 +
 * docs/CLERK_PROCS_BILINGUAL_TITLES_AND_DELTA_SYNC_PLAN.md §2/§3.6).
 *
 * Instant-save split (§3.6):
 *   resolveOrCreate() — SYNCHRONOUS, local-only: find-or-insert the phrase row per
 *     (departmentId, normalized title), typed-language title slot filled verbatim (free).
 *     No hub call, no AI — the clerk's save never waits.
 *   enrich() — BACKGROUND (fire-and-forget from the provider): ONE dept-scoped hub semantic
 *     search per new phrase (department narrowing happens INSIDE the hub query, before the
 *     cosine ranking — plan §2.0) + ONE translation for the missing title slot. Repeats of a
 *     known phrase reuse the stored row — no re-search, no re-translation, zero token spend.
 *   Failures leave the slots NULL — retried opportunistically on the next encounter.
 */
@injectable()
export class ClerkProcService {
  constructor(
    @inject(RefApiClient) private refApiClient: RefApiClient,
    @inject(ProcPhraseService) private procPhraseService: ProcPhraseService
  ) {}

  /** Trim + collapse internal whitespace; original script/casing kept. */
  public static normalizeTitle(raw: string): string {
    return (raw ?? "").trim().replace(/\s+/g, " ");
  }

  /** Synchronous learning step: find-or-insert the phrase row. Local DB work only. */
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
    if (existing) return existing; // learned already — reuse, zero tokens

    const typedIsArabic = ProcPhraseService.isArabic(title);
    const row = repo.create({
      title,
      departmentId,
      clerkId,
      titleAr: typedIsArabic ? title : null,
      titleEn: typedIsArabic ? null : title,
    });
    await repo.save(row);
    return row;
  }

  /**
   * Background enrichment: hub semantic resolution (if unresolved) + missing-title-slot
   * translation. Opportunistically retries past failures. Never throws.
   */
  public async enrich(row: ClerkProcEntity, dataSource: DataSource): Promise<void> {
    if (!row.procCptId) {
      await this.tryResolve(row, dataSource);
    }
    await this.tryTranslateTitle(row, dataSource);
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

  /**
   * Fill the missing bilingual title slot (ONE translation per new phrase — plan §2.3).
   * Also heals legacy rows created before the bilingual columns (typed slot backfilled free).
   * Never throws: a failed translation leaves the slot NULL, retryable.
   */
  private async tryTranslateTitle(row: ClerkProcEntity, dataSource: DataSource): Promise<void> {
    try {
      const typedIsArabic = ProcPhraseService.isArabic(row.title);
      let dirty = false;
      if (typedIsArabic && !row.titleAr) {
        row.titleAr = row.title;
        dirty = true;
      }
      if (!typedIsArabic && !row.titleEn) {
        row.titleEn = row.title;
        dirty = true;
      }

      const missing: "ar" | "en" | null = !row.titleEn ? "en" : !row.titleAr ? "ar" : null;
      if (missing) {
        const map = await this.procPhraseService.translateBatch([row.title], missing);
        const translated = map.get(row.title) ?? null;
        if (translated) {
          if (missing === "en") row.titleEn = translated;
          else row.titleAr = translated;
          dirty = true;
        }
      }

      if (dirty) await dataSource.getRepository(ClerkProcEntity).save(row);
    } catch (err: any) {
      console.warn(
        `[ClerkProc] title translation failed for "${row.title}" (slot stays NULL, retryable): ${err?.message ?? err}`
      );
    }
  }

  /**
   * Self-healing sweep: re-attempt enrichment for rows a past background attempt left
   * incomplete (hub blip/cold start → NULL procCptId; Gemini failure → NULL title slot).
   * Without this, a phrase typed ONCE would stay unresolved until someone retyped it.
   * Called from the reference-data poll tick (+ once shortly after boot). Bounded,
   * sequential, overlap-guarded, never throws. Rows younger than 2 minutes are skipped —
   * their create-time enrich may still be in flight.
   */
  private retrySweepRunning = false;
  public async retryUnresolved(dataSource: DataSource, limit = 5): Promise<void> {
    if (this.retrySweepRunning) return;
    this.retrySweepRunning = true;
    try {
      const settledBefore = LessThan(new Date(Date.now() - 2 * 60 * 1000));
      const rows = await dataSource.getRepository(ClerkProcEntity).find({
        where: [
          { procCptId: IsNull(), updatedAt: settledBefore },
          { titleAr: IsNull(), updatedAt: settledBefore },
          { titleEn: IsNull(), updatedAt: settledBefore },
        ],
        order: { updatedAt: "ASC" },
        take: limit,
      });
      if (!rows.length) return;
      console.log(`[ClerkProc] retry sweep: re-enriching ${rows.length} incomplete phrase(s)`);
      for (const row of rows) {
        await this.enrich(row, dataSource);
      }
    } catch (err: any) {
      console.warn(`[ClerkProc] retry sweep failed (next tick retries): ${err?.message ?? err}`);
    } finally {
      this.retrySweepRunning = false;
    }
  }

  private async getDeptCode(departmentId: string, dataSource: DataSource): Promise<string | null> {
    const rows = await dataSource.query(`SELECT "code" FROM "departments" WHERE "id" = $1`, [departmentId]);
    return rows[0]?.code ?? null;
  }

  /** Typeahead source: the department's learned phrases with their resolved context. */
  public async listByDepartment(departmentId: string, dataSource: DataSource) {
    return dataSource.query(
      `SELECT cp."id", cp."title", cp."titleAr", cp."titleEn", cp."matchScore",
              p."title" AS "procTitle", p."arTitle" AS "procArTitle", p."alphaCode"
         FROM "clerk_procs" cp
         LEFT JOIN "proc_cpts" p ON p."id" = cp."procCptId"
        WHERE cp."departmentId" = $1
        ORDER BY cp."title"`,
      [departmentId]
    );
  }
}
