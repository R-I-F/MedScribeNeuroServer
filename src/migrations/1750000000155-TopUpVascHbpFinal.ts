import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Final +1 each for VASC and HBP. In migration 154 two chosen codes were already present
 * (8B22.A existed in VASC as the subclavian-stenosis row; DC12.0Y existed in HBP as empyema of
 * gallbladder), so each department reached 99 instead of 100. This adds one more genuinely-new,
 * ICD-11-verified leaf to each to restore the 100 floor.
 */
export class TopUpVascHbpFinal1750000000155 implements MigrationInterface {
  name = "TopUpVascHbpFinal1750000000155";

  private async add(r: QueryRunner, dept: string, code: string, en: string, ar: string, enD: string, arD: string, md: string): Promise<void> {
    await r.query(
      `INSERT INTO "diagnoses" ("icdCode","icdName","icdArName","description","arDescription")
       VALUES ($1,$2,$3,$4,$5) ON CONFLICT ("icdCode") DO NOTHING`, [code, en, ar, enD, arD]);
    await r.query(
      `INSERT INTO "department_diagnoses" ("departmentId","diagnosisId")
       SELECT dept.id, d.id FROM "departments" dept CROSS JOIN "diagnoses" d
       WHERE dept.code = $1 AND d."icdCode" = $2 ON CONFLICT DO NOTHING`, [dept, code]);
    await r.query(
      `INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
       SELECT md.id, d.id FROM "main_diags" md JOIN "departments" dept ON md."departmentId" = dept.id
       CROSS JOIN "diagnoses" d WHERE dept.code = $1 AND md.title = $3 AND d."icdCode" = $2 ON CONFLICT DO NOTHING`,
      [dept, code, md]);
  }
  private async remove(r: QueryRunner, code: string): Promise<void> {
    await r.query(`DELETE FROM "main_diag_diagnoses" WHERE "diagnosisId" = (SELECT id FROM "diagnoses" WHERE "icdCode" = $1)`, [code]);
    await r.query(`DELETE FROM "department_diagnoses" WHERE "diagnosisId" = (SELECT id FROM "diagnoses" WHERE "icdCode" = $1)`, [code]);
    await r.query(`DELETE FROM "diagnoses" WHERE "icdCode" = $1`, [code]);
  }

  public async up(q: QueryRunner): Promise<void> {
    await this.add(q, "VASC", "4A44.A0", "microscopic polyangiitis", "التهاب الأوعية المتعدد المجهري",
      "ANCA-associated necrotising small-vessel vasculitis without granulomas, causing pulmonary-renal syndrome and occasional digital ischaemia.",
      "التهاب أوعية ناخر صغير الأوعية مرتبط بأضداد ANCA دون أورام حُبيبية، يسبب متلازمة رئوية كلوية وإقفاراً إصبعياً أحياناً.", "peripheral artery disease");
    await this.add(q, "HBP", "DC12.00", "acute on chronic cholecystitis", "التهاب المرارة الحاد على مزمن",
      "Acute inflammatory exacerbation superimposed on a chronically scarred gallbladder; the commonest pattern at cholecystectomy.",
      "تفاقم التهابي حاد فوق مرارة متندّبة مزمناً؛ أشيع نمط يُشاهَد عند استئصال المرارة.", "cholecystitis & choledocholithiasis");
  }

  public async down(q: QueryRunner): Promise<void> {
    await this.remove(q, "4A44.A0");
    await this.remove(q, "DC12.00");
  }
}
