import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * SOC proc_cpts — links the 101 imported procedures (migrations 108-109) to the 16 SOC
 * main_diags, plus the shared MNR basic-step row (00001-00) to every category. Some procs
 * are linked to more than one category (eg HEPB partial hepatectomy → hepatocellular,
 * metastatic and biliary; THYR thyroidectomy → head & neck and endocrine; SKIN excisions →
 * melanoma and non-melanoma skin; AXIL sentinel-node → breast and melanoma).
 *
 * Every category receives ≥5 procedures + MNR. SOC had zero proc links before this migration,
 * so down() simply removes all SOC main_diag↔proc links.
 */
export class LinkSocProcCptsToMainDiags1750000000110 implements MigrationInterface {
  name = "LinkSocProcCptsToMainDiags1750000000110";

  private async link(runner: QueryRunner, dept: string, mainDiagTitle: string, pairs: [string, string][]): Promise<void> {
    for (const [alphaCode, numCode] of pairs) {
      await runner.query(
        `INSERT INTO "main_diag_procs" ("mainDiagId","procCptId")
         SELECT md.id, p.id FROM "main_diags" md
         JOIN "departments" dept ON md."departmentId" = dept.id
         JOIN "proc_cpts" p ON p."alphaCode" = $1 AND p."numCode" = $2
         WHERE dept.code = $3 AND md.title = $4
         ON CONFLICT DO NOTHING`,
        [alphaCode, numCode, dept, mainDiagTitle]);
    }
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    const MNR: [string, string] = ["MNR", "00001-00"];

    await this.link(queryRunner, "SOC", "breast cancer", [
      ["BRST", "19301-00"], ["BRST", "19302-00"], ["BRST", "19303-00"], ["BRST", "19305-00"],
      ["BRST", "19307-00"], ["BRST", "19120-00"], ["BRST", "19125-00"],
      ["AXIL", "38525-00"], ["AXIL", "38740-00"], ["AXIL", "38745-00"], ["AXIL", "38792-00"], ["AXIL", "38900-00"],
      MNR,
    ]);
    await this.link(queryRunner, "SOC", "colorectal cancer", [
      ["COLR", "44140-00"], ["COLR", "44141-00"], ["COLR", "44143-00"], ["COLR", "44150-00"],
      ["COLR", "44160-00"], ["COLR", "45110-00"], ["COLR", "45112-00"], ["COLR", "45395-00"],
      ["COLR", "45126-00"], ["COLR", "44204-00"], ["COLR", "45171-00"], ["COLR", "45172-00"],
      MNR,
    ]);
    await this.link(queryRunner, "SOC", "gastric cancer", [
      ["GAST", "43620-00"], ["GAST", "43621-00"], ["GAST", "43631-00"], ["GAST", "43632-00"], ["GAST", "43633-00"],
      ["ESOG", "43107-00"], ["ESOG", "43117-00"], ["ESOG", "43124-00"],
      MNR,
    ]);
    await this.link(queryRunner, "SOC", "head & neck cancer", [
      ["HNCK", "38720-00"], ["HNCK", "38724-00"], ["HNCK", "41135-00"], ["HNCK", "41145-00"],
      ["HNCK", "42420-00"], ["HNCK", "42415-00"], ["HNCK", "31360-00"], ["HNCK", "31365-00"], ["HNCK", "40530-00"],
      ["THYR", "60240-00"], ["THYR", "60252-00"], ["THYR", "60254-00"], ["THYR", "60220-00"], ["THYR", "60260-00"],
      MNR,
    ]);
    await this.link(queryRunner, "SOC", "hepatocellular carcinoma", [
      ["HEPB", "47120-00"], ["HEPB", "47122-00"], ["HEPB", "47130-00"], ["HEPB", "47100-00"], ["HEPB", "47370-00"],
      MNR,
    ]);
    await this.link(queryRunner, "SOC", "melanoma", [
      ["SKIN", "11606-00"], ["SKIN", "11626-00"], ["SKIN", "11646-00"], ["SKIN", "11604-00"], ["SKIN", "11644-00"],
      ["AXIL", "38792-00"], ["AXIL", "38900-00"], ["AXIL", "38525-00"],
      MNR,
    ]);
    await this.link(queryRunner, "SOC", "metastatic disease", [
      ["METS", "32505-00"], ["METS", "49255-00"], ["METS", "96446-00"],
      ["HEPB", "47120-00"], ["NEPH", "38770-00"],
      MNR,
    ]);
    await this.link(queryRunner, "SOC", "non-melanoma skin cancer", [
      ["SKIN", "11606-00"], ["SKIN", "11626-00"], ["SKIN", "11646-00"], ["SKIN", "11604-00"], ["SKIN", "11644-00"],
      MNR,
    ]);
    await this.link(queryRunner, "SOC", "ovarian cancer", [
      ["OVRY", "58950-00"], ["OVRY", "58951-00"], ["OVRY", "58953-00"], ["OVRY", "58954-00"], ["OVRY", "58960-00"],
      MNR,
    ]);
    await this.link(queryRunner, "SOC", "pancreatic cancer", [
      ["PANC", "48150-00"], ["PANC", "48153-00"], ["PANC", "48140-00"], ["PANC", "48145-00"], ["PANC", "48155-00"], ["PANC", "48120-00"],
      MNR,
    ]);
    await this.link(queryRunner, "SOC", "soft tissue sarcoma", [
      ["SARC", "49186-00"], ["SARC", "49187-00"], ["SARC", "49190-00"], ["SARC", "27329-00"], ["SARC", "22904-00"],
      MNR,
    ]);
    await this.link(queryRunner, "SOC", "surgical lymphoma", [
      ["LYMP", "38120-00"], ["LYMP", "38100-00"], ["LYMP", "38510-00"], ["LYMP", "38530-00"], ["AXIL", "38525-00"],
      MNR,
    ]);
    await this.link(queryRunner, "SOC", "genitourinary cancer", [
      ["NEPH", "50230-00"], ["NEPH", "50240-00"], ["NEPH", "51570-00"], ["NEPH", "51590-00"], ["NEPH", "55840-00"],
      ["NEPH", "54530-00"], ["NEPH", "54130-00"], ["NEPH", "38770-00"], ["NEPH", "38780-00"],
      MNR,
    ]);
    await this.link(queryRunner, "SOC", "endocrine & adrenal tumours", [
      ["ADRN", "60540-00"], ["ADRN", "60545-00"], ["ADRN", "60650-00"],
      ["THYR", "60500-00"], ["THYR", "60240-00"], ["THYR", "60254-00"],
      MNR,
    ]);
    await this.link(queryRunner, "SOC", "gynaecological cancer", [
      ["HYST", "58210-00"], ["HYST", "58200-00"], ["HYST", "58240-00"], ["HYST", "56631-00"], ["HYST", "56633-00"], ["HYST", "57110-00"],
      MNR,
    ]);
    await this.link(queryRunner, "SOC", "biliary tract & gallbladder cancer", [
      ["BILI", "47711-00"], ["BILI", "47712-00"], ["BILI", "47765-00"],
      ["PANC", "48150-00"], ["HEPB", "47120-00"],
      MNR,
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // SOC had zero proc links before this migration — remove all SOC main_diag↔proc links.
    await queryRunner.query(`
      DELETE FROM "main_diag_procs"
      WHERE "mainDiagId" IN (
        SELECT md.id FROM "main_diags" md JOIN "departments" d ON md."departmentId" = d.id WHERE d.code = 'SOC'
      )
    `);
  }
}
