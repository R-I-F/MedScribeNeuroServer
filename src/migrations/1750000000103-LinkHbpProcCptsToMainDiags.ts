import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Links HBP proc_cpts to the 12 HBP main_diags. Covers the 75 new HBP-specific procedures
 * (LIVR/BILE/PTBD/PANC/SPLN/PORT/ERCP, migrations 101-102) AND the ~25 reused shared rows
 * owned by GS (ABDO/LAPR/BILI/PANC/ENDO/OESO — cholecystectomy, Whipple, partial hepatectomy,
 * ERCP, splenectomy, etc.), plus the shared MNR 00001-00 (basic surgical step) on every
 * category.
 *
 * Some procedures intentionally link to more than one main_diag (eg liver-resection codes
 * serve HCC, metastatic liver disease and benign lesions; Whipple serves pancreatic cancer,
 * ampullary cancer and distal cholangiocarcinoma; biliary drainage/stent codes serve
 * cholangiocarcinoma, biliary stricture and bile duct injuries). Every category has ≥5 procs.
 */
export class LinkHbpProcCptsToMainDiags1750000000103 implements MigrationInterface {
  name = "LinkHbpProcCptsToMainDiags1750000000103";

  private async link(
    runner: QueryRunner,
    mainDiagTitle: string,
    pairs: [string, string][]
  ): Promise<void> {
    for (const [alphaCode, numCode] of pairs) {
      await runner.query(
        `INSERT INTO "main_diag_procs" ("mainDiagId","procCptId")
         SELECT md.id, p.id
         FROM "main_diags" md
         JOIN "departments" dept ON md."departmentId" = dept.id
         JOIN "proc_cpts" p ON p."alphaCode" = $1 AND p."numCode" = $2
         WHERE dept.code = 'HBP' AND md.title = $3
         ON CONFLICT DO NOTHING`,
        [alphaCode, numCode, mainDiagTitle]
      );
    }
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.link(queryRunner, "acute pancreatitis", [
      ["PANC", "48000-00"], ["PANC", "48105-00"], ["PANC", "48520-00"], ["PANC", "48510-00"],
      ["PANC", "48500-00"], ["PANC", "48020-00"], ["ABDO", "49000-00"], ["ABDO", "49002-00"],
      ["ABDO", "49020-00"], ["OESO", "43246-00"], ["MNR", "00001-00"],
    ]);

    await this.link(queryRunner, "chronic pancreatitis", [
      ["PANC", "48548-00"], ["PANC", "48140-00"], ["PANC", "48146-00"], ["PANC", "48155-00"],
      ["PANC", "48160-00"], ["PANC", "48020-00"], ["ERCP", "43262-00"], ["ERCP", "43264-00"],
      ["ERCP", "43265-00"], ["MNR", "00001-00"],
    ]);

    await this.link(queryRunner, "pancreatic cancer", [
      ["PANC", "48150-00"], ["PANC", "48154-00"], ["PANC", "48140-00"], ["PANC", "48155-00"],
      ["PANC", "48160-00"], ["PANC", "48120-00"], ["PANC", "48100-00"], ["PANC", "48102-00"],
      ["LAPR", "48145-00"], ["MNR", "00001-00"],
    ]);

    await this.link(queryRunner, "ampullary cancer", [
      ["PANC", "48150-00"], ["PANC", "48154-00"], ["ERCP", "43261-00"], ["ERCP", "43262-00"],
      ["ERCP", "43264-00"], ["PTBD", "47538-00"], ["BILE", "47711-00"], ["MNR", "00001-00"],
    ]);

    await this.link(queryRunner, "benign liver lesions", [
      ["LIVR", "47000-00"], ["LIVR", "47010-00"], ["LIVR", "47011-00"], ["LIVR", "47015-00"],
      ["LIVR", "47100-00"], ["LIVR", "47125-00"], ["LIVR", "47130-00"], ["LIVR", "47350-00"],
      ["LIVR", "47360-00"], ["LIVR", "47362-00"], ["BILI", "47120-00"], ["MNR", "00001-00"],
    ]);

    await this.link(queryRunner, "hepatocellular carcinoma", [
      ["LIVR", "47122-00"], ["LIVR", "47125-00"], ["LIVR", "47130-00"], ["LIVR", "47371-00"],
      ["LIVR", "47380-00"], ["LIVR", "47381-00"], ["LIVR", "47383-00"], ["LIVR", "47135-00"],
      ["BILI", "47120-00"], ["BILI", "47382-00"], ["LAPR", "47370-00"], ["MNR", "00001-00"],
    ]);

    await this.link(queryRunner, "metastatic liver disease", [
      ["LIVR", "47122-00"], ["LIVR", "47125-00"], ["LIVR", "47130-00"], ["LIVR", "47380-00"],
      ["LIVR", "47383-00"], ["BILI", "47120-00"], ["BILI", "47382-00"], ["LAPR", "47370-00"],
      ["MNR", "00001-00"],
    ]);

    await this.link(queryRunner, "cholangiocarcinoma", [
      ["BILE", "47711-00"], ["BILE", "47712-00"], ["BILE", "47765-00"], ["BILE", "47780-00"],
      ["BILE", "47721-00"], ["BILE", "47740-00"], ["PANC", "48150-00"], ["LIVR", "47130-00"],
      ["PTBD", "47531-00"], ["PTBD", "47532-00"], ["PTBD", "47533-00"], ["PTBD", "47534-00"],
      ["PTBD", "47539-00"], ["PTBD", "47540-00"], ["PTBD", "47541-00"], ["MNR", "00001-00"],
    ]);

    await this.link(queryRunner, "cholecystitis & choledocholithiasis", [
      ["ABDO", "47600-00"], ["LAPR", "47562-00"], ["LAPR", "47563-00"], ["BILE", "47480-00"],
      ["BILE", "47605-00"], ["BILE", "47610-00"], ["BILE", "47620-00"], ["BILE", "47550-00"],
      ["BILI", "47490-00"], ["ENDO", "43260-00"], ["ERCP", "43262-00"], ["ERCP", "43264-00"],
      ["PTBD", "47544-00"], ["PTBD", "47543-00"], ["MNR", "00001-00"],
    ]);

    await this.link(queryRunner, "bile duct injuries", [
      ["BILE", "47800-00"], ["BILE", "47900-00"], ["BILE", "47780-00"], ["BILE", "47801-00"],
      ["BILI", "47760-00"], ["PTBD", "47535-00"], ["PTBD", "47540-00"], ["MNR", "00001-00"],
    ]);

    await this.link(queryRunner, "biliary stricture", [
      ["BILE", "47780-00"], ["BILE", "47800-00"], ["BILE", "47715-00"], ["BILE", "47765-00"],
      ["BILE", "47612-00"], ["BILE", "47700-00"], ["BILE", "47721-00"], ["BILE", "47740-00"],
      ["BILI", "47760-00"], ["BILI", "47720-00"], ["BILI", "43274-00"], ["PTBD", "47538-00"],
      ["PTBD", "47542-00"], ["PTBD", "47536-00"], ["PTBD", "47537-00"], ["ERCP", "43262-00"],
      ["MNR", "00001-00"],
    ]);

    await this.link(queryRunner, "liver cirrhosis & portal hypertension", [
      ["PORT", "37140-00"], ["PORT", "37160-00"], ["PORT", "37180-00"], ["PORT", "37181-00"],
      ["PORT", "37182-00"], ["PORT", "37183-00"], ["SPLN", "38101-00"], ["SPLN", "38102-00"],
      ["SPLN", "38115-00"], ["ABDO", "38100-00"], ["LAPR", "38120-00"], ["ENDO", "43244-00"],
      ["ENDO", "43255-00"], ["LIVR", "47135-00"], ["LIVR", "47133-00"], ["LIVR", "47140-00"],
      ["LIVR", "47141-00"], ["LIVR", "47142-00"], ["MNR", "00001-00"],
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // HBP had no proc links before this migration — remove all proc links for HBP main_diags.
    await queryRunner.query(`
      DELETE FROM "main_diag_procs"
      WHERE "mainDiagId" IN (
        SELECT md.id FROM "main_diags" md
        JOIN "departments" dept ON md."departmentId" = dept.id
        WHERE dept.code = 'HBP')
    `);
  }
}
