import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * HBP audit — MIG-A: fixes the heavily-corrupted ICD-11 codes (14 of 27 were wrong, ~52%).
 * The HBP seed used fabricated sequential codes in the DA9x/DB0x/DC0x/DC1x ranges (e.g.
 * hepatic haemangioma as DA95.0, FNH as DA96.0, HCC as DA92.0, portal hypertension in the
 * metabolic chapter 5C81.0).
 *
 * Three classes of fix (ordering matters — unique icdCode constraint):
 *  1. FREE RECODES (in-place UPDATE) — target code unused; junctions (incl. shared SOC links
 *     on DB00.0/DB01.1) are preserved automatically.
 *  2. MERGES — delete the HBP wrong row and link HBP to an existing shared row (GS-owned).
 *     DA92.0 (HCC) is shared HBP+SOC, so both dept links are re-pointed to GS's 2C12.02
 *     (cross-dept merge, like the VASC ESRD fix).
 *  3. ORPHAN DELETE — DA20.3 (perforation of oesophagus) is out of HBP scope (foregut/
 *     thoracic emergency); remove it.
 *
 * Also relinks the pancreatic-pseudocyst row (DB01.0 → GS DC30.1) from the mis-filed
 * "benign liver lesions" to "acute pancreatitis".
 *
 * Every changed/recoded row gets embedding = NULL so the backfill re-embeds it.
 * All target codes verified via icd11_search (see MEDICAL_CODE_AUDITS/HBP/AUDIT_HBP.md).
 */
export class FixHbpIcdCodes1750000000098 implements MigrationInterface {
  name = "FixHbpIcdCodes1750000000098";

  /** Recode a row in place (code + names) and null its embedding. */
  private async recode(r: QueryRunner, oldCode: string, newCode: string, name: string, arName: string): Promise<void> {
    await r.query(
      `UPDATE "diagnoses" SET "icdCode" = $2, "icdName" = $3, "icdArName" = $4, "embedding" = NULL WHERE "icdCode" = $1`,
      [oldCode, newCode, name, arName]);
  }

  /** Delete an HBP-specific (corrupted) diagnosis row and all its junctions (any dept). */
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
    // ── 1. FREE RECODES (in-place UPDATE; preserve junctions incl. shared SOC) ──────
    await this.recode(queryRunner, "DA95.0", "2E81.0Y", "haemangioma of liver", "ورم وعائي كبدي");
    await this.recode(queryRunner, "DA96.0", "DB99.Y", "focal nodular hyperplasia of liver", "فرط التنسج العقدي البؤري للكبد");
    await this.recode(queryRunner, "DC15.0", "DC10.02", "stricture of bile duct", "تضيق القناة الصفراوية");
    await this.recode(queryRunner, "DA9B.0", "2C12.10", "intrahepatic cholangiocarcinoma", "سرطانة الأقنية الصفراوية داخل الكبد");
    await this.recode(queryRunner, "5C81.0", "DB98.7Z", "portal hypertension", "ارتفاع ضغط الوريد البابي");
    await this.recode(queryRunner, "DA93.Z", "2D80.0", "malignant neoplasm metastasis in liver", "ورم خبيث ثانوي (نقيلي) في الكبد");
    await this.recode(queryRunner, "DB00.0", "2C10.Z", "malignant neoplasm of pancreas (exocrine carcinoma)", "ورم خبيث في البنكرياس (سرطانة خارجية الإفراز)");
    await this.recode(queryRunner, "DB01.1", "2E92.8", "intraductal papillary mucinous neoplasm of pancreas", "ورم مخاطي حليمي داخل القناة البنكرياسية");

    // ── 2. MERGES into existing shared rows (GS-owned) ─────────────────────────────
    await this.deleteRow(queryRunner, "DA97.0");                       // hydatid cyst → GS 1F73.0
    await this.link(queryRunner, "HBP", "1F73.0", "benign liver lesions");
    await this.deleteRow(queryRunner, "DB01.0");                       // pancreatic pseudocyst → GS DC30.1 (relink to acute pancreatitis)
    await this.link(queryRunner, "HBP", "DC30.1", "acute pancreatitis");
    await this.deleteRow(queryRunner, "DC00.0");                       // liver abscess → GS DB90.0
    await this.link(queryRunner, "HBP", "DB90.0", "benign liver lesions");
    await this.deleteRow(queryRunner, "DC13.0");                       // acute cholangitis → GS DC13
    await this.link(queryRunner, "HBP", "DC13", "cholecystitis & choledocholithiasis");
    await this.deleteRow(queryRunner, "DC14.1");                       // choledocholithiasis → GS DC11.6
    await this.link(queryRunner, "HBP", "DC11.6", "cholecystitis & choledocholithiasis");
    await this.deleteRow(queryRunner, "DA26.0");                       // oesophageal varices → GS DA26.0Z
    await this.link(queryRunner, "HBP", "DA26.0Z", "liver cirrhosis & portal hypertension");

    // ── 3. CROSS-DEPT MERGE: HCC DA92.0 → GS 2C12.02 (HBP + SOC) ────────────────────
    await this.deleteRow(queryRunner, "DA92.0");
    await this.link(queryRunner, "HBP", "2C12.02", "hepatocellular carcinoma");
    await this.link(queryRunner, "SOC", "2C12.02", "hepatocellular carcinoma");

    // ── 4. ORPHAN DELETE: out-of-scope foregut/thoracic emergency ──────────────────
    await this.deleteRow(queryRunner, "DA20.3");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recreate a previously-deleted HBP row and relink dept(s) + main_diag.
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
    // Unlink a dept (+ its main_diag link) from a shared row.
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

    // 4. orphan
    await recreate("DA20.3", "rupture or perforation of oesophagus", "تمزق أو انثقاب المريء", [["HBP", null]]);
    // 3. HCC cross-dept merge
    await unlink("HBP", "2C12.02", "hepatocellular carcinoma");
    await unlink("SOC", "2C12.02", "hepatocellular carcinoma");
    await recreate("DA92.0", "hepatocellular carcinoma", "سرطانة الخلايا الكبدية", [["HBP", "hepatocellular carcinoma"], ["SOC", "hepatocellular carcinoma"]]);
    // 2. merges
    await unlink("HBP", "DA26.0Z", "liver cirrhosis & portal hypertension");
    await recreate("DA26.0", "oesophageal varices", "دوالي المريء", [["HBP", "liver cirrhosis & portal hypertension"]]);
    await unlink("HBP", "DC11.6", "cholecystitis & choledocholithiasis");
    await recreate("DC14.1", "choledocholithiasis", "حصوات القناة الصفراوية المشتركة", [["HBP", "cholecystitis & choledocholithiasis"]]);
    await unlink("HBP", "DC13", "cholecystitis & choledocholithiasis");
    await recreate("DC13.0", "acute cholangitis", "التهاب الأقنية الصفراوية الحاد", [["HBP", "cholecystitis & choledocholithiasis"]]);
    await unlink("HBP", "DB90.0", "benign liver lesions");
    await recreate("DC00.0", "liver abscess", "خراج الكبد", [["HBP", "benign liver lesions"]]);
    await unlink("HBP", "DC30.1", "acute pancreatitis");
    await recreate("DB01.0", "pancreatic pseudocyst", "كيسة كاذبة للبنكرياس", [["HBP", "benign liver lesions"]]);
    await unlink("HBP", "1F73.0", "benign liver lesions");
    await recreate("DA97.0", "hydatid cyst of liver", "كيسة مائية كبدية", [["HBP", "benign liver lesions"]]);
    // 1. reverse free recodes
    await this.recode(queryRunner, "2E92.8", "DB01.1", "intraductal papillary mucinous neoplasm of pancreas", "ورم مخاطي حليمي داخل القناة البنكرياسية");
    await this.recode(queryRunner, "2C10.Z", "DB00.0", "exocrine pancreatic carcinoma", "سرطانة البنكرياس الخارجية الإفراز");
    await this.recode(queryRunner, "2D80.0", "DA93.Z", "secondary malignant neoplasm of liver", "ورم خبيث ثانوي في الكبد");
    await this.recode(queryRunner, "DB98.7Z", "5C81.0", "portal hypertension", "ارتفاع ضغط الوريد البابي");
    await this.recode(queryRunner, "2C12.10", "DA9B.0", "intrahepatic cholangiocarcinoma", "سرطانة الأقنية الصفراوية داخل الكبد");
    await this.recode(queryRunner, "DC10.02", "DC15.0", "biliary stricture", "تضيق الأقنية الصفراوية");
    await this.recode(queryRunner, "DB99.Y", "DA96.0", "focal nodular hyperplasia of liver", "فرط التنسج العقدي البؤري للكبد");
    await this.recode(queryRunner, "2E81.0Y", "DA95.0", "hepatic haemangioma", "ورم وعائي كبدي");
  }
}
