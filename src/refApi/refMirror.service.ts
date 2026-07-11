import "reflect-metadata";
import { inject, injectable } from "inversify";
import { QueryRunner } from "typeorm";
import { AppDataSource, initializeDatabase } from "../config/database.config";
import { RefApiClient } from "./refApi.client";
import { IRefDiagnosis, IRefProcCpt } from "./refApi.types";
import { toMirrorLectures } from "./legacyShapes.mapper";

export interface RefSyncResult {
  dataVersion: string;
  mainDiags: number;
  diagnoses: number;
  procCpts: number;
  lectures: number;
  mainDiagDiagnoses: number;
  mainDiagProcs: number;
  sixFlagRowsEnsured: number;
}

/**
 * Reference mirror sync (KA spoke).
 *
 * Pulls the department's shared reference data from the hub's PUBLIC API (never its DB)
 * and materializes it into the local KA mirror tables — `main_diags`, `diagnoses`,
 * `proc_cpts`, the `main_diag_*` join tables and `lectures` — preserving the hub's UUIDs
 * as local PKs so submissions' FKs and all analytics SQL stay byte-identical.
 *
 * Contract (why this is a cache, not a boundary violation):
 *  - Flat tables are UPSERT-only, never deleted → RESTRICT FKs from submissions/events can
 *    never break mid-sync, and hub recodes propagate to all history on every re-sync.
 *  - Join tables (which only link reference rows) are rebuilt each sync.
 *  - Every mirrored main_diag is guaranteed a six-flag `additional_questions` row (default
 *    all-zero, inserted once, never overwritten — preserves KA-local edits/seeds).
 *  - `ref_sync_state` records the synced hub dataVersion.
 */
@injectable()
export class RefMirrorService {
  constructor(@inject(RefApiClient) private client: RefApiClient) {}

  public async sync(): Promise<RefSyncResult> {
    const deptCode = this.client.getDeptCode();

    // 1) Pull everything from the hub first (no DB writes until we have a full snapshot).
    const version = await this.client.getVersion();
    const mainDiags = await this.client.getMainDiagsByDept(deptCode);

    const diagById = new Map<string, IRefDiagnosis>();
    const procById = new Map<string, IRefProcCpt>();
    for (const d of await this.client.getDiagnosesByDept(deptCode)) diagById.set(d.id, d);
    for (const p of await this.client.getProcCptsByDept(deptCode)) procById.set(p.id, p);

    const mdDiagnosisIds: Record<string, string[]> = {};
    const mdProcCptIds: Record<string, string[]> = {};
    for (const md of mainDiags) {
      const ds = await this.client.getDiagnosesByMainDiag(md.id);
      const ps = await this.client.getProcCptsByMainDiag(md.id);
      // Union into the flat maps so join inserts can never reference a missing row.
      for (const d of ds) diagById.set(d.id, d);
      for (const p of ps) procById.set(p.id, p);
      mdDiagnosisIds[md.id] = ds.map((d) => d.id);
      mdProcCptIds[md.id] = ps.map((p) => p.id);
    }

    const lectures = toMirrorLectures(await this.client.getRefLecturesByDept(deptCode));

    // 2) Apply atomically to the KA mirror tables.
    if (!AppDataSource.isInitialized) {
      await initializeDatabase();
    }
    const qr = AppDataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      // Flat mirror tables (upsert-only).
      await this.upsert(
        qr,
        "main_diags",
        ["id", "title"],
        ["title"],
        mainDiags.map((m) => [m.id, m.title])
      );
      await this.upsert(
        qr,
        "diagnoses",
        ["id", "icdCode", "icdName", "neuroLogName"],
        ["icdCode", "icdName"],
        [...diagById.values()].map((d) => [d.id, d.icdCode, d.icdName, null])
      );
      await this.upsert(
        qr,
        "proc_cpts",
        ["id", "title", "alphaCode", "numCode", "description"],
        ["title", "alphaCode", "numCode", "description"],
        [...procById.values()].map((p) => [p.id, p.title, p.alphaCode, p.numCode, p.description])
      );
      await this.upsert(
        qr,
        "lectures",
        ["id", "lectureTitle", "mainTopic", "level", "google_uid"],
        ["lectureTitle", "mainTopic", "level"],
        lectures.map((l) => [l.id, l.lectureTitle, l.mainTopic, l.level, null])
      );

      // Join tables (reference-only) rebuilt each sync.
      const mdDiagPairs: [string, string][] = [];
      for (const [mdId, ids] of Object.entries(mdDiagnosisIds)) {
        for (const dId of ids) mdDiagPairs.push([mdId, dId]);
      }
      const mdProcPairs: [string, string][] = [];
      for (const [mdId, ids] of Object.entries(mdProcCptIds)) {
        for (const pId of ids) mdProcPairs.push([mdId, pId]);
      }
      await qr.query(`DELETE FROM "main_diag_diagnoses"`);
      await this.insertPairs(qr, "main_diag_diagnoses", "mainDiagId", "diagnosisId", mdDiagPairs);
      await qr.query(`DELETE FROM "main_diag_procs"`);
      await this.insertPairs(qr, "main_diag_procs", "mainDiagId", "procCptId", mdProcPairs);

      // Six-flag continuity: ensure every main_diag has an additional_questions row
      // (default all-zero). Never overwrite existing rows (preserves KA-local flag values).
      const mainDiagIds = mainDiags.map((m) => m.id);
      if (mainDiagIds.length > 0) {
        const values = mainDiagIds.map((_, i) => `($${i + 1})`).join(", ");
        await qr.query(
          `INSERT INTO "additional_questions" ("mainDiagDocId") VALUES ${values}
           ON CONFLICT ("mainDiagDocId") DO NOTHING`,
          mainDiagIds
        );
      }
      const cnt: any[] = await qr.query(
        `SELECT COUNT(*)::int AS c FROM "additional_questions" WHERE "mainDiagDocId" = ANY($1)`,
        [mainDiagIds]
      );
      const sixFlagRowsEnsured = cnt[0]?.c ?? 0;

      // Record synced version (single-row table id=1).
      await qr.query(
        `INSERT INTO "ref_sync_state" ("id", "dataVersion", "syncedAt") VALUES (1, $1, now())
         ON CONFLICT ("id") DO UPDATE SET "dataVersion" = EXCLUDED."dataVersion", "syncedAt" = now()`,
        [version.dataVersion]
      );

      await qr.commitTransaction();

      return {
        dataVersion: version.dataVersion,
        mainDiags: mainDiags.length,
        diagnoses: diagById.size,
        procCpts: procById.size,
        lectures: lectures.length,
        mainDiagDiagnoses: mdDiagPairs.length,
        mainDiagProcs: mdProcPairs.length,
        sixFlagRowsEnsured,
      };
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  /**
   * Batched INSERT ... ON CONFLICT (id) DO UPDATE for a flat mirror table. Appends
   * createdAt/updatedAt = now() and bumps updatedAt on conflict.
   */
  private async upsert(
    qr: QueryRunner,
    table: string,
    cols: string[],
    updateCols: string[],
    rows: any[][]
  ): Promise<void> {
    if (rows.length === 0) return;
    const colList = cols.map((c) => `"${c}"`).join(", ");
    const params: any[] = [];
    const tuples: string[] = [];
    let p = 1;
    for (const row of rows) {
      const placeholders = row.map(() => `$${p++}`);
      tuples.push(`(${placeholders.join(", ")}, now(), now())`);
      params.push(...row);
    }
    const setClause = updateCols
      .map((c) => `"${c}" = EXCLUDED."${c}"`)
      .concat(`"updatedAt" = now()`)
      .join(", ");
    await qr.query(
      `INSERT INTO "${table}" (${colList}, "createdAt", "updatedAt") VALUES ${tuples.join(", ")}
       ON CONFLICT ("id") DO UPDATE SET ${setClause}`,
      params
    );
  }

  /** Batched INSERT of (left, right) id pairs into a join table. */
  private async insertPairs(
    qr: QueryRunner,
    table: string,
    leftCol: string,
    rightCol: string,
    pairs: [string, string][]
  ): Promise<void> {
    if (pairs.length === 0) return;
    const params: any[] = [];
    const tuples: string[] = [];
    let p = 1;
    for (const [l, r] of pairs) {
      tuples.push(`($${p++}, $${p++})`);
      params.push(l, r);
    }
    await qr.query(
      `INSERT INTO "${table}" ("${leftCol}", "${rightCol}") VALUES ${tuples.join(", ")}`,
      params
    );
  }
}
