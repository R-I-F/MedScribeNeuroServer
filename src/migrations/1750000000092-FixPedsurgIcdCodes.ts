import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * PEDSURG audit — MIG-A: fixes the heavily-corrupted ICD-11 codes (18 of 24 were wrong,
 * ~75%). Surgical conditions had been scattered into wrong chapters (appendicitis/hernias/
 * intussusception in developmental LA9x/LB1x; tumours in disease chapters; a duodenal-
 * atresia ↔ pyloric-stenosis ↔ Meckel ↔ annular-pancreas code tangle).
 *
 * Ordering inside up() matters (unique icdCode constraint):
 *  1. MERGE 5 wrong rows into existing shared rows owned by GS/PRS, and DELETE the duplicate
 *     duodenal-atresia row — this frees LB21.0 (annular pancreas, used in 094) and LB13.0.
 *  2. 11 free UPDATEs (correct chapter/leaf).
 *  3. pyloric LB11.0 -> LB13.0 (now free after step 1).
 *  4. rename the LB14 row to "duodenal atresia" and move it malrotation -> neonatal emergencies.
 *  5. relink the epidermoid-cyst orphan to the new "soft tissue & skin lesions" category.
 *
 * Every changed/recoded row gets embedding = NULL so the backfill re-embeds it.
 * All target codes verified via icd11_search (see MEDICAL_CODE_AUDITS/PEDSURG/AUDIT_PEDSURG.md).
 */
export class FixPedsurgIcdCodes1750000000092 implements MigrationInterface {
  name = "FixPedsurgIcdCodes1750000000092";

  /** Delete a PEDSURG-specific (corrupted) diagnosis row and all its junctions. */
  private async deleteRow(r: QueryRunner, code: string): Promise<void> {
    await r.query(`DELETE FROM "main_diag_diagnoses" WHERE "diagnosisId" = (SELECT id FROM "diagnoses" WHERE "icdCode" = $1)`, [code]);
    await r.query(`DELETE FROM "department_diagnoses" WHERE "diagnosisId" = (SELECT id FROM "diagnoses" WHERE "icdCode" = $1)`, [code]);
    await r.query(`DELETE FROM "diagnoses" WHERE "icdCode" = $1`, [code]);
  }

  /** Link PEDSURG dept + a main_diag to an existing (shared) diagnosis row. */
  private async linkShared(r: QueryRunner, code: string, mainDiag: string): Promise<void> {
    await r.query(
      `INSERT INTO "department_diagnoses" ("departmentId","diagnosisId")
       SELECT dept.id, d.id FROM "departments" dept CROSS JOIN "diagnoses" d
       WHERE dept.code = 'PEDSURG' AND d."icdCode" = $1 ON CONFLICT DO NOTHING`, [code]);
    await r.query(
      `INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
       SELECT md.id, d.id FROM "main_diags" md JOIN "departments" dept ON md."departmentId" = dept.id
       CROSS JOIN "diagnoses" d
       WHERE dept.code = 'PEDSURG' AND md.title = $2 AND d."icdCode" = $1 ON CONFLICT DO NOTHING`, [code, mainDiag]);
  }

  /** Recode a row in place (code + names) and null its embedding. */
  private async recode(r: QueryRunner, oldCode: string, newCode: string, name: string, arName: string): Promise<void> {
    await r.query(
      `UPDATE "diagnoses" SET "icdCode" = $2, "icdName" = $3, "icdArName" = $4, "embedding" = NULL WHERE "icdCode" = $1`,
      [oldCode, newCode, name, arName]);
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── 1. MERGE wrong rows into existing shared rows (+ delete duplicate) ──────────
    await this.deleteRow(queryRunner, "LB21.0");                       // PEDSURG meckel (wrong) → GS LB15.0
    await this.linkShared(queryRunner, "LB15.0", "neonatal emergencies");
    await this.deleteRow(queryRunner, "LA95.0");                       // intussusception → GS DA91.0
    await this.linkShared(queryRunner, "DA91.0", "intussusception");
    await this.deleteRow(queryRunner, "LA91.0");                       // inguinal hernia → GS DD51
    await this.linkShared(queryRunner, "DD51", "inguinal hernia");
    await this.deleteRow(queryRunner, "LA92.0");                       // umbilical hernia → GS DD53
    await this.linkShared(queryRunner, "DD53", "umbilical hernia");
    await this.deleteRow(queryRunner, "LB41.0");                       // fournier gangrene → PRS 1B71.1
    await this.linkShared(queryRunner, "1B71.1", "soft tissue & skin lesions");
    await this.deleteRow(queryRunner, "LB13.0");                       // duplicate duodenal-atresia row (frees LB13.0)

    // ── 2. Free UPDATEs (correct chapter/leaf) ─────────────────────────────────────
    await this.recode(queryRunner, "LB19.0", "LB01", "exomphalos", "فتق سري جنيني");
    await this.recode(queryRunner, "LA50.0", "DB10.0", "acute appendicitis", "التهاب الزائدة الدودية الحاد");
    await this.recode(queryRunner, "KB20.0", "LB00.0", "congenital diaphragmatic hernia", "فتق الحجاب الحاجز الخلقي");
    await this.recode(queryRunner, "LB10.0", "LB12.1Y", "oesophageal atresia with tracheo-oesophageal fistula", "رتق المريء مع الناسور الرغامي المريئي");
    await this.recode(queryRunner, "LB51.0", "LB52.Z", "undescended testis", "الخصية غير النازلة");
    await this.recode(queryRunner, "LB12.0", "LB18", "intestinal malrotation", "سوء دوران الأمعاء");
    await this.recode(queryRunner, "LB14.0", "LB16.1", "hirschsprung disease", "مرض هيرشسبرونغ");
    await this.recode(queryRunner, "LB22.00", "KB88.Z", "necrotising enterocolitis", "التهاب الأمعاء والقولون النخري");
    await this.recode(queryRunner, "LB40.0", "LB20.20", "choledochal cyst", "كيس القناة الصفراوية المشتركة");
    await this.recode(queryRunner, "GB82.0", "2C90.Y", "wilms tumour", "ورم ويلمز");
    await this.recode(queryRunner, "XH4MH9", "2D11.2", "neuroblastoma", "ورم الأرومة العصبية");

    // ── 3. pyloric stenosis -> LB13.0 (now free) ───────────────────────────────────
    await this.recode(queryRunner, "LB11.0", "LB13.0", "hypertrophic pyloric stenosis", "تضيق البواب الضخامي");

    // ── 4. rename LB14 row -> "duodenal atresia"; move malrotation -> neonatal ──────
    await queryRunner.query(
      `UPDATE "diagnoses" SET "icdName" = 'duodenal atresia', "icdArName" = 'رتق الاثني عشر', "embedding" = NULL WHERE "icdCode" = 'LB14'`);
    await queryRunner.query(`
      DELETE FROM "main_diag_diagnoses"
      WHERE "diagnosisId" = (SELECT id FROM "diagnoses" WHERE "icdCode" = 'LB14')
        AND "mainDiagId" = (SELECT md.id FROM "main_diags" md JOIN "departments" dept ON md."departmentId" = dept.id
                            WHERE dept.code = 'PEDSURG' AND md.title = 'malrotation & volvulus')`);
    await this.linkShared(queryRunner, "LB14", "neonatal emergencies");

    // ── 5. relink epidermoid-cyst orphan -> soft tissue & skin lesions ─────────────
    await this.linkShared(queryRunner, "EK70.0Z", "soft tissue & skin lesions");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 5. unlink epidermoid from soft tissue
    await queryRunner.query(`
      DELETE FROM "main_diag_diagnoses"
      WHERE "diagnosisId" = (SELECT id FROM "diagnoses" WHERE "icdCode" = 'EK70.0Z')
        AND "mainDiagId" = (SELECT md.id FROM "main_diags" md JOIN "departments" dept ON md."departmentId" = dept.id
                            WHERE dept.code = 'PEDSURG' AND md.title = 'soft tissue & skin lesions')`);
    // 4. revert LB14: neonatal -> malrotation + name back
    await queryRunner.query(`
      DELETE FROM "main_diag_diagnoses"
      WHERE "diagnosisId" = (SELECT id FROM "diagnoses" WHERE "icdCode" = 'LB14')
        AND "mainDiagId" = (SELECT md.id FROM "main_diags" md JOIN "departments" dept ON md."departmentId" = dept.id
                            WHERE dept.code = 'PEDSURG' AND md.title = 'neonatal emergencies')`);
    await this.linkShared(queryRunner, "LB14", "malrotation & volvulus");
    await queryRunner.query(
      `UPDATE "diagnoses" SET "icdName" = 'structural developmental anomalies of duodenum', "icdArName" = 'الشذوذات البنيوية التنموية للاثني عشر', "embedding" = NULL WHERE "icdCode" = 'LB14'`);
    // 3 + 2. reverse recodes
    await this.recode(queryRunner, "LB13.0", "LB11.0", "hypertrophic pyloric stenosis", "تضيق البواب الضخامي");
    await this.recode(queryRunner, "2D11.2", "XH4MH9", "neuroblastoma", "ورم الأرومة العصبية");
    await this.recode(queryRunner, "2C90.Y", "GB82.0", "wilms tumour", "ورم ويلمز");
    await this.recode(queryRunner, "LB20.20", "LB40.0", "choledochal cyst", "كيس القناة الصفراوية المشتركة");
    await this.recode(queryRunner, "KB88.Z", "LB22.00", "necrotising enterocolitis", "التهاب الأمعاء والقولون النخري");
    await this.recode(queryRunner, "LB16.1", "LB14.0", "hirschsprung disease", "مرض هيرشسبرونغ");
    await this.recode(queryRunner, "LB18", "LB12.0", "intestinal malrotation", "سوء دوران الأمعاء");
    await this.recode(queryRunner, "LB52.Z", "LB51.0", "undescended testis", "الخصية غير النازلة");
    await this.recode(queryRunner, "LB12.1Y", "LB10.0", "tracheoesophageal fistula", "ناسور رغامي مريئي");
    await this.recode(queryRunner, "LB00.0", "KB20.0", "congenital diaphragmatic hernia", "فتق الحجاب الحاجز الخلقي");
    await this.recode(queryRunner, "DB10.0", "LA50.0", "acute appendicitis", "التهاب الزائدة الدودية الحاد");
    await this.recode(queryRunner, "LB01", "LB19.0", "exomphalos", "فتق سري جنيني");
    // 1. reverse merges: unlink PEDSURG from shared rows + recreate the deleted PEDSURG rows
    const unlink = async (code: string, mainDiag: string) => {
      await queryRunner.query(`
        DELETE FROM "main_diag_diagnoses"
        WHERE "diagnosisId" = (SELECT id FROM "diagnoses" WHERE "icdCode" = $1)
          AND "mainDiagId" = (SELECT md.id FROM "main_diags" md JOIN "departments" dept ON md."departmentId" = dept.id
                              WHERE dept.code = 'PEDSURG' AND md.title = $2)`, [code, mainDiag]);
      await queryRunner.query(`
        DELETE FROM "department_diagnoses"
        WHERE "departmentId" = (SELECT id FROM "departments" WHERE code = 'PEDSURG')
          AND "diagnosisId" = (SELECT id FROM "diagnoses" WHERE "icdCode" = $1)`, [code]);
    };
    await unlink("LB15.0", "neonatal emergencies");
    await unlink("DA91.0", "intussusception");
    await unlink("DD51", "inguinal hernia");
    await unlink("DD53", "umbilical hernia");
    await unlink("1B71.1", "soft tissue & skin lesions");

    const recreate = async (code: string, name: string, arName: string, mainDiag: string | null) => {
      await queryRunner.query(
        `INSERT INTO "diagnoses" ("icdCode","icdName","icdArName","description","arDescription")
         VALUES ($1,$2,$3,$2,$3) ON CONFLICT ("icdCode") DO NOTHING`, [code, name, arName]);
      await queryRunner.query(
        `INSERT INTO "department_diagnoses" ("departmentId","diagnosisId")
         SELECT dept.id, d.id FROM "departments" dept CROSS JOIN "diagnoses" d
         WHERE dept.code = 'PEDSURG' AND d."icdCode" = $1 ON CONFLICT DO NOTHING`, [code]);
      if (mainDiag) await this.linkShared(queryRunner, code, mainDiag);
    };
    await recreate("LB21.0", "meckel diverticulum", "رتج ميكل", "neonatal emergencies");
    await recreate("LA95.0", "intussusception", "انغلاف معوي", "intussusception");
    await recreate("LA91.0", "inguinal hernia", "فتق إربي", "inguinal hernia");
    await recreate("LA92.0", "umbilical hernia", "فتق سري", "umbilical hernia");
    await recreate("LB41.0", "fournier gangrene", "غنغرينا فورنييه", null);
    await recreate("LB13.0", "duodenal atresia", "رتق الاثني عشر", "neonatal emergencies");
  }
}
