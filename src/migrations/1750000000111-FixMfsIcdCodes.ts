import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * MFS (Maxillofacial Surgery) audit — MIG-A: fixes the heavily-corrupted ICD-11 codes
 * (18 of 21 wrong, ~86% — the worst yet). The MFS seed mis-chaptered facial fractures into
 * the DA0x dental-disease chapter (belong in NA02.x injury), fabricated DA4x cyst/tumour
 * codes, mis-coded cleft, and — the long-flagged "MFS oral-cancer mismap" — used
 * pancreatic/liver/gallbladder oncology codes (2C10.0/2C10.1/2C12.0/2C13.0) for oral/lip/
 * tongue/salivary cancers.
 *
 * Classes of fix:
 *  1. RECODES (in-place UPDATE) — 13 MFS-only rows, target code free.
 *  2. MERGES — delete the MFS wrong row, link MFS to an existing shared row (PRS clefts;
 *     MFS's own DA05.0 for dentigerous).
 *  3. CROSS-DEPT MERGES — 2C10.0 (shared GS) and 2C13.0 (shared HBP) are *renamed* to their
 *     correct meaning (pancreatic adeno / gallbladder adeno — fixing GS & HBP), MFS is
 *     unlinked, and MFS is linked to the proper oral-cancer codes (SOC 2B66.0 / 2B68.Z).
 *
 * Every changed row gets embedding = NULL. All target codes verified via icd11_search
 * (see MEDICAL_CODE_AUDITS/MFS/AUDIT_MFS.md).
 */
export class FixMfsIcdCodes1750000000111 implements MigrationInterface {
  name = "FixMfsIcdCodes1750000000111";

  private async recode(r: QueryRunner, oldCode: string, newCode: string, name: string, arName: string): Promise<void> {
    await r.query(
      `UPDATE "diagnoses" SET "icdCode" = $2, "icdName" = $3, "icdArName" = $4, "embedding" = NULL WHERE "icdCode" = $1`,
      [oldCode, newCode, name, arName]);
  }
  /** Rename a row in place (keep code) and null embedding — for fixing a shared row's label. */
  private async rename(r: QueryRunner, code: string, name: string, arName: string): Promise<void> {
    await r.query(
      `UPDATE "diagnoses" SET "icdName" = $2, "icdArName" = $3, "embedding" = NULL WHERE "icdCode" = $1`,
      [code, name, arName]);
  }
  private async deleteRow(r: QueryRunner, code: string): Promise<void> {
    await r.query(`DELETE FROM "main_diag_diagnoses" WHERE "diagnosisId" = (SELECT id FROM "diagnoses" WHERE "icdCode" = $1)`, [code]);
    await r.query(`DELETE FROM "department_diagnoses" WHERE "diagnosisId" = (SELECT id FROM "diagnoses" WHERE "icdCode" = $1)`, [code]);
    await r.query(`DELETE FROM "diagnoses" WHERE "icdCode" = $1`, [code]);
  }
  /** Unlink a dept (and its main_diag links) from a shared row, without deleting the row. */
  private async unlinkDept(r: QueryRunner, dept: string, code: string): Promise<void> {
    await r.query(`
      DELETE FROM "main_diag_diagnoses"
      WHERE "diagnosisId" = (SELECT id FROM "diagnoses" WHERE "icdCode" = $2)
        AND "mainDiagId" IN (SELECT md.id FROM "main_diags" md JOIN "departments" d ON md."departmentId" = d.id WHERE d.code = $1)`, [dept, code]);
    await r.query(`
      DELETE FROM "department_diagnoses"
      WHERE "diagnosisId" = (SELECT id FROM "diagnoses" WHERE "icdCode" = $2)
        AND "departmentId" = (SELECT id FROM "departments" WHERE code = $1)`, [dept, code]);
  }
  private async link(r: QueryRunner, dept: string, code: string, mainDiag: string): Promise<void> {
    await r.query(
      `INSERT INTO "department_diagnoses" ("departmentId","diagnosisId")
       SELECT dept.id, d.id FROM "departments" dept CROSS JOIN "diagnoses" d
       WHERE dept.code = $1 AND d."icdCode" = $2 ON CONFLICT DO NOTHING`, [dept, code]);
    await r.query(
      `INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
       SELECT md.id, d.id FROM "main_diags" md JOIN "departments" dept ON md."departmentId" = dept.id
       CROSS JOIN "diagnoses" d
       WHERE dept.code = $1 AND md.title = $3 AND d."icdCode" = $2 ON CONFLICT DO NOTHING`, [dept, code, mainDiag]);
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── 1. RECODES (MFS-only rows, target free) ─────────────────────────────────────
    await this.recode(queryRunner, "DA4A.0", "2E83.1", "ameloblastoma", "ورم مينائي");
    await this.recode(queryRunner, "DA4C.0", "DA09.8", "periapical (radicular) cyst", "كيسة جذرية (حول قمة الجذر)");
    await this.recode(queryRunner, "DA0G.0", "NA02.3", "nasal fracture", "كسر عظام الأنف");
    await this.recode(queryRunner, "DA0F.1", "NA02.5", "zygomatic fracture", "كسر العظم الوجني");
    await this.recode(queryRunner, "DA0F.2", "NA02.21", "orbital floor fracture", "كسر قاع الحجاج");
    await this.recode(queryRunner, "LA2A.0", "DA0E.0Y&XA51B7", "condylar hyperplasia of mandible", "فرط تنسج لقمة الفك السفلي");
    await this.recode(queryRunner, "DA12.0", "DA01.30", "Ludwig angina", "ذبحة لودفيغ");
    await this.recode(queryRunner, "DA0E.0", "NA02.4Z", "fracture of maxilla", "كسر الفك العلوي");
    await this.recode(queryRunner, "DA0F.0", "NA02.7Z", "mandibular fracture", "كسر الفك السفلي");
    await this.recode(queryRunner, "DA50.0", "2E91.0", "pleomorphic adenoma of parotid", "ورم غدي متعدد الأشكال للغدة النكفية");
    await this.recode(queryRunner, "DA0K.0", "DA0E.8", "temporomandibular joint disorder", "اضطراب المفصل الصدغي الفكي");
    await this.recode(queryRunner, "2C10.1", "2B60.Z", "carcinoma of lip", "سرطانة الشفة");
    await this.recode(queryRunner, "2C12.0", "2B62.Z", "carcinoma of tongue", "سرطانة اللسان");

    // ── 2. MERGES into existing shared rows ─────────────────────────────────────────
    await this.deleteRow(queryRunner, "DA03.0");                       // cleft lip → PRS LA40.Z
    await this.link(queryRunner, "MFS", "LA40.Z", "cleft lip & palate");
    await this.deleteRow(queryRunner, "DA03.1");                       // cleft palate → PRS LA42.Z
    await this.link(queryRunner, "MFS", "LA42.Z", "cleft lip & palate");
    await this.deleteRow(queryRunner, "DA4B.0");                       // dentigerous cyst → MFS's own DA05.0 (no distinct leaf)
    await this.link(queryRunner, "MFS", "DA05.0", "dentoalveolar surgery");
    await this.link(queryRunner, "MFS", "DA05.0", "jaw cysts & pathology");

    // ── 3. CROSS-DEPT MERGES (fix the MFS oral-cancer mismap; correct the shared rows) ─
    // 2C10.0 was "SCC of oral cavity" but 2C10.0 = Adenocarcinoma of pancreas (shared GS).
    await this.rename(queryRunner, "2C10.0", "adenocarcinoma of pancreas", "السرطانة الغدية للبنكرياس");
    await this.unlinkDept(queryRunner, "MFS", "2C10.0");
    await this.link(queryRunner, "MFS", "2B66.0", "oral cancer");
    // 2C13.0 was "carcinoma of salivary gland" but 2C13.0 = Adenocarcinoma of gallbladder (shared HBP).
    await this.rename(queryRunner, "2C13.0", "adenocarcinoma of the gallbladder", "السرطانة الغدية للمرارة");
    await this.unlinkDept(queryRunner, "MFS", "2C13.0");
    await this.link(queryRunner, "MFS", "2B68.Z", "salivary gland pathology");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const recreate = async (code: string, name: string, arName: string, links: Array<[string, string | null]>) => {
      await queryRunner.query(
        `INSERT INTO "diagnoses" ("icdCode","icdName","icdArName","description","arDescription")
         VALUES ($1,$2,$3,$2,$3) ON CONFLICT ("icdCode") DO NOTHING`, [code, name, arName]);
      for (const [dept, mainDiag] of links) {
        await queryRunner.query(
          `INSERT INTO "department_diagnoses" ("departmentId","diagnosisId")
           SELECT dept.id, d.id FROM "departments" dept CROSS JOIN "diagnoses" d
           WHERE dept.code = $1 AND d."icdCode" = $2 ON CONFLICT DO NOTHING`, [dept, code]);
        if (mainDiag) await queryRunner.query(
          `INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
           SELECT md.id, d.id FROM "main_diags" md JOIN "departments" dept ON md."departmentId" = dept.id
           CROSS JOIN "diagnoses" d WHERE dept.code = $1 AND md.title = $3 AND d."icdCode" = $2 ON CONFLICT DO NOTHING`, [dept, code, mainDiag]);
      }
    };
    const unlink = async (dept: string, code: string, mainDiag: string | null) => {
      if (mainDiag) await queryRunner.query(`
        DELETE FROM "main_diag_diagnoses" WHERE "diagnosisId" = (SELECT id FROM "diagnoses" WHERE "icdCode" = $2)
          AND "mainDiagId" = (SELECT md.id FROM "main_diags" md JOIN "departments" dept ON md."departmentId" = dept.id WHERE dept.code = $1 AND md.title = $3)`, [dept, code, mainDiag]);
      await queryRunner.query(`
        DELETE FROM "department_diagnoses" WHERE "departmentId" = (SELECT id FROM "departments" WHERE code = $1)
          AND "diagnosisId" = (SELECT id FROM "diagnoses" WHERE "icdCode" = $2)`, [dept, code]);
    };

    // 3. reverse cross-dept merges
    await unlink("MFS", "2B68.Z", "salivary gland pathology");
    await this.rename(queryRunner, "2C13.0", "carcinoma of salivary gland", "سرطانة الغدة اللعابية");
    await this.link(queryRunner, "MFS", "2C13.0", "salivary gland pathology");
    await unlink("MFS", "2B66.0", "oral cancer");
    await this.rename(queryRunner, "2C10.0", "squamous cell carcinoma of oral cavity", "سرطانة الخلايا الحرشفية للتجويف الفموي");
    await this.link(queryRunner, "MFS", "2C10.0", "oral cancer");
    // 2. reverse merges
    await unlink("MFS", "DA05.0", "jaw cysts & pathology");
    await unlink("MFS", "DA05.0", "dentoalveolar surgery");
    await recreate("DA4B.0", "dentigerous cyst", "كيسة مسننة", [["MFS", "dentoalveolar surgery"], ["MFS", "jaw cysts & pathology"]]);
    await unlink("MFS", "LA42.Z", "cleft lip & palate");
    await recreate("DA03.1", "cleft palate", "شق الحنك", [["MFS", "cleft lip & palate"]]);
    await unlink("MFS", "LA40.Z", "cleft lip & palate");
    await recreate("DA03.0", "cleft lip", "شق الشفة", [["MFS", "cleft lip & palate"]]);
    // 1. reverse recodes
    await this.recode(queryRunner, "2B62.Z", "2C12.0", "carcinoma of tongue", "سرطانة اللسان");
    await this.recode(queryRunner, "2B60.Z", "2C10.1", "carcinoma of lip", "سرطانة الشفة");
    await this.recode(queryRunner, "DA0E.8", "DA0K.0", "temporomandibular joint disorder", "اضطراب المفصل الصدغي الفكي");
    await this.recode(queryRunner, "2E91.0", "DA50.0", "pleomorphic adenoma of parotid", "ورم غدي متعدد الأشكال للغدة النكفية");
    await this.recode(queryRunner, "NA02.7Z", "DA0F.0", "mandibular fracture", "كسر الفك السفلي");
    await this.recode(queryRunner, "NA02.4Z", "DA0E.0", "Le Fort fracture of maxilla", "كسر لوفور للفك العلوي");
    await this.recode(queryRunner, "DA01.30", "DA12.0", "Ludwig angina", "ذبحة لودفيغ");
    await this.recode(queryRunner, "DA0E.0Y&XA51B7", "LA2A.0", "condylar hyperplasia of mandible", "فرط تنسج لقمة الفك السفلي");
    await this.recode(queryRunner, "NA02.21", "DA0F.2", "orbital floor fracture", "كسر قاع الحجاج");
    await this.recode(queryRunner, "NA02.5", "DA0F.1", "zygomatic fracture", "كسر العظم الوجني");
    await this.recode(queryRunner, "NA02.3", "DA0G.0", "nasal fracture", "كسر عظام الأنف");
    await this.recode(queryRunner, "DA09.8", "DA4C.0", "periapical cyst", "كيسة حول قمة الجذر");
    await this.recode(queryRunner, "2E83.1", "DA4A.0", "ameloblastoma", "ورم مينائي");
  }
}
