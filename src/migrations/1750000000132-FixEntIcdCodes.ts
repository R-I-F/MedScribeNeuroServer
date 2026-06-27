import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * ENT (Otolaryngology) audit — MIG-A: fixes the residual ICD-11 errors. ENT was the least
 * corrupt department audited (~14% code-wrong) because the bulk of its mismaps were already
 * corrected by migrations 026 (CA09.0→AB00, CA22.0→AB33, CA23.x→AA91.Z/AB12, CA24.0→AB13,
 * CA30.0→AB51.1, CA43.0→AB31.2, CA44.0→AB31.0, AA40.x→CA03/CA0K.1, AA12.x→CA01/CA0A.Z/CA0J,
 * AA05.0→MD20) and 035 (laryngeal/nasopharyngeal carcinoma).
 *
 * Classes of fix (all targets verified via icd11_search — see AUDIT_ENT.md "2B"):
 *  1. MERGES (target already exists) — DA50.2 parotid calculus → DA04.4 sialolithiasis
 *     (MFS-owned); DA50.3 branchial cyst → DA05.Y branchial cleft cyst (PEDSURG-owned).
 *  2. IN-PLACE RECODES (target free) — 6 rows (deviated septum, OSA moved to ch.7 sleep,
 *     sudden idiopathic hearing loss, + 3 parent→leaf refinements).
 *  3. NAME-ONLY fixes (rename + embedding NULL) — fix the "MeniÃ¨re" mojibake and two Arabic
 *     terminology errors (cholesteatoma, vocal-cord polyp).
 *
 * Every changed/renamed row gets embedding = NULL.
 */
export class FixEntIcdCodes1750000000132 implements MigrationInterface {
  name = "FixEntIcdCodes1750000000132";

  private async recode(r: QueryRunner, oldCode: string, newCode: string, name: string, arName: string): Promise<void> {
    await r.query(
      `UPDATE "diagnoses" SET "icdCode" = $2, "icdName" = $3, "icdArName" = $4, "embedding" = NULL WHERE "icdCode" = $1`,
      [oldCode, newCode, name, arName]);
  }
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
    await this.deleteRow(queryRunner, "DA50.2");                       // parotid calculus → DA04.4 (MFS)
    await this.link(queryRunner, "ENT", "DA04.4", "salivary gland disease");
    await this.deleteRow(queryRunner, "DA50.3");                       // branchial cyst → DA05.Y (PEDSURG)
    await this.link(queryRunner, "ENT", "DA05.Y", "salivary gland disease");

    // ── 2. IN-PLACE RECODES (target free) ───────────────────────────────────────────
    await this.recode(queryRunner, "CA01.0", "CA0D", "deviated nasal septum", "انحراف الحاجز الأنفي");
    await this.recode(queryRunner, "CA62.0", "7A41", "obstructive sleep apnoea", "انقطاع النفس الانسدادي النومي");
    await this.recode(queryRunner, "AB51.1", "AB55", "sudden sensorineural hearing loss", "فقدان السمع الحسي العصبي المفاجئ");
    await this.recode(queryRunner, "CA0J", "CA0J.Z", "nasal polyp", "سَليلة أنفية");
    await this.recode(queryRunner, "AB13", "AB13.Z", "tympanic membrane perforation", "ثقب طبلة الأذن");
    await this.recode(queryRunner, "CA03", "CA03.Z", "tonsillitis", "التهاب اللوزتين");

    // ── 3. NAME-ONLY fixes (mojibake / Arabic terminology) ──────────────────────────
    await this.rename(queryRunner, "AB31.0", "Meniere disease", "مرض منيير");
    await this.rename(queryRunner, "AB12", "cholesteatoma of middle ear", "الورم الصفراوي للأذن الوسطى");
    await this.rename(queryRunner, "CA0H.1", "polyp of vocal cord or larynx", "سَليلة الحبل الصوتي أو الحنجرة");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // reverse name-only fixes
    await this.rename(queryRunner, "CA0H.1", "polyp of vocal cord or larynx", "ورم حليمي الحبل الصوتي أو الحنجرة");
    await this.rename(queryRunner, "AB12", "cholesteatoma of middle ear", "ورم كوليستيروليني في الأذن الوسطى");
    await this.rename(queryRunner, "AB31.0", "MeniÃ¨re disease", "مرض منيير");
    // reverse recodes
    await this.recode(queryRunner, "CA03.Z", "CA03", "tonsillitis", "التهاب اللوزتين");
    await this.recode(queryRunner, "AB13.Z", "AB13", "tympanic membrane perforation", "ثقب طبلة الأذن");
    await this.recode(queryRunner, "CA0J.Z", "CA0J", "nasal polyp", "بوليب أنفي");
    await this.recode(queryRunner, "AB55", "AB51.1", "sudden sensorineural hearing loss", "فقدان السمع الحسي العصبي المفاجئ");
    await this.recode(queryRunner, "7A41", "CA62.0", "obstructive sleep apnoea", "انقطاع النفس الانسدادي النومي");
    await this.recode(queryRunner, "CA0D", "CA01.0", "deviated nasal septum", "انحراف الحاجز الأنفي");
    // reverse merges — recreate the deleted ENT rows and unlink the shared targets from ENT
    const unlinkEnt = async (code: string, mainDiag: string) => {
      await queryRunner.query(`
        DELETE FROM "main_diag_diagnoses" WHERE "diagnosisId" = (SELECT id FROM "diagnoses" WHERE "icdCode" = $1)
          AND "mainDiagId" = (SELECT md.id FROM "main_diags" md JOIN "departments" d ON md."departmentId" = d.id WHERE d.code = 'ENT' AND md.title = $2)`, [code, mainDiag]);
      await queryRunner.query(`
        DELETE FROM "department_diagnoses" WHERE "departmentId" = (SELECT id FROM "departments" WHERE code = 'ENT')
          AND "diagnosisId" = (SELECT id FROM "diagnoses" WHERE "icdCode" = $1)`, [code]);
    };
    const recreate = async (code: string, name: string, arName: string, mainDiag: string) => {
      await queryRunner.query(
        `INSERT INTO "diagnoses" ("icdCode","icdName","icdArName","description","arDescription") VALUES ($1,$2,$3,$2,$3) ON CONFLICT ("icdCode") DO NOTHING`,
        [code, name, arName]);
      await this.link(queryRunner, "ENT", code, mainDiag);
    };
    await unlinkEnt("DA05.Y", "salivary gland disease");
    await recreate("DA50.3", "branchial cyst", "كيسة خيشومية", "salivary gland disease");
    await unlinkEnt("DA04.4", "salivary gland disease");
    await recreate("DA50.2", "parotid gland calculus", "حصاة الغدة النكفية", "salivary gland disease");
  }
}
