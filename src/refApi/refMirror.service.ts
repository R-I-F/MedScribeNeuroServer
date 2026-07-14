import "reflect-metadata";
import { inject, injectable } from "inversify";
import { QueryRunner } from "typeorm";
import { AppDataSource, initializeDatabase } from "../config/database.config";
import { RefApiClient } from "./refApi.client";
import {
  toMirrorDepartment,
  toMirrorMainDiag,
  toMirrorDiagnosis,
  toMirrorProcCpt,
  toMirrorLectureTree,
  toMirrorEquipment,
  toMirrorConsumable,
  MirrorDiagnosisRow,
  MirrorProcCptRow,
  MirrorMainDiagRow,
  MirrorLectureTopicRow,
  MirrorLectureRow,
  MirrorEquipmentRow,
  MirrorConsumableRow,
} from "./legacyShapes.mapper";

/** Keep the last row seen per id (hub is source of truth; dupes shouldn't occur but are made safe). */
function dedupeById<T extends { id: string }>(rows: T[]): T[] {
  const byId = new Map<string, T>();
  for (const r of rows) byId.set(r.id, r);
  return [...byId.values()];
}

/** Dedupe (left,right) id pairs so composite-PK join inserts can't collide. */
function dedupePairs(pairs: [string, string][]): [string, string][] {
  const seen = new Set<string>();
  const out: [string, string][] = [];
  for (const [a, b] of pairs) {
    const key = `${a}|${b}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push([a, b]);
    }
  }
  return out;
}

/** Dedupe arbitrary-width tuples by a caller-supplied composite key. */
function dedupeTuples<T>(rows: T[], keyOf: (row: T) => string): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const r of rows) {
    const k = keyOf(r);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(r);
    }
  }
  return out;
}

export interface RefSyncResult {
  dataVersion: string;
  departments: number;
  mainDiags: number;
  diagnoses: number;
  procCpts: number;
  lectureTopics: number;
  lectures: number;
  equipment: number;
  consumables: number;
  departmentDiagnoses: number;
  departmentEquipment: number;
  departmentConsumables: number;
  mainDiagDiagnoses: number;
  mainDiagProcs: number;
  refQuestions: number;
  refQuestionOptions: number;
  mainDiagQuestions: number;
  mainDiagQuestionOptions: number;
}

/**
 * Reference mirror sync (KA spoke) — full institute, ALL departments.
 *
 * Pulls the whole shared reference catalog from the hub's PUBLIC API (never its DB) and
 * materializes it into the local KA mirror, preserving the hub's UUIDs as local PKs and the
 * hub's department wiring:
 *   - departments            (mirror of hub departments)
 *   - main_diags.departmentId (direct FK)
 *   - department_diagnoses    (M2M dept↔diagnosis; diagnoses shared/deduped)
 *   - lecture_topics.departmentId + lectures.topicId
 *   - proc_cpts               (shared; department relation is transitive via main_diag_procs)
 *
 * Flat tables are UPSERT-only (RESTRICT FKs from submissions can never break); the join /
 * link tables (department_diagnoses, main_diag_diagnoses, main_diag_procs) are rebuilt each
 * sync. Every main_diag is guaranteed an all-zero `additional_questions` row (never
 * overwritten). `ref_sync_state` records the synced hub dataVersion.
 */
@injectable()
export class RefMirrorService {
  constructor(@inject(RefApiClient) private client: RefApiClient) {}

  public async sync(): Promise<RefSyncResult> {
    // 1) Pull a full hub snapshot (no DB writes until it's all in hand).
    const version = await this.client.getVersion();
    const departments = await this.client.getDepartments();

    const deptRows = departments.map(toMirrorDepartment);
    const mainDiagRows: MirrorMainDiagRow[] = [];
    const diagById = new Map<string, MirrorDiagnosisRow>(); // shared, deduped across depts
    const procById = new Map<string, MirrorProcCptRow>(); // shared, deduped across depts
    const equipById = new Map<string, MirrorEquipmentRow>(); // shared, deduped across depts
    const consumById = new Map<string, MirrorConsumableRow>(); // shared, deduped across depts
    const topicRows: MirrorLectureTopicRow[] = [];
    const lectureRows: MirrorLectureRow[] = [];
    const refQuestionById = new Map<string, { id: string; departmentId: string; key: string; label: string; arLabel: string | null; inputType: string; isRequired: boolean; sortOrder: number }>();
    const refOptionById = new Map<string, { id: string; questionId: string; value: string; arValue: string | null; sortOrder: number }>();
    const deptDiagnosisPairSet = new Set<string>(); // "deptId|dxId"
    const deptDiagnosisPairs: [string, string][] = [];
    const deptEquipmentPairs: [string, string][] = [];
    const deptConsumablePairs: [string, string][] = [];
    const mdDiagnosisPairs: [string, string][] = [];
    const mdProcPairs: [string, string][] = [];
    const mdQuestionRows: [string, string, boolean, number][] = []; // (mainDiagId, questionId, isRequired, sortOrder)
    const mdQuestionOptionRows: [string, string, string][] = [];    // (mainDiagId, questionId, optionId)
    for (const dept of departments) {
      const mds = await this.client.getMainDiagsByDept(dept.code);
      for (const md of mds) {
        mainDiagRows.push(toMirrorMainDiag(md, dept.id));
      }

      for (const dx of await this.client.getDiagnosesByDept(dept.code)) {
        diagById.set(dx.id, toMirrorDiagnosis(dx));
        const key = `${dept.id}|${dx.id}`;
        if (!deptDiagnosisPairSet.has(key)) {
          deptDiagnosisPairSet.add(key);
          deptDiagnosisPairs.push([dept.id, dx.id]);
        }
      }
      for (const pc of await this.client.getProcCptsByDept(dept.code)) {
        procById.set(pc.id, toMirrorProcCpt(pc));
      }

      for (const eq of await this.client.getEquipmentByDept(dept.code)) {
        equipById.set(eq.id, toMirrorEquipment(eq));
        deptEquipmentPairs.push([dept.id, eq.id]);
      }
      for (const co of await this.client.getConsumablesByDept(dept.code)) {
        consumById.set(co.id, toMirrorConsumable(co));
        deptConsumablePairs.push([dept.id, co.id]);
      }

      // Dynamic additional-questions framework: definitions + full option lists per department.
      for (const q of await this.client.getQuestionsByDept(dept.code)) {
        refQuestionById.set(q.id, {
          id: q.id, departmentId: dept.id, key: q.key, label: q.label,
          arLabel: q.arLabel ?? null, inputType: q.inputType,
          isRequired: q.isRequired, sortOrder: q.sortOrder,
        });
        for (const o of q.options) {
          refOptionById.set(o.id, { id: o.id, questionId: q.id, value: o.value, arValue: o.arValue ?? null, sortOrder: o.sortOrder });
        }
      }

      const tree = toMirrorLectureTree(await this.client.getRefLecturesByDept(dept.code), dept.id);
      topicRows.push(...tree.topics);
      lectureRows.push(...tree.lectures);

      for (const md of mds) {
        const ds = await this.client.getDiagnosesByMainDiag(md.id);
        const ps = await this.client.getProcCptsByMainDiag(md.id);
        for (const dx of ds) {
          diagById.set(dx.id, toMirrorDiagnosis(dx));
          mdDiagnosisPairs.push([md.id, dx.id]);
        }
        for (const pc of ps) {
          procById.set(pc.id, toMirrorProcCpt(pc));
          mdProcPairs.push([md.id, pc.id]);
        }
        // Effective questions attached to this main_diag (+ its narrowed option set).
        for (const q of await this.client.getQuestionsByMainDiag(md.id)) {
          mdQuestionRows.push([md.id, q.id, q.isRequired, q.sortOrder]);
          for (const o of q.options) mdQuestionOptionRows.push([md.id, q.id, o.id]);
        }
      }
    }

    // 2) Apply atomically. Order respects FKs: parents before children.
    if (!AppDataSource.isInitialized) {
      await initializeDatabase();
    }
    const qr = AppDataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      // Departments first (FK target for main_diags/lecture_topics/department_diagnoses/users).
      await this.upsert(
        qr,
        "departments",
        ["id", "code", "name", "arName", "isAcademic", "isPractical"],
        ["code", "name", "arName", "isAcademic", "isPractical"],
        deptRows.map((d) => [d.id, d.code, d.name, d.arName, d.isAcademic, d.isPractical])
      );

      // Dedupe by PK so a single ON CONFLICT batch can never touch a row twice.
      const mainDiagRowsU = dedupeById(mainDiagRows);
      const topicRowsU = dedupeById(topicRows);
      const lectureRowsU = dedupeById(lectureRows);
      const mdDiagnosisPairsU = dedupePairs(mdDiagnosisPairs);
      const mdProcPairsU = dedupePairs(mdProcPairs);

      // Shared flat tables.
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
        "equipment",
        ["id", "equipment", "arName"],
        ["equipment", "arName"],
        [...equipById.values()].map((e) => [e.id, e.equipment, e.arName])
      );
      await this.upsert(
        qr,
        "consumables",
        ["id", "consumables", "arName"],
        ["consumables", "arName"],
        [...consumById.values()].map((c) => [c.id, c.consumables, c.arName])
      );
      // Question definitions (FK → departments, done above) then their options.
      await this.upsert(
        qr,
        "ref_questions",
        ["id", "departmentId", "key", "label", "arLabel", "inputType", "isRequired", "sortOrder"],
        ["departmentId", "key", "label", "arLabel", "inputType", "isRequired", "sortOrder"],
        [...refQuestionById.values()].map((q) => [q.id, q.departmentId, q.key, q.label, q.arLabel, q.inputType, q.isRequired, q.sortOrder])
      );
      await this.upsert(
        qr,
        "ref_question_options",
        ["id", "questionId", "value", "arValue", "sortOrder"],
        ["questionId", "value", "arValue", "sortOrder"],
        [...refOptionById.values()].map((o) => [o.id, o.questionId, o.value, o.arValue, o.sortOrder])
      );

      // Department-scoped tables.
      await this.upsert(
        qr,
        "main_diags",
        ["id", "title", "departmentId"],
        ["title", "departmentId"],
        mainDiagRowsU.map((m) => [m.id, m.title, m.departmentId])
      );
      await this.upsert(
        qr,
        "lecture_topics",
        ["id", "title", "arTitle", "sortOrder", "departmentId"],
        ["title", "arTitle", "sortOrder", "departmentId"],
        topicRowsU.map((t) => [t.id, t.title, t.arTitle, t.sortOrder, t.departmentId])
      );
      await this.upsert(
        qr,
        "lectures",
        ["id", "title", "arTitle", "lectureNumber", "sortOrder", "level", "topicId"],
        ["title", "arTitle", "lectureNumber", "sortOrder", "level", "topicId"],
        lectureRowsU.map((l) => [
          l.id, l.title, l.arTitle, l.lectureNumber, l.sortOrder, l.level, l.topicId,
        ])
      );

      // Link/join tables rebuilt each sync.
      await qr.query(`DELETE FROM "department_diagnoses"`);
      await this.insertPairs(qr, "department_diagnoses", "departmentId", "diagnosisId", deptDiagnosisPairs);
      await qr.query(`DELETE FROM "main_diag_diagnoses"`);
      await this.insertPairs(qr, "main_diag_diagnoses", "mainDiagId", "diagnosisId", mdDiagnosisPairsU);
      await qr.query(`DELETE FROM "main_diag_procs"`);
      await this.insertPairs(qr, "main_diag_procs", "mainDiagId", "procCptId", mdProcPairsU);
      const deptEquipmentPairsU = dedupePairs(deptEquipmentPairs);
      const deptConsumablePairsU = dedupePairs(deptConsumablePairs);
      await qr.query(`DELETE FROM "department_equipment"`);
      await this.insertPairs(qr, "department_equipment", "departmentId", "equipmentId", deptEquipmentPairsU);
      await qr.query(`DELETE FROM "department_consumables"`);
      await this.insertPairs(qr, "department_consumables", "departmentId", "consumableId", deptConsumablePairsU);

      // Per-main_diag question wiring (rebuilt each sync). Dedupe defensively.
      const mdQuestionRowsU = dedupeTuples(mdQuestionRows, (r) => `${r[0]}|${r[1]}`);
      const mdQuestionOptionRowsU = dedupeTuples(mdQuestionOptionRows, (r) => `${r[0]}|${r[1]}|${r[2]}`);
      await qr.query(`DELETE FROM "main_diag_question_options"`);
      await qr.query(`DELETE FROM "main_diag_questions"`);
      await this.insertTuples(qr, "main_diag_questions", ["mainDiagId", "questionId", "isRequired", "sortOrder"], mdQuestionRowsU);
      await this.insertTuples(qr, "main_diag_question_options", ["mainDiagId", "questionId", "optionId"], mdQuestionOptionRowsU);

      await qr.query(
        `INSERT INTO "ref_sync_state" ("id", "dataVersion", "syncedAt") VALUES (1, $1, now())
         ON CONFLICT ("id") DO UPDATE SET "dataVersion" = EXCLUDED."dataVersion", "syncedAt" = now()`,
        [version.dataVersion]
      );

      await qr.commitTransaction();

      return {
        dataVersion: version.dataVersion,
        departments: deptRows.length,
        mainDiags: mainDiagRowsU.length,
        diagnoses: diagById.size,
        procCpts: procById.size,
        lectureTopics: topicRowsU.length,
        lectures: lectureRowsU.length,
        equipment: equipById.size,
        consumables: consumById.size,
        departmentDiagnoses: deptDiagnosisPairs.length,
        departmentEquipment: deptEquipmentPairsU.length,
        departmentConsumables: deptConsumablePairsU.length,
        mainDiagDiagnoses: mdDiagnosisPairsU.length,
        mainDiagProcs: mdProcPairsU.length,
        refQuestions: refQuestionById.size,
        refQuestionOptions: refOptionById.size,
        mainDiagQuestions: mdQuestionRowsU.length,
        mainDiagQuestionOptions: mdQuestionOptionRowsU.length,
      };
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  /**
   * Chunked INSERT ... ON CONFLICT (id) DO UPDATE for a flat mirror table (appends now()
   * timestamps). Chunked so a big batch stays well under Postgres' 65535 bind-param limit.
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
    const setClause = updateCols
      .map((c) => `"${c}" = EXCLUDED."${c}"`)
      .concat(`"updatedAt" = now()`)
      .join(", ");
    // +2 for the appended createdAt/updatedAt placeholders are actually literals (now()),
    // so only `cols.length` params per row; keep a safe margin anyway.
    const maxRows = Math.max(1, Math.floor(50000 / cols.length));
    for (let start = 0; start < rows.length; start += maxRows) {
      const slice = rows.slice(start, start + maxRows);
      const params: any[] = [];
      const tuples: string[] = [];
      let p = 1;
      for (const row of slice) {
        const placeholders = row.map(() => `$${p++}`);
        tuples.push(`(${placeholders.join(", ")}, now(), now())`);
        params.push(...row);
      }
      await qr.query(
        `INSERT INTO "${table}" (${colList}, "createdAt", "updatedAt") VALUES ${tuples.join(", ")}
         ON CONFLICT ("id") DO UPDATE SET ${setClause}`,
        params
      );
    }
  }

  /** Batched INSERT of (left, right) id pairs into a join table (chunked to stay under param limits). */
  private async insertPairs(
    qr: QueryRunner,
    table: string,
    leftCol: string,
    rightCol: string,
    pairs: [string, string][]
  ): Promise<void> {
    if (pairs.length === 0) return;
    const CHUNK = 5000;
    for (let start = 0; start < pairs.length; start += CHUNK) {
      const slice = pairs.slice(start, start + CHUNK);
      const params: any[] = [];
      const tuples: string[] = [];
      let p = 1;
      for (const [l, r] of slice) {
        tuples.push(`($${p++}, $${p++})`);
        params.push(l, r);
      }
      await qr.query(
        `INSERT INTO "${table}" ("${leftCol}", "${rightCol}") VALUES ${tuples.join(", ")}`,
        params
      );
    }
  }

  /** Batched plain INSERT of arbitrary-width rows into a table (chunked under the param limit). */
  private async insertTuples(
    qr: QueryRunner,
    table: string,
    cols: string[],
    rows: any[][]
  ): Promise<void> {
    if (rows.length === 0) return;
    const colList = cols.map((c) => `"${c}"`).join(", ");
    const maxRows = Math.max(1, Math.floor(50000 / cols.length));
    for (let start = 0; start < rows.length; start += maxRows) {
      const slice = rows.slice(start, start + maxRows);
      const params: any[] = [];
      const tuples: string[] = [];
      let p = 1;
      for (const row of slice) {
        tuples.push(`(${row.map(() => `$${p++}`).join(", ")})`);
        params.push(...row);
      }
      await qr.query(`INSERT INTO "${table}" (${colList}) VALUES ${tuples.join(", ")}`, params);
    }
  }
}
