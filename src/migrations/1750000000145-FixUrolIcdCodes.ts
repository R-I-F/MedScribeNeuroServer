import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * UROL (Urology) audit — MIG-A: fixes the ICD-11 errors. UROL reference data was ~74%
 * corrupt (16/23 codes wrong + 1 invalid leaf). The seed mapped urological conditions onto
 * the wrong WHO blocks: female-genital GA codes (GA00=vulvitis, GA20, GA40), cystitis
 * GC00.x (GC00=cystitis used for stones), and nephritis GB4x/GB5x blocks (GB40=nephritic,
 * GB42, GB50=acute TIN, GB51=acute pyelonephritis used for testicular/penile conditions).
 * All targets verified via icd11_search — see AUDIT_UROL.md "2B".
 *
 * Classes of fix:
 *  1. INVALID-LEAF — GA90.0 is not a valid WHO leaf; the BPH leaf is GA90.
 *  2. IN-PLACE RECODES (target free) — 9 wrong-block codes moved to their correct WHO leaf.
 *     NB: GC00.1 (calculus of ureter) keeps its dual nephrolithiasis + ureteral-obstruction link.
 *  3. MERGEs (target already exists, shared with another dept) — 7 rows: delete the UROL row,
 *     relink the existing shared row to UROL + the right main_diag.
 *     2C73.0→2C90.0 (SOC, RCC), 2C70.1→2C80.2 (PEDSURG/SOC, germ-cell testis),
 *     GB40.0→BD75.1 (PEDSURG, varicocele), GB42.0→GB01.0 (PEDSURG, torsion),
 *     GC10.0→GB56.5 (TRS, VUR), GC80.0→GC50.0 (OBGYN, OAB — dual incont+retention),
 *     GA00.0→MF50.20 (OBGYN, stress incontinence).
 * Every changed/added row gets embedding = NULL so the backfill re-embeds it.
 */
export class FixUrolIcdCodes1750000000145 implements MigrationInterface {
  name = "FixUrolIcdCodes1750000000145";

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
    // ── 1. INVALID LEAF → valid WHO leaf ─────────────────────────────────────────────
    await this.recode(queryRunner, "GA90.0", "GA90", "benign prostatic hyperplasia", "تضخم البروستاتا الحميد");

    // ── 2. IN-PLACE RECODES (wrong block → correct WHO leaf, target free) ─────────────
    await this.recode(queryRunner, "GA40.0", "GB51",    "acute pyelonephritis", "التهاب الحويضة والكلية الحاد");
    await this.recode(queryRunner, "GC00.0", "GB70.0Z", "calculus of kidney", "حصاة الكلية");
    await this.recode(queryRunner, "GC00.2", "GB71.0",  "calculus of urinary bladder", "حصاة المثانة البولية");
    await this.recode(queryRunner, "GC00.1", "GB70.1",  "calculus of ureter", "حصاة الحالب");
    await this.recode(queryRunner, "GB50.0", "GB05.2",  "phimosis", "الشبم");
    await this.recode(queryRunner, "GB51.0", "GB02.1",  "epididymo-orchitis", "التهاب البربخ والخصية");
    await this.recode(queryRunner, "GC20.0", "GB56.4",  "hydronephrosis", "استسقاء الكلية");
    await this.recode(queryRunner, "GC21.0", "GB56.0",  "ureteropelvic junction obstruction", "انسداد الوصل الحويضي الحالبي");
    await this.recode(queryRunner, "GA20.0", "GC03",    "urethral stricture", "تضيق الإحليل");

    // ── 3. MERGEs into existing shared rows ──────────────────────────────────────────
    await this.deleteRow(queryRunner, "2C73.0"); await this.link(queryRunner, "UROL", "2C90.0", "renal cancer");
    await this.deleteRow(queryRunner, "2C70.1"); await this.link(queryRunner, "UROL", "2C80.2", "testicular cancer");
    await this.deleteRow(queryRunner, "GB40.0"); await this.link(queryRunner, "UROL", "BD75.1", "male infertility");
    await this.deleteRow(queryRunner, "GB42.0"); await this.link(queryRunner, "UROL", "GB01.0", "testicular cancer");
    await this.deleteRow(queryRunner, "GC10.0"); await this.link(queryRunner, "UROL", "GB56.5", "ureteral obstruction");
    await this.deleteRow(queryRunner, "GC80.0");
    await this.link(queryRunner, "UROL", "GC50.0", "urinary incontinence");
    await this.link(queryRunner, "UROL", "GC50.0", "urinary retention");
    await this.deleteRow(queryRunner, "GA00.0"); await this.link(queryRunner, "UROL", "MF50.20", "urinary incontinence");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // reverse MERGEs — unlink shared rows from UROL, recreate the original UROL-owned rows
    const remerge = async (sharedCode: string, oldCode: string, name: string, ar: string, mds: string[]) => {
      for (const md of mds) {
        await queryRunner.query(
          `DELETE FROM "main_diag_diagnoses" WHERE "diagnosisId" = (SELECT id FROM "diagnoses" WHERE "icdCode" = $1)
             AND "mainDiagId" = (SELECT md.id FROM "main_diags" md JOIN "departments" d ON md."departmentId" = d.id WHERE d.code = 'UROL' AND md.title = $2)`,
          [sharedCode, md]);
      }
      await queryRunner.query(
        `DELETE FROM "department_diagnoses" WHERE "departmentId" = (SELECT id FROM "departments" WHERE code='UROL')
           AND "diagnosisId" = (SELECT id FROM "diagnoses" WHERE "icdCode" = $1)`, [sharedCode]);
      await queryRunner.query(
        `INSERT INTO "diagnoses" ("icdCode","icdName","icdArName","description","arDescription")
         VALUES ($1,$2,$3,$2,$3) ON CONFLICT ("icdCode") DO NOTHING`, [oldCode, name, ar]);
      for (const md of mds) await this.link(queryRunner, "UROL", oldCode, md);
    };
    await remerge("MF50.20", "GA00.0", "stress urinary incontinence", "سلس البول الإجهادي", ["urinary incontinence"]);
    await remerge("GC50.0",  "GC80.0", "overactive bladder", "المثانة مفرطة النشاط", ["urinary incontinence", "urinary retention"]);
    await remerge("GB56.5",  "GC10.0", "vesicoureteric reflux", "الجزر المثاني الحالبي", ["ureteral obstruction"]);
    await remerge("GB01.0",  "GB42.0", "torsion of testis", "التواء الخصية", ["testicular cancer"]);
    await remerge("BD75.1",  "GB40.0", "varicocele", "دوالي الحبل المنوي", ["male infertility"]);
    await remerge("2C80.2",  "2C70.1", "seminoma of testis", "ورم الخصية المنوية", ["testicular cancer"]);
    await remerge("2C90.0",  "2C73.0", "renal cell carcinoma", "سرطان الخلايا الكلوية", ["renal cancer"]);

    // reverse in-place recodes
    await this.recode(queryRunner, "GC03",    "GA20.0", "urethral stricture", "تضيق الإحليل");
    await this.recode(queryRunner, "GB56.0",  "GC21.0", "ureteropelvic junction obstruction", "انسداد الوصل الحويضي الحالبي");
    await this.recode(queryRunner, "GB56.4",  "GC20.0", "hydronephrosis", "استسقاء الكلية");
    await this.recode(queryRunner, "GB02.1",  "GB51.0", "epididymo-orchitis", "التهاب البربخ والخصية");
    await this.recode(queryRunner, "GB05.2",  "GB50.0", "phimosis", "الشبم");
    await this.recode(queryRunner, "GB70.1",  "GC00.1", "calculus of ureter", "حصاة الحالب");
    await this.recode(queryRunner, "GB71.0",  "GC00.2", "calculus of urinary bladder", "حصاة المثانة البولية");
    await this.recode(queryRunner, "GB70.0Z", "GC00.0", "calculus of kidney", "حصاة الكلية");
    await this.recode(queryRunner, "GB51",    "GA40.0", "acute pyelonephritis", "التهاب الحويضة والكلية الحاد");

    // reverse invalid-leaf fix
    await this.recode(queryRunner, "GA90", "GA90.0", "benign prostatic hyperplasia", "تضخم البروستاتا الحميد");
  }
}
