import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * SOC (Surgical Oncology) audit — MIG-A: fixes the heavily-corrupted ICD-11 codes
 * (13 of 26 wrong + 3 approximate, ~62%). The SOC seed mapped concepts onto the wrong
 * chapter blocks: 2B60=lip, 2B91=rectosigmoid, 2B5C≠stomach, 2C90=kidney, 2C73=ovary,
 * 2C77=cervix(!), 2C80/2C8x=male genital, 2C6Y=breast, 2D42=ill-defined sites.
 *
 * Three classes of fix (ordering matters — unique icdCode constraint):
 *  1. FREE RECODES (in-place UPDATE) — target code unused; junctions preserved automatically.
 *     2C90.0 (urothelial bladder) is shared SOC+UROL → the recode to 2C94.2 fixes UROL too.
 *  2. MERGES — delete the SOC wrong row and link SOC to an existing shared row owned by
 *     another dept (GS stomach/oesophagus, PRS skin cancers, HBP peritoneal metastasis).
 *  3. (orphan link + adrenocortical recategorisation handled in MIG-C / 105.)
 *
 * Recodes free up three codes whose CORRECT meaning is reused as new diagnoses in MIG-D:
 *   2C90.0→RCC, 2C77.0(merged away)→cervix SCC, 2C73.1→dysgerminoma of ovary.
 * Every changed row gets embedding = NULL so the backfill re-embeds it.
 * All target codes verified via icd11_search (see MEDICAL_CODE_AUDITS/SOC/AUDIT_SOC.md).
 */
export class FixSocIcdCodes1750000000104 implements MigrationInterface {
  name = "FixSocIcdCodes1750000000104";

  /** Recode a row in place (code + names) and null its embedding. */
  private async recode(r: QueryRunner, oldCode: string, newCode: string, name: string, arName: string): Promise<void> {
    await r.query(
      `UPDATE "diagnoses" SET "icdCode" = $2, "icdName" = $3, "icdArName" = $4, "embedding" = NULL WHERE "icdCode" = $1`,
      [oldCode, newCode, name, arName]);
  }

  /** Delete a SOC-specific (corrupted) diagnosis row and all its junctions. */
  private async deleteRow(r: QueryRunner, code: string): Promise<void> {
    await r.query(`DELETE FROM "main_diag_diagnoses" WHERE "diagnosisId" = (SELECT id FROM "diagnoses" WHERE "icdCode" = $1)`, [code]);
    await r.query(`DELETE FROM "department_diagnoses" WHERE "diagnosisId" = (SELECT id FROM "diagnoses" WHERE "icdCode" = $1)`, [code]);
    await r.query(`DELETE FROM "diagnoses" WHERE "icdCode" = $1`, [code]);
  }

  /** Link a dept + a main_diag to an existing (shared) diagnosis row. */
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
    // ── 1. FREE RECODES (in-place UPDATE; preserve junctions) ───────────────────────
    await this.recode(queryRunner, "2B91.1", "2B90.Z", "carcinoma of colon", "سرطانة القولون");
    await this.recode(queryRunner, "2B91.2", "2B92.Z", "carcinoma of rectum", "سرطانة المستقيم");
    await this.recode(queryRunner, "2C20.2", "2C00.Z", "carcinoma of anal canal", "سرطانة القناة الشرجية");
    await this.recode(queryRunner, "2F73.0", "2B80.21", "neuroendocrine (carcinoid) tumour of small intestine", "ورم عصبي صماوي (سرطاوي) في الأمعاء الدقيقة");
    await this.recode(queryRunner, "2C73.1", "2D11.Z", "adrenocortical carcinoma", "سرطانة قشرة الغدة الكظرية");
    await this.recode(queryRunner, "2C90.0", "2C94.2", "urothelial carcinoma of bladder", "سرطانة المثانة البولية الظهارية"); // shared SOC+UROL — fixes UROL too
    await this.recode(queryRunner, "2C6Y.0", "2B5F.1Z", "retroperitoneal sarcoma", "ساركوما خلف الصفاق");
    await this.recode(queryRunner, "2C80.0", "2B5F.2", "soft tissue sarcoma", "ساركوما الأنسجة الرخوة");
    await this.recode(queryRunner, "2C80.1", "2F9C", "desmoid tumour (aggressive fibromatosis)", "ورم رباطي (ورام ليفي عدواني)");
    await this.recode(queryRunner, "2B30.1", "2B30.1Z", "classical Hodgkin lymphoma", "لمفوما هودجكين الكلاسيكية");

    // ── 2. MERGES into existing shared rows owned by other depts ────────────────────
    await this.deleteRow(queryRunner, "2B5C.0");                       // carcinoma of stomach → GS 2B72.Z
    await this.link(queryRunner, "SOC", "2B72.Z", "gastric cancer");
    await this.deleteRow(queryRunner, "2B60.0");                       // carcinoma of oesophagus → GS 2B70.Z
    await this.link(queryRunner, "SOC", "2B70.Z", "gastric cancer");
    await this.deleteRow(queryRunner, "2C77.0");                       // malignant melanoma of skin → PRS 2C30.Z (frees 2C77.0 for cervix SCC in MIG-D)
    await this.link(queryRunner, "SOC", "2C30.Z", "melanoma");
    await this.deleteRow(queryRunner, "2C90.3");                       // peritoneal carcinomatosis → HBP 2D91
    await this.link(queryRunner, "SOC", "2D91", "metastatic disease");
    await this.deleteRow(queryRunner, "2C32");                         // basal cell carcinoma → PRS 2C32.Z
    await this.link(queryRunner, "SOC", "2C32.Z", "non-melanoma skin cancer");
    await this.deleteRow(queryRunner, "2D42.0");                       // squamous cell carcinoma of skin → PRS 2C31.Z
    await this.link(queryRunner, "SOC", "2C31.Z", "non-melanoma skin cancer");
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
        if (mainDiag) {
          await queryRunner.query(
            `INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
             SELECT md.id, d.id FROM "main_diags" md JOIN "departments" dept ON md."departmentId" = dept.id
             CROSS JOIN "diagnoses" d
             WHERE dept.code = $1 AND md.title = $3 AND d."icdCode" = $2 ON CONFLICT DO NOTHING`, [dept, code, mainDiag]);
        }
      }
    };
    const unlink = async (dept: string, code: string, mainDiag: string) => {
      await queryRunner.query(`
        DELETE FROM "main_diag_diagnoses"
        WHERE "diagnosisId" = (SELECT id FROM "diagnoses" WHERE "icdCode" = $2)
          AND "mainDiagId" = (SELECT md.id FROM "main_diags" md JOIN "departments" dept ON md."departmentId" = dept.id
                              WHERE dept.code = $1 AND md.title = $3)`, [dept, code, mainDiag]);
      await queryRunner.query(`
        DELETE FROM "department_diagnoses"
        WHERE "departmentId" = (SELECT id FROM "departments" WHERE code = $1)
          AND "diagnosisId" = (SELECT id FROM "diagnoses" WHERE "icdCode" = $2)`, [dept, code]);
    };

    // 2. reverse merges
    await unlink("SOC", "2C31.Z", "non-melanoma skin cancer");
    await recreate("2D42.0", "squamous cell carcinoma of skin", "سرطانة الخلايا الحرشفية للجلد", [["SOC", "non-melanoma skin cancer"]]);
    await unlink("SOC", "2C32.Z", "non-melanoma skin cancer");
    await recreate("2C32", "basal cell carcinoma of skin", "سرطان الخلايا القاعدية للجلد", [["SOC", "non-melanoma skin cancer"]]);
    await unlink("SOC", "2D91", "metastatic disease");
    await recreate("2C90.3", "peritoneal carcinomatosis", "سرطانة الصفاق", [["SOC", "metastatic disease"]]);
    await unlink("SOC", "2C30.Z", "melanoma");
    await recreate("2C77.0", "malignant melanoma of skin", "الورم الميلانيني الخبيث للجلد", [["SOC", "melanoma"]]);
    await unlink("SOC", "2B70.Z", "gastric cancer");
    await recreate("2B60.0", "carcinoma of oesophagus", "سرطانة المريء", [["SOC", "gastric cancer"]]);
    await unlink("SOC", "2B72.Z", "gastric cancer");
    await recreate("2B5C.0", "carcinoma of stomach", "سرطانة المعدة", [["SOC", "gastric cancer"]]);

    // 1. reverse free recodes
    await this.recode(queryRunner, "2B30.1Z", "2B30.1", "classical Hodgkin lymphoma", "ليمفوما هودجكين الكلاسيكية");
    await this.recode(queryRunner, "2F9C", "2C80.1", "desmoid tumour", "ورم وترمي");
    await this.recode(queryRunner, "2B5F.2", "2C80.0", "soft tissue sarcoma", "ساركوما الأنسجة الرخوة");
    await this.recode(queryRunner, "2B5F.1Z", "2C6Y.0", "retroperitoneal sarcoma", "ساركوما خلف الصفاق");
    await this.recode(queryRunner, "2C94.2", "2C90.0", "urothelial carcinoma of bladder", "سرطان المثانة البولية الظهاري");
    await this.recode(queryRunner, "2D11.Z", "2C73.1", "adrenocortical carcinoma", "سرطانة قشرة الغدة الكظرية");
    await this.recode(queryRunner, "2B80.21", "2F73.0", "carcinoid tumour of small intestine", "ورم سرطاني مشابه في الأمعاء الدقيقة");
    await this.recode(queryRunner, "2C00.Z", "2C20.2", "carcinoma of anal canal", "سرطانة القناة الشرجية");
    await this.recode(queryRunner, "2B92.Z", "2B91.2", "carcinoma of rectum", "سرطانة المستقيم");
    await this.recode(queryRunner, "2B90.Z", "2B91.1", "carcinoma of colon", "سرطانة القولون");
  }
}
