import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Links the 101 PEDSURG proc_cpts (migrations 095-096) to the 15 PEDSURG main_diags, plus
 * the shared MNR 00001-00 (basic surgical step) to every category.
 *
 * Some procedures are intentionally linked to more than one main_diag (eg, BOWL resection/
 * stoma codes serve malrotation, intussusception and neonatal emergencies; 44800 serves both
 * neonatal emergencies and umbilical hernia). intussusception has 4 dept-specific procs (its
 * realistic operative set) — a documented narrow category, matching its 3-diagnosis narrowness.
 */
export class LinkPedsurgProcCptsToMainDiags1750000000097 implements MigrationInterface {
  name = "LinkPedsurgProcCptsToMainDiags1750000000097";

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
         WHERE dept.code = 'PEDSURG' AND md.title = $3
         ON CONFLICT DO NOTHING`,
        [alphaCode, numCode, mainDiagTitle]
      );
    }
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.link(queryRunner, "abdominal wall defects", [
      ["AWAL", "49600-00"], ["AWAL", "49605-00"], ["AWAL", "49606-00"], ["AWAL", "49610-00"],
      ["AWAL", "49611-00"], ["AWAL", "51940-00"], ["AWAL", "49900-00"], ["MNR", "00001-00"],
    ]);

    await this.link(queryRunner, "appendicitis", [
      ["APDX", "44970-00"], ["APDX", "44950-00"], ["APDX", "44960-00"], ["APDX", "44900-00"],
      ["APDX", "49406-00"], ["APDX", "44160-00"], ["MNR", "00001-00"],
    ]);

    await this.link(queryRunner, "congenital diaphragmatic hernia", [
      ["DIAF", "39503-00"], ["DIAF", "39540-00"], ["DIAF", "39541-00"], ["DIAF", "39545-00"],
      ["DIAF", "39561-00"], ["MNR", "00001-00"],
    ]);

    await this.link(queryRunner, "esophageal atresia", [
      ["ESOP", "43313-00"], ["ESOP", "43314-00"], ["ESOP", "43312-00"], ["ESOP", "43360-00"],
      ["ESOP", "43450-00"], ["ESOP", "43220-00"], ["MNR", "00001-00"],
    ]);

    await this.link(queryRunner, "hydrocele", [
      ["GUSX", "55040-00"], ["GUSX", "55041-00"], ["GUSX", "54640-00"], ["GUSX", "54650-00"],
      ["GUSX", "55530-00"], ["GUSX", "54600-00"], ["GUSX", "54620-00"], ["GUSX", "54322-00"],
      ["MNR", "00001-00"],
    ]);

    await this.link(queryRunner, "imperforate anus", [
      ["ANOR", "46744-00"], ["ANOR", "46742-00"], ["ANOR", "46715-00"], ["ANOR", "46705-00"],
      ["ANOR", "44320-00"], ["ANOR", "44625-00"], ["MNR", "00001-00"],
    ]);

    await this.link(queryRunner, "inguinal hernia", [
      ["HERN", "49491-00"], ["HERN", "49500-00"], ["HERN", "49505-00"], ["HERN", "49496-00"],
      ["HERN", "49650-00"], ["HERN", "49550-00"], ["MNR", "00001-00"],
    ]);

    await this.link(queryRunner, "intussusception", [
      ["BOWL", "44050-00"], ["BOWL", "44120-00"], ["BOWL", "44125-00"], ["BOWL", "44130-00"],
      ["MNR", "00001-00"],
    ]);

    await this.link(queryRunner, "malrotation & volvulus", [
      ["BOWL", "44055-00"], ["BOWL", "44050-00"], ["BOWL", "44120-00"], ["BOWL", "44125-00"],
      ["BOWL", "44130-00"], ["BOWL", "44820-00"], ["MNR", "00001-00"],
    ]);

    await this.link(queryRunner, "neonatal emergencies", [
      ["NEON", "47701-00"], ["NEON", "47715-00"], ["NEON", "47765-00"], ["NEON", "45120-00"],
      ["NEON", "45112-00"], ["NEON", "44140-00"], ["NEON", "44126-00"], ["BOWL", "44120-00"],
      ["BOWL", "44125-00"], ["BOWL", "44310-00"], ["BOWL", "44800-00"], ["MNR", "00001-00"],
    ]);

    await this.link(queryRunner, "pediatric tumor resection", [
      ["ONCO", "50230-00"], ["ONCO", "47120-00"], ["ONCO", "49215-00"], ["ONCO", "58940-00"],
      ["ONCO", "38510-00"], ["ONCO", "54530-00"], ["ONCO", "38120-00"], ["ONCO", "60540-00"],
      ["ONCO", "49186-00"], ["ONCO", "38525-00"], ["MNR", "00001-00"],
    ]);

    await this.link(queryRunner, "pyloric stenosis", [
      ["FORG", "43520-00"], ["FORG", "43280-00"], ["FORG", "43327-00"], ["FORG", "43830-00"],
      ["FORG", "43653-00"], ["FORG", "43831-00"], ["MNR", "00001-00"],
    ]);

    await this.link(queryRunner, "umbilical hernia", [
      ["HERN", "51500-00"], ["HERN", "49591-00"], ["HERN", "49592-00"], ["HERN", "49593-00"],
      ["HERN", "49613-00"], ["BOWL", "44800-00"], ["MNR", "00001-00"],
    ]);

    await this.link(queryRunner, "soft tissue & skin lesions", [
      ["SOFT", "60280-00"], ["SOFT", "42810-00"], ["SOFT", "42815-00"], ["SOFT", "38550-00"],
      ["SOFT", "11772-00"], ["SOFT", "41010-00"], ["SOFT", "10061-00"], ["SOFT", "21011-00"],
      ["SOFT", "21013-00"], ["MNR", "00001-00"],
    ]);

    await this.link(queryRunner, "thoracic & lung anomalies", [
      ["THOR", "32663-00"], ["THOR", "32480-00"], ["THOR", "32662-00"], ["THOR", "21743-00"],
      ["THOR", "21740-00"], ["THOR", "32320-00"], ["THOR", "32651-00"], ["THOR", "32551-00"],
      ["THOR", "32655-00"], ["THOR", "33800-00"], ["THOR", "38381-00"], ["THOR", "32650-00"],
      ["MNR", "00001-00"],
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // PEDSURG had no proc links before this migration — remove all proc links for PEDSURG main_diags.
    await queryRunner.query(`
      DELETE FROM "main_diag_procs"
      WHERE "mainDiagId" IN (
        SELECT md.id FROM "main_diags" md
        JOIN "departments" dept ON md."departmentId" = dept.id
        WHERE dept.code = 'PEDSURG')
    `);
  }
}
