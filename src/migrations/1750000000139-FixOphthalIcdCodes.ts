import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * OPHTHAL (Ophthalmology) audit — MIG-A: fixes the ICD-11 errors. OPHTHAL reference data
 * was ~64% corrupt (15/28 codes wrong + 3 parent→leaf). The seed used a fabricated
 * 9A00/9A20/9A30/9A40/9A50/9A81/9B11/9B20/9B40/9B41 scheme that does not match WHO ICD-11.
 * All targets verified via icd11_search — see AUDIT_OPHTHAL.md "2B".
 *
 * Classes of fix:
 *  1. IN-PLACE RECODES (target free) — 14 wrong-block codes moved to their correct WHO leaf:
 *     glaucoma→9C61, conjunctiva→9A60/9A61, cornea ulcer→9A76, retinal vascular→9B74,
 *     retinal detachment→9B73, vitreous→9B83, thyroid orbitopathy→9C82.3, retinoblastoma→2D02.2
 *     (chapter-2 neoplasm). NB: recoding vitreous-haemorrhage 9B11.0→9B83 frees 9B11.0, which
 *     MIG-D reuses for aphakia (its true WHO meaning).
 *  2. PARENT→LEAF refinements — 3 rows (senile cataract, AMD, eyeball injury).
 *  3. MERGE — diabetic-retinopathy 9A50.0 → existing 9B71.0Z (owned by TRS): delete the OPHTHAL
 *     row, relink the shared 9B71.0Z to OPHTHAL + the "diabetic retinopathy" category.
 *  4. STRUCTURAL relink — conjunctivitis (recoded 9A60.Z) moves from "eyelid pathology" to the
 *     "pterygium" category (which functionally becomes the conjunctival/ocular-surface group).
 *
 * Every changed row gets embedding = NULL so the backfill re-embeds it.
 */
export class FixOphthalIcdCodes1750000000139 implements MigrationInterface {
  name = "FixOphthalIcdCodes1750000000139";

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
  private async unlinkMainDiag(r: QueryRunner, dept: string, code: string, mainDiag: string): Promise<void> {
    await r.query(
      `DELETE FROM "main_diag_diagnoses" WHERE "diagnosisId" = (SELECT id FROM "diagnoses" WHERE "icdCode" = $1)
         AND "mainDiagId" = (SELECT md.id FROM "main_diags" md JOIN "departments" d ON md."departmentId" = d.id WHERE d.code = $2 AND md.title = $3)`,
      [code, dept, mainDiag]);
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── 1. IN-PLACE RECODES (wrong block → correct WHO leaf) ────────────────────────
    await this.recode(queryRunner, "9A30.0", "9A76",   "corneal ulcer", "قرحة القرنية");
    await this.recode(queryRunner, "9A20.0", "9A60.Z", "conjunctivitis", "التهاب الملتحمة");
    await this.recode(queryRunner, "9B40.0", "9A02.0Z", "chalazion", "بَردة الجفن");
    await this.recode(queryRunner, "9B41.0", "9A03.1Z", "entropion", "انقلاب الجفن للداخل");
    await this.recode(queryRunner, "9B41.1", "9A03.2Z", "ectropion", "انقلاب الجفن للخارج");
    await this.recode(queryRunner, "9A00.0", "9C61.0Z", "open-angle glaucoma", "الجلوكوما مفتوحة الزاوية");
    await this.recode(queryRunner, "9A00.1", "9C61.14", "acute angle-closure glaucoma", "الجلوكوما الحادة مغلقة الزاوية");
    await this.recode(queryRunner, "9A01.0", "9C82.3",  "thyroid eye disease (thyroid orbitopathy)", "مرض العين الدرقي");
    await this.recode(queryRunner, "GB92.0", "2D02.2",  "retinoblastoma", "ورم الأرومة الشبكية");
    await this.recode(queryRunner, "9B20.0", "9A61.1",  "pterygium", "جناح العين (الظَّفَرة)");
    await this.recode(queryRunner, "9A40.0", "9B74.0",  "central retinal artery occlusion", "انسداد الشريان الشبكي المركزي");
    await this.recode(queryRunner, "9A40.1", "9B74.1",  "central retinal vein occlusion", "انسداد الوريد الشبكي المركزي");
    await this.recode(queryRunner, "9A81.0", "9B73.0",  "rhegmatogenous retinal detachment", "انفصال الشبكية الانشقاقي");
    await this.recode(queryRunner, "9B11.0", "9B83",    "vitreous haemorrhage", "نزيف زجاجي");

    // ── 2. PARENT→LEAF refinements ──────────────────────────────────────────────────
    await this.recode(queryRunner, "9B10.0", "9B10.0Z", "senile cataract", "ساد شيخوخي");
    await this.recode(queryRunner, "9B75.0", "9B75.0Z", "age-related macular degeneration", "ضمور البقعة المرتبط بالعمر");
    await this.recode(queryRunner, "NA06.8", "NA06.8Z", "traumatic injury to eyeball", "إصابة رضّية في مقلة العين");

    // ── 3. MERGE diabetic retinopathy into the shared TRS row 9B71.0Z ────────────────
    await this.deleteRow(queryRunner, "9A50.0");
    await this.link(queryRunner, "OPHTHAL", "9B71.0Z", "diabetic retinopathy");

    // ── 4. STRUCTURAL relink: conjunctivitis eyelid pathology → pterygium (ocular surface)
    await this.unlinkMainDiag(queryRunner, "OPHTHAL", "9A60.Z", "eyelid pathology");
    await this.link(queryRunner, "OPHTHAL", "9A60.Z", "pterygium");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // reverse structural relink
    await this.unlinkMainDiag(queryRunner, "OPHTHAL", "9A60.Z", "pterygium");
    await this.link(queryRunner, "OPHTHAL", "9A60.Z", "eyelid pathology");

    // reverse the MERGE — unlink shared row, recreate the OPHTHAL diabetic-retinopathy row
    await this.unlinkMainDiag(queryRunner, "OPHTHAL", "9B71.0Z", "diabetic retinopathy");
    await queryRunner.query(
      `DELETE FROM "department_diagnoses" WHERE "departmentId" = (SELECT id FROM "departments" WHERE code = 'OPHTHAL')
         AND "diagnosisId" = (SELECT id FROM "diagnoses" WHERE "icdCode" = '9B71.0Z')`);
    await queryRunner.query(
      `INSERT INTO "diagnoses" ("icdCode","icdName","icdArName","description","arDescription")
       VALUES ('9A50.0','diabetic retinopathy','اعتلال الشبكية السكري','diabetic retinopathy','اعتلال الشبكية السكري') ON CONFLICT ("icdCode") DO NOTHING`);
    await this.link(queryRunner, "OPHTHAL", "9A50.0", "diabetic retinopathy");

    // reverse parent→leaf refinements
    await this.recode(queryRunner, "NA06.8Z", "NA06.8", "traumatic injury to eyeball", "إصابة رضّية في مقلة العين");
    await this.recode(queryRunner, "9B75.0Z", "9B75.0", "age-related macular degeneration", "ضمور البقعة المرتبط بالعمر");
    await this.recode(queryRunner, "9B10.0Z", "9B10.0", "senile cataract", "ساد شيخوخي");

    // reverse in-place recodes
    await this.recode(queryRunner, "9B83",    "9B11.0", "vitreous haemorrhage", "نزيف زجاجي");
    await this.recode(queryRunner, "9B73.0",  "9A81.0", "rhegmatogenous retinal detachment", "انفصال الشبكية الانشقاقي");
    await this.recode(queryRunner, "9B74.1",  "9A40.1", "central retinal vein occlusion", "انسداد الوريد الشبكي المركزي");
    await this.recode(queryRunner, "9B74.0",  "9A40.0", "central retinal artery occlusion", "انسداد الشريان الشبكي المركزي");
    await this.recode(queryRunner, "9A61.1",  "9B20.0", "pterygium", "جناح العين");
    await this.recode(queryRunner, "2D02.2",  "GB92.0", "retinoblastoma", "ورم الأرومة الشبكية");
    await this.recode(queryRunner, "9C82.3",  "9A01.0", "thyroid eye disease", "مرض العين الدرقي");
    await this.recode(queryRunner, "9C61.14", "9A00.1", "acute angle-closure glaucoma", "الجلوكوما الحادة مغلقة الزاوية");
    await this.recode(queryRunner, "9C61.0Z", "9A00.0", "open-angle glaucoma", "الجلوكوما مفتوحة الزاوية");
    await this.recode(queryRunner, "9A03.2Z", "9B41.1", "ectropion", "انقلاب الجفن للخارج");
    await this.recode(queryRunner, "9A03.1Z", "9B41.0", "entropion", "انقلاب الجفن للداخل");
    await this.recode(queryRunner, "9A02.0Z", "9B40.0", "chalazion", "برد الجفن");
    await this.recode(queryRunner, "9A60.Z",  "9A20.0", "conjunctivitis", "التهاب الملتحمة");
    await this.recode(queryRunner, "9A76",    "9A30.0", "corneal ulcer", "قرحة القرنية");
  }
}
