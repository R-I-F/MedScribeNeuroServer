import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * UROL audit — MIG-D batch 3 (tail): the two bladder-cancer-category diagnoses missed from
 * batch 1 (interstitial cystitis GC00.3 and radiation/other cystitis GC00.Y), bringing UROL
 * to exactly 100 diagnoses. Same add/link pattern; ICD-11 codes icd11_search-verified.
 */
export class AddUrolDiagnosesBatch1750000000148 implements MigrationInterface {
  name = "AddUrolDiagnosesBatch1750000000148";

  private async add(r: QueryRunner, code: string, en: string, ar: string, enD: string, arD: string, mds: string[]): Promise<void> {
    await r.query(
      `INSERT INTO "diagnoses" ("icdCode","icdName","icdArName","description","arDescription")
       VALUES ($1,$2,$3,$4,$5) ON CONFLICT ("icdCode") DO NOTHING`, [code, en, ar, enD, arD]);
    await r.query(
      `INSERT INTO "department_diagnoses" ("departmentId","diagnosisId")
       SELECT dept.id, d.id FROM "departments" dept CROSS JOIN "diagnoses" d
       WHERE dept.code = 'UROL' AND d."icdCode" = $1 ON CONFLICT DO NOTHING`, [code]);
    for (const md of mds) {
      await r.query(
        `INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
         SELECT md.id, d.id FROM "main_diags" md JOIN "departments" dept ON md."departmentId" = dept.id
         CROSS JOIN "diagnoses" d
         WHERE dept.code = 'UROL' AND md.title = $2 AND d."icdCode" = $1 ON CONFLICT DO NOTHING`, [code, md]);
    }
  }

  private async remove(r: QueryRunner, code: string): Promise<void> {
    await r.query(
      `DELETE FROM "main_diag_diagnoses" WHERE "diagnosisId" = (SELECT id FROM "diagnoses" WHERE "icdCode" = $1)
         AND "mainDiagId" IN (SELECT md.id FROM "main_diags" md JOIN "departments" d ON md."departmentId" = d.id WHERE d.code = 'UROL')`, [code]);
    await r.query(
      `DELETE FROM "department_diagnoses" WHERE "diagnosisId" = (SELECT id FROM "diagnoses" WHERE "icdCode" = $1)
         AND "departmentId" = (SELECT id FROM "departments" WHERE code = 'UROL')`, [code]);
    await r.query(
      `DELETE FROM "diagnoses" WHERE "icdCode" = $1
         AND NOT EXISTS (SELECT 1 FROM "department_diagnoses" dd WHERE dd."diagnosisId" = (SELECT id FROM "diagnoses" WHERE "icdCode" = $1))`, [code]);
  }

  public async up(q: QueryRunner): Promise<void> {
    await this.add(q, "GC00.3", "interstitial cystitis (bladder pain syndrome)", "التهاب المثانة الخلالي",
      "Chronic non-infective bladder inflammation with pelvic pain, frequency and urgency; managed with intravesical therapy, hydrodistension or cystoplasty.",
      "التهاب مثانة مزمن غير إنتاني مع ألم حوضي وتكرار وإلحاح؛ يُدبَّر بالمعالجة داخل المثانة أو التمديد المائي أو رأب المثانة.",
      ["bladder cancer"]);
    await this.add(q, "GC00.Y", "radiation / other specified cystitis", "التهاب المثانة الإشعاعي",
      "Cystitis from pelvic radiotherapy, chemical or other specified causes, producing haematuria and a contracted bladder.",
      "التهاب مثانة بسبب المعالجة الإشعاعية الحوضية أو أسباب كيميائية أو أخرى محددة، يُحدث بيلة دموية ومثانة متقفّعة.",
      ["bladder cancer"]);
  }

  public async down(q: QueryRunner): Promise<void> {
    for (const code of ["GC00.3", "GC00.Y"]) await this.remove(q, code);
  }
}
