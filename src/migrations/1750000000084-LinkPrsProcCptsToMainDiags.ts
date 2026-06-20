import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Links the 100 PRS proc_cpts (migrations 082-083) to the 12 PRS main_diags,
 * plus the shared MNR 00001-00 (basic surgical step) to every category, and four
 * pre-existing shared procs reused from other departments:
 *   BREA 19357-00 (tissue expander)      → breast reconstruction
 *   BREA 38525-00 (axillary node)        → tumor reconstruction
 *   PRPH 64856-00 (major nerve repair)   → nerve injuries
 *   PRPH 64861-00 (brachial plexus)      → nerve injuries
 */
export class LinkPrsProcCptsToMainDiags1750000000084 implements MigrationInterface {
  name = "LinkPrsProcCptsToMainDiags1750000000084";

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
         WHERE dept.code = 'PRS' AND md.title = $3
         ON CONFLICT DO NOTHING`,
        [alphaCode, numCode, mainDiagTitle]
      );
    }
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.link(queryRunner, "aesthetic surgery", [
      ["AEST", "15823-00"], ["AEST", "15822-00"], ["AEST", "15828-00"], ["AEST", "15824-00"],
      ["AEST", "30400-00"], ["AEST", "15830-00"], ["AEST", "15847-00"], ["AEST", "15877-00"],
      ["AEST", "69300-00"], ["AEST", "67904-00"], ["GRFT", "15771-00"], ["GRFT", "15770-00"],
      ["MNR", "00001-00"],
    ]);

    await this.link(queryRunner, "breast reconstruction", [
      ["BRST", "19340-00"], ["BRST", "19342-00"], ["BRST", "19361-00"], ["BRST", "19364-00"],
      ["BRST", "19367-00"], ["BRST", "19370-00"], ["BRST", "19371-00"], ["BRST", "19318-00"],
      ["BRST", "19316-00"], ["BRST", "19380-00"], ["GRFT", "15771-00"], ["GRFT", "15777-00"],
      ["FLAP", "15756-00"], ["BREA", "19357-00"], ["MNR", "00001-00"],
    ]);

    await this.link(queryRunner, "burn injuries", [
      ["BURN", "16020-00"], ["BURN", "16025-00"], ["BURN", "16030-00"], ["BURN", "16035-00"],
      ["BURN", "16036-00"], ["BURN", "15002-00"], ["BURN", "15004-00"], ["BURN", "15040-00"],
      ["BURN", "15110-00"], ["GRFT", "15100-00"], ["GRFT", "15120-00"], ["GRFT", "15050-00"],
      ["WND", "11042-00"], ["WND", "11043-00"], ["MNR", "00001-00"],
    ]);

    await this.link(queryRunner, "cleft lip & palate", [
      ["CLEF", "40700-00"], ["CLEF", "40701-00"], ["CLEF", "40720-00"], ["CLEF", "42200-00"],
      ["CLEF", "42220-00"], ["CLEF", "42225-00"], ["CLEF", "42235-00"], ["CLEF", "30460-00"],
      ["MNR", "00001-00"],
    ]);

    await this.link(queryRunner, "congenital anomalies", [
      ["HSGY", "26550-00"], ["HSGY", "26480-00"], ["AEST", "69300-00"], ["EXCN", "11646-00"],
      ["EXCN", "21015-00"], ["GRFT", "15240-00"], ["FLAP", "15740-00"], ["MNR", "00001-00"],
    ]);

    await this.link(queryRunner, "contractures", [
      ["CONT", "26123-00"], ["CONT", "26045-00"], ["CONT", "26060-00"], ["CONT", "26596-00"],
      ["CONT", "14040-00"], ["FLAP", "15734-00"], ["MNR", "00001-00"],
    ]);

    await this.link(queryRunner, "hand trauma", [
      ["HSGY", "26356-00"], ["HSGY", "26350-00"], ["HSGY", "11760-00"], ["HSGY", "26951-00"],
      ["HSGY", "20816-00"], ["HSGY", "26727-00"], ["HSGY", "26608-00"], ["HSGY", "26426-00"],
      ["MICR", "64831-00"], ["FLAP", "15740-00"], ["GRFT", "15120-00"], ["MNR", "00001-00"],
    ]);

    await this.link(queryRunner, "nerve injuries", [
      ["MICR", "64910-00"], ["MICR", "64831-00"], ["MICR", "64885-00"], ["MICR", "64892-00"],
      ["MICR", "15845-00"], ["MICR", "15842-00"], ["HSGY", "26480-00"],
      ["PRPH", "64856-00"], ["PRPH", "64861-00"], ["MNR", "00001-00"],
    ]);

    await this.link(queryRunner, "pressure ulcers", [
      ["FLAP", "15734-00"], ["FLAP", "15736-00"], ["FLAP", "15738-00"], ["WND", "11042-00"],
      ["WND", "11043-00"], ["WND", "97597-00"], ["WND", "13160-00"], ["GRFT", "15100-00"],
      ["GRFT", "15200-00"], ["GRFT", "15220-00"], ["MNR", "00001-00"],
    ]);

    await this.link(queryRunner, "scar revision", [
      ["SCRV", "14000-00"], ["SCRV", "15780-00"], ["SCRV", "15781-00"], ["SCRV", "15786-00"],
      ["SCRV", "11406-00"], ["SCRV", "13100-00"], ["GRFT", "15240-00"], ["FLAP", "15740-00"],
      ["MNR", "00001-00"],
    ]);

    await this.link(queryRunner, "traumatic lacerations & avulsions", [
      ["WND", "11042-00"], ["WND", "11043-00"], ["WND", "97597-00"], ["WND", "13160-00"],
      ["WND", "12044-00"], ["WND", "13132-00"], ["WND", "13101-00"], ["FLAP", "15757-00"],
      ["FLAP", "15758-00"], ["FLAP", "15570-00"], ["FLAP", "15650-00"], ["FLAP", "14301-00"],
      ["GRFT", "15100-00"], ["GRFT", "15120-00"], ["MICR", "64910-00"], ["MNR", "00001-00"],
    ]);

    await this.link(queryRunner, "tumor reconstruction", [
      ["EXCN", "11606-00"], ["EXCN", "11646-00"], ["EXCN", "11626-00"], ["EXCN", "17311-00"],
      ["EXCN", "38500-00"], ["EXCN", "21015-00"], ["EXCN", "21930-00"], ["EXCN", "11644-00"],
      ["FLAP", "15731-00"], ["FLAP", "15740-00"], ["GRFT", "15240-00"], ["GRFT", "15260-00"],
      ["BREA", "38525-00"], ["MNR", "00001-00"],
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // PRS had no proc links before this migration — remove all proc links for PRS main_diags.
    await queryRunner.query(`
      DELETE FROM "main_diag_procs"
      WHERE "mainDiagId" IN (
        SELECT md.id FROM "main_diags" md
        JOIN "departments" dept ON md."departmentId" = dept.id
        WHERE dept.code = 'PRS')
    `);
  }
}
