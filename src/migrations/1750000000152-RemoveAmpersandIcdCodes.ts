import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Cross-department cleanup: remove every ICD-11 post-coordination ("&" cluster) code from the
 * `diagnoses` table so each row carries a single unique stem/leaf code. 53 rows were affected
 * (0 proc_cpts). Resolution per row, all WHO-verified via icd11_search:
 *   • KEEP (39): rename icdCode to the nearest free single leaf; the descriptive name is kept,
 *     embedding reset. Most are a plain strip-to-stem; a handful degrade to a slightly less
 *     specific but free leaf (aortoiliac→BD4Z, vertebral stenosis→BD52.2, IVC thrombosis→BD73.0,
 *     aortic arch→BD50.32, popliteal aneurysm→BD51.Z, fungal keratitis→9A7Y, FSGS→MF8Y,
 *     caecal intussusception→DB30.Y, recurrent inguinal hernia→DD5Z).
 *   • MERGE (14): the &-row duplicates an existing same-department plain row → delete the &-row.
 *     (acinar/mixed/NE-tumour pancreas, hepatolithiasis, renal-artery FMD, the 3 AAA site
 *     variants, sigmoid volvulus, thyroglossal cyst, acute maxillary sinusitis, chronic GN,
 *     acute+chronic transplant rejection.)
 *   • TOP-UP: acute/chronic transplant rejection have no separate WHO leaf (both → NE84, which is
 *     occupied), so they merge into NE84 (row renamed to its true WHO title); the TRS
 *     "immunologic rejection" category is restored to ≥5 by adding acute & chronic graft-
 *     versus-host disease (4B24.0 / 4B24.1). Sigmoid-volvulus merge also relinks the shared GS
 *     row DB30.1 to the PEDSURG "malrotation & volvulus" category so it stays ≥5.
 * Affected category counts were checked: VASC AAA 8→5, renal-artery 6→5, HBP pancreatic 10→7,
 * ENT sinusitis 6→5, PEDSURG malrotation 5→5 (relink), all remain ≥5.
 */
export class RemoveAmpersandIcdCodes1750000000152 implements MigrationInterface {
  name = "RemoveAmpersandIcdCodes1750000000152";

  // [oldCode, newCode] — rename in place, keep the row/name/links, reset embedding.
  private static KEEP: [string, string][] = [
    ["BD30.00&XA1138", "BD30.00"], ["BD30.0Y&XA38W3", "BD30.0Y"], ["BD30.1Y&XA83D6", "BD30.1Y"],
    ["BD30.20&XA44K1", "BD30.20"], ["BD40.Y&XA81N7", "BD40.Y"], ["BD40.Z&XA6Y34", "BD4Z"],
    ["BD50.3Y&XA01A6", "BD50.3Y"], ["BD50.3Z&XA5H34", "BD50.3Z"], ["BD50.3Z&XA75Z8", "BD50.32"],
    ["BD51.3&XA5D68", "BD51.3"], ["BD51.6&XA2JF3", "BD51.6"], ["BD51.6&XA44K1", "BD51.Z"],
    ["BD51.Y&XA0R02", "BD51.Y"], ["BD55&XA1XP6", "BD52.2"], ["BD71.1&XA5WA4", "BD71.1"],
    ["BD71.1&XA7UV5", "BD73.0"], ["BD74.12&XA76A3", "BD74.12"], ["2B5Y&XH9GF8", "2B5Y"],
    ["2C10.1&XH0U20", "2C10.1"], ["2F76&XA90F8", "2F76"], ["2F78&XA6KU8", "2F78"],
    ["BD90.0&XA5XT7", "BD90.0"], ["DB30.0&XA6J68", "DB30.Y"], ["DD51&XT44", "DD5Z"],
    ["9A71&XN74M", "9A71"], ["9A71&XN8AY", "9A7Y"], ["NA06.4&XA4C02", "NA06.4"],
    ["AA04&XA6ZY6", "AA04"], ["CA0K.Y&XA43C9", "CA0K.Y"], ["CA0Y&XA8D47", "CA0Y"],
    ["NA00.2&XJ1C6&XA4E71", "NA00.2"], ["NA00.3&XJ1C6", "NA00.3"], ["CA0A.Y&XA1R64", "CA0A.Y"],
    ["DA0E.0Y&XA51B7", "DA0E.0Y"], ["FA34.2&XA2SM2", "FA34.2"], ["FA34.4&XA2SM2", "FA34.4"],
    ["GB40/MF8Y&XT8W", "MF8Y"], ["GC2Z&XA6KU8", "GC2Z"], ["GB0Y&XA4D25", "GB0Y"],
  ];

  // [oldCode, EN name, AR name, [[dept, mainDiag] ...]] — delete in up(); recreate in down().
  private static MERGE: [string, string, string, [string, string][]][] = [
    ["2C10.0&XH3PG9", "acinar cell carcinoma of pancreas", "سرطانة البنكرياس العنيبية الخلايا", [["HBP", "pancreatic cancer"]]],
    ["2C10.0&XH7CY5", "mixed ductal-neuroendocrine carcinoma of pancreas", "سرطانة البنكرياس القنوية الصماوية العصبية المختلطة", [["HBP", "pancreatic cancer"]]],
    ["2C10.1&XH8DS0", "pancreatic neuroendocrine tumour", "ورم البنكرياس الصماوي العصبي", [["HBP", "pancreatic cancer"]]],
    ["DC11.4&XA4415", "hepatolithiasis with cholangitis", "حصيات داخل الكبد مع التهاب الأقنية الصفراوية", [["HBP", "biliary stricture"]]],
    ["BD41.0&XA69V9", "renal artery fibromuscular dysplasia", "خلل التنسج الليفي العضلي للشريان الكلوي", [["VASC", "renal artery disease"]]],
    ["BD50.41&XA2LN9", "ruptured infrarenal abdominal aortic aneurysm", "تمزّق أمّ دم الأبهر البطني تحت الكلوي", [["VASC", "abdominal aortic aneurysm"]]],
    ["BD50.4Z&XA2LN9", "infrarenal abdominal aortic aneurysm", "أمّ دم الأبهر البطني تحت الكلوي", [["VASC", "abdominal aortic aneurysm"]]],
    ["BD50.4Z&XA5EX6", "suprarenal abdominal aortic aneurysm", "أمّ دم الأبهر البطني فوق الكلوي", [["VASC", "abdominal aortic aneurysm"]]],
    ["DB30.1&XA8YJ9", "sigmoid volvulus", "انفتال السين", [["PEDSURG", "malrotation & volvulus"]]],
    ["DA05.Y&XA0SH3", "thyroglossal duct cyst", "كيسة القناة الدرقية اللسانية", [["ENT", "soft tissue & skin lesions"], ["PEDSURG", "soft tissue & skin lesions"]]],
    ["CA01&XA1R64", "acute maxillary sinusitis", "التهاب الجيب الفكي الحاد", [["ENT", "chronic sinusitis"]]],
    ["GB40&XT8W", "chronic glomerulonephritis", "التهاب كبيبات الكلى المزمن", [["TRS", "renal transplant"]]],
    ["NE84&XT5R", "acute rejection of transplanted organ", "الرفض الحاد للعضو المزروع", [["TRS", "immunologic rejection"]]],
    ["NE84&XT8W", "chronic rejection of transplanted organ", "الرفض المزمن للعضو المزروع", [["TRS", "immunologic rejection"]]],
  ];

  private async recode(r: QueryRunner, oldCode: string, newCode: string): Promise<void> {
    await r.query(`UPDATE "diagnoses" SET "icdCode" = $2, "embedding" = NULL WHERE "icdCode" = $1`, [oldCode, newCode]);
  }
  private async deleteRow(r: QueryRunner, code: string): Promise<void> {
    await r.query(`DELETE FROM "main_diag_diagnoses" WHERE "diagnosisId" = (SELECT id FROM "diagnoses" WHERE "icdCode" = $1)`, [code]);
    await r.query(`DELETE FROM "department_diagnoses" WHERE "diagnosisId" = (SELECT id FROM "diagnoses" WHERE "icdCode" = $1)`, [code]);
    await r.query(`DELETE FROM "diagnoses" WHERE "icdCode" = $1`, [code]);
  }
  private async addAndLink(r: QueryRunner, code: string, en: string, ar: string, links: [string, string][]): Promise<void> {
    await r.query(
      `INSERT INTO "diagnoses" ("icdCode","icdName","icdArName","description","arDescription")
       VALUES ($1,$2,$3,$4,$5) ON CONFLICT ("icdCode") DO NOTHING`, [code, en, ar, en, ar]);
    for (const [dept, md] of links) await this.link(r, dept, code, md);
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

  public async up(q: QueryRunner): Promise<void> {
    // 1) KEEP — strip/degrade to a free single leaf
    for (const [oldC, newC] of RemoveAmpersandIcdCodes1750000000152.KEEP) await this.recode(q, oldC, newC);

    // 2) MERGE — delete the duplicate &-rows
    for (const [oldC] of RemoveAmpersandIcdCodes1750000000152.MERGE) await this.deleteRow(q, oldC);

    // 3) sigmoid-volvulus merge: link the shared GS row DB30.1 into PEDSURG malrotation & volvulus
    await this.link(q, "PEDSURG", "DB30.1", "malrotation & volvulus");

    // 4) rejection merge: rename NE84 to its true WHO title, reset embedding
    await q.query(
      `UPDATE "diagnoses" SET "icdName" = 'failure or rejection of transplanted organ',
         "icdArName" = 'فشل أو رفض العضو المزروع', "embedding" = NULL WHERE "icdCode" = 'NE84'`);

    // 5) top up TRS "immunologic rejection" with acute & chronic graft-versus-host disease
    await this.addAndLink(q, "4B24.0", "acute graft-versus-host disease", "داء الطعم حيال الثوي الحاد",
      [["TRS", "immunologic rejection"]]);
    await this.addAndLink(q, "4B24.1", "chronic graft-versus-host disease", "داء الطعم حيال الثوي المزمن",
      [["TRS", "immunologic rejection"]]);
  }

  public async down(q: QueryRunner): Promise<void> {
    // reverse top-ups
    await this.deleteRow(q, "4B24.0");
    await this.deleteRow(q, "4B24.1");
    // restore NE84 name
    await q.query(
      `UPDATE "diagnoses" SET "icdName" = 'primary non-function of transplanted organ',
         "icdArName" = 'عدم الوظيفة الأولي للعضو المزروع', "embedding" = NULL WHERE "icdCode" = 'NE84'`);
    // un-link the sigmoid relink
    await q.query(
      `DELETE FROM "main_diag_diagnoses" WHERE "diagnosisId" = (SELECT id FROM "diagnoses" WHERE "icdCode" = 'DB30.1')
         AND "mainDiagId" = (SELECT md.id FROM "main_diags" md JOIN "departments" d ON md."departmentId" = d.id
                             WHERE d.code = 'PEDSURG' AND md.title = 'malrotation & volvulus')`);
    // recreate merged &-rows
    for (const [oldC, en, ar, links] of RemoveAmpersandIcdCodes1750000000152.MERGE) await this.addAndLink(q, oldC, en, ar, links);
    // reverse KEEP recodes
    for (const [oldC, newC] of RemoveAmpersandIcdCodes1750000000152.KEEP) await this.recode(q, newC, oldC);
  }
}
