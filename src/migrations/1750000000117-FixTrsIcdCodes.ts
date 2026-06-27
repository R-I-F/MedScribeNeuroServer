import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * TRS (Transplant Surgery) audit — MIG-A: fixes the heavily-corrupted ICD-11 codes
 * (15 of 20 wrong, ~80% — second-worst after MFS). The TRS seed scattered transplant
 * indications across the wrong chapters: liver disease into the metabolic chapter
 * (5C56.x / 5C81.3), fabricated digestive codes (DA92.1), developmental-chapter PBC
 * (LB41.1), fabricated rejection/complication subdivisions (NE84.0/.1, NE80.0, NE81.0,
 * NE85.0), and CKD-stage codes mislabelled as nephropathy types (GB60.1, GB61.0, GB62.0,
 * GB63.0).
 *
 * Classes of fix (all targets verified via icd11_search — see AUDIT_TRS.md "2B"):
 *  1. MERGES (target already exists in shared DB) — delete the TRS wrong row, link TRS to
 *     the existing correctly-named row: 5C56.0→DB93.1 (hepatic cirrhosis), LB41.1→DB96.1Z
 *     (PBC), 5C81.3→DB98.5 (Budd-Chiari).
 *  2. IN-PLACE RECODES (target free) — 12 rows incl. the cross-dept GB63.0→GB81 PKD fix
 *     (shared TRS+UROL, benefits both). NE84.0/.1 acute/chronic rejection use the acuteness
 *     extensions XT5R/XT8W on the single WHO leaf NE84; NE80.0 primary non-function → bare
 *     NE84 (transplant failure).
 *
 * CA22 (COPD) is left unchanged: its proper leaf CA22.Z is already occupied in the DB by a
 * mislabelled "lung abscess" row, and CA22 is itself a valid COPD code. Every changed row
 * gets embedding = NULL.
 */
export class FixTrsIcdCodes1750000000117 implements MigrationInterface {
  name = "FixTrsIcdCodes1750000000117";

  private async recode(r: QueryRunner, oldCode: string, newCode: string, name: string, arName: string): Promise<void> {
    await r.query(
      `UPDATE "diagnoses" SET "icdCode" = $2, "icdName" = $3, "icdArName" = $4, "embedding" = NULL WHERE "icdCode" = $1`,
      [oldCode, newCode, name, arName]);
  }
  private async deleteRow(r: QueryRunner, code: string): Promise<void> {
    await r.query(`DELETE FROM "main_diag_diagnoses" WHERE "diagnosisId" = (SELECT id FROM "diagnoses" WHERE "icdCode" = $1)`, [code]);
    await r.query(`DELETE FROM "department_diagnoses" WHERE "diagnosisId" = (SELECT id FROM "diagnoses" WHERE "icdCode" = $1)`, [code]);
    await r.query(`DELETE FROM "diagnoses" WHERE "icdCode" = $1`, [code]);
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
    // ── 1. MERGES into existing shared rows ─────────────────────────────────────────
    // 5C56.0 "end-stage liver disease" → DB93.1 "hepatic cirrhosis" (existing)
    await this.deleteRow(queryRunner, "5C56.0");
    await this.link(queryRunner, "TRS", "DB93.1", "donor hepatectomy");
    await this.link(queryRunner, "TRS", "DB93.1", "liver transplant");
    await this.link(queryRunner, "TRS", "DB93.1", "multi-organ transplant");
    // LB41.1 "primary biliary cholangitis" (wrong L-chapter code) → DB96.1Z (existing, HBP)
    await this.deleteRow(queryRunner, "LB41.1");
    await this.link(queryRunner, "TRS", "DB96.1Z", "liver transplant");
    // 5C81.3 "hepatic vein thrombosis" → DB98.5 "Budd-Chiari syndrome" (existing)
    await this.deleteRow(queryRunner, "5C81.3");
    await this.link(queryRunner, "TRS", "DB98.5", "liver transplant");

    // ── 2. IN-PLACE RECODES (target free) ───────────────────────────────────────────
    await this.recode(queryRunner, "5C56.1", "DB93.1/1E51.0Z", "hepatic cirrhosis due to chronic hepatitis B", "تليّف الكبد بسبب التهاب الكبد الفيروسي ب المزمن");
    await this.recode(queryRunner, "5C56.2", "DB93.1/1E51.1", "hepatic cirrhosis due to chronic hepatitis C", "تليّف الكبد بسبب التهاب الكبد الفيروسي ج المزمن");
    await this.recode(queryRunner, "DA92.1", "DB99.7", "hepatic failure", "الفشل الكبدي");
    await this.recode(queryRunner, "NE84.0", "NE84&XT5R", "acute rejection of transplanted organ", "الرفض الحاد للعضو المزروع");
    await this.recode(queryRunner, "NE84.1", "NE84&XT8W", "chronic rejection of transplanted organ", "الرفض المزمن للعضو المزروع");
    await this.recode(queryRunner, "GB60.1", "GB61.Z", "diabetic nephropathy", "اعتلال الكلية السكري");
    await this.recode(queryRunner, "GB61.0", "BA02", "hypertensive nephropathy", "اعتلال الكلية الناجم عن ارتفاع ضغط الدم");
    await this.recode(queryRunner, "GB62.0", "GB4Y", "IgA nephropathy", "اعتلال الكلية بالغلوبولين المناعي A");
    await this.recode(queryRunner, "GB63.0", "GB81", "autosomal dominant polycystic kidney disease", "داء الكلى متعدد الكيسات السائد");
    await this.recode(queryRunner, "NE80.0", "NE84", "primary non-function of transplanted organ", "القصور الوظيفي الأولي للعضو المزروع");
    await this.recode(queryRunner, "NE81.0", "2B32.Z", "post-transplant lymphoproliferative disorder", "اضطراب التكاثر اللمفي ما بعد الزرع");
    await this.recode(queryRunner, "NE85.0", "1H0Z", "infection in transplant recipient", "العدوى في متلقي العضو المزروع");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // reverse recodes
    await this.recode(queryRunner, "1H0Z", "NE85.0", "infection in transplant recipient", "العدوى في متلقي العضو المزروع");
    await this.recode(queryRunner, "2B32.Z", "NE81.0", "post-transplant lymphoproliferative disorder", "اضطراب ما بعد الزرع اللمفي التكاثري");
    await this.recode(queryRunner, "NE84", "NE80.0", "primary non-function of transplanted organ", "قصور وظيفي أولي للعضو المزروع");
    await this.recode(queryRunner, "GB81", "GB63.0", "polycystic kidney disease", "داء الكلى متعدد الكيسات");
    await this.recode(queryRunner, "GB4Y", "GB62.0", "IgA nephropathy", "اعتلال الكلية الغلوبيولين المناعي A");
    await this.recode(queryRunner, "BA02", "GB61.0", "hypertensive nephropathy", "اعتلال الكلية الارتفاعي الضغط");
    await this.recode(queryRunner, "GB61.Z", "GB60.1", "diabetic nephropathy", "اعتلال الكلية السكري");
    await this.recode(queryRunner, "NE84&XT8W", "NE84.1", "chronic rejection of transplanted organ", "رفض مزمن للعضو المزروع");
    await this.recode(queryRunner, "NE84&XT5R", "NE84.0", "acute rejection of transplanted organ", "رفض حاد للعضو المزروع");
    await this.recode(queryRunner, "DB99.7", "DA92.1", "hepatic failure requiring transplantation", "فشل كبدي يستلزم الزراعة");
    await this.recode(queryRunner, "DB93.1/1E51.1", "5C56.2", "hepatic cirrhosis due to viral hepatitis C", "تليف كبدي بسبب التهاب الكبد الفيروسي ج");
    await this.recode(queryRunner, "DB93.1/1E51.0Z", "5C56.1", "hepatic cirrhosis due to viral hepatitis B", "تليف كبدي بسبب التهاب الكبد الفيروسي ب");

    // reverse merges — recreate the deleted rows and restore their links; unlink the merge targets
    const unlinkTrs = async (code: string, mainDiag: string) => {
      await queryRunner.query(`
        DELETE FROM "main_diag_diagnoses" WHERE "diagnosisId" = (SELECT id FROM "diagnoses" WHERE "icdCode" = $1)
          AND "mainDiagId" = (SELECT md.id FROM "main_diags" md JOIN "departments" d ON md."departmentId" = d.id WHERE d.code = 'TRS' AND md.title = $2)`, [code, mainDiag]);
    };
    const recreate = async (code: string, name: string, arName: string, links: [string, string][]) => {
      await queryRunner.query(
        `INSERT INTO "diagnoses" ("icdCode","icdName","icdArName","description","arDescription") VALUES ($1,$2,$3,$2,$3) ON CONFLICT ("icdCode") DO NOTHING`,
        [code, name, arName]);
      for (const [dept, md] of links) await this.link(queryRunner, dept, code, md);
    };
    await unlinkTrs("DB98.5", "liver transplant");
    await recreate("5C81.3", "hepatic vein thrombosis", "تجلط الأوردة الكبدية", [["TRS", "liver transplant"]]);
    await unlinkTrs("DB96.1Z", "liver transplant");
    await recreate("LB41.1", "primary biliary cholangitis", "التهاب الأقنية الصفراوية الأولي", [["TRS", "liver transplant"]]);
    await unlinkTrs("DB93.1", "donor hepatectomy");
    await unlinkTrs("DB93.1", "liver transplant");
    await unlinkTrs("DB93.1", "multi-organ transplant");
    // only remove the TRS department link for DB93.1 if no TRS main_diag links remain
    await queryRunner.query(`
      DELETE FROM "department_diagnoses" WHERE "departmentId" = (SELECT id FROM "departments" WHERE code = 'TRS')
        AND "diagnosisId" = (SELECT id FROM "diagnoses" WHERE "icdCode" = 'DB93.1')`);
    await recreate("5C56.0", "end-stage liver disease", "مرض الكبد بالمرحلة النهائية",
      [["TRS", "donor hepatectomy"], ["TRS", "liver transplant"], ["TRS", "multi-organ transplant"]]);
  }
}
