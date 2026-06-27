import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * OBGYN proc_cpts — links the 18 imported procedures that migration 130 did not yet attach to
 * a main_diag (additional HYST hysterectomy variants, HYSC hysteroscopy procedures, ADNX tubal
 * sterilization, and CERV cervical biopsy/colposcopy codes) so that no imported OBGYN proc is
 * orphaned from a category. Adds links only; inserts nothing.
 */
export class LinkObgynExtraProcs1750000000131 implements MigrationInterface {
  name = "LinkObgynExtraProcs1750000000131";

  private async link(runner: QueryRunner, dept: string, mainDiagTitle: string, pairs: [string, string][]): Promise<void> {
    for (const [alphaCode, numCode] of pairs) {
      await runner.query(
        `INSERT INTO "main_diag_procs" ("mainDiagId","procCptId")
         SELECT md.id, p.id FROM "main_diags" md
         JOIN "departments" dept ON md."departmentId" = dept.id
         JOIN "proc_cpts" p ON p."alphaCode" = $1 AND p."numCode" = $2
         WHERE dept.code = $3 AND md.title = $4 ON CONFLICT DO NOTHING`,
        [alphaCode, numCode, dept, mainDiagTitle]);
    }
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.link(queryRunner, "OBGYN", "uterine fibroids", [
      ["HYST", "58180-00"], ["HYST", "58541-00"], ["HYST", "58542-00"], ["HYST", "58550-00"], ["HYST", "58571-00"],
      ["HYSC", "58559-00"], ["HYSC", "58560-00"], ["HYSC", "58562-00"],
    ]);
    await this.link(queryRunner, "OBGYN", "uterine prolapse", [
      ["HYST", "58180-00"], ["HYST", "58291-00"], ["HYST", "58550-00"], ["HYST", "58552-00"],
    ]);
    await this.link(queryRunner, "OBGYN", "gynecologic cancer", [
      ["HYST", "58291-00"], ["HYST", "58571-00"],
      ["CERV", "57500-00"], ["CERV", "57505-00"], ["CERV", "57510-00"], ["CERV", "57461-00"], ["CERV", "57460-00"],
    ]);
    await this.link(queryRunner, "OBGYN", "ovarian cysts & masses", [
      ["HYST", "58542-00"], ["HYST", "58552-00"],
    ]);
    await this.link(queryRunner, "OBGYN", "pelvic mass", [
      ["HYST", "58291-00"], ["ADNX", "58670-00"], ["ADNX", "58671-00"],
    ]);
    await this.link(queryRunner, "OBGYN", "ectopic pregnancy", [
      ["ADNX", "58670-00"], ["ADNX", "58671-00"],
    ]);
    await this.link(queryRunner, "OBGYN", "miscarriage", [
      ["HYSC", "58560-00"],
    ]);
    await this.link(queryRunner, "OBGYN", "vaginal delivery complications", [
      ["HYSC", "58565-00"],
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const extras: [string, string][] = [
      ["HYST", "58180-00"], ["HYST", "58291-00"], ["HYST", "58541-00"], ["HYST", "58542-00"], ["HYST", "58550-00"],
      ["HYST", "58552-00"], ["HYST", "58571-00"], ["HYSC", "58559-00"], ["HYSC", "58560-00"], ["HYSC", "58562-00"],
      ["HYSC", "58565-00"], ["ADNX", "58670-00"], ["ADNX", "58671-00"], ["CERV", "57500-00"], ["CERV", "57505-00"],
      ["CERV", "57510-00"], ["CERV", "57461-00"], ["CERV", "57460-00"],
    ];
    for (const [alphaCode, numCode] of extras) {
      await queryRunner.query(
        `DELETE FROM "main_diag_procs"
         WHERE "mainDiagId" IN (SELECT md.id FROM "main_diags" md JOIN "departments" d ON md."departmentId" = d.id WHERE d.code = 'OBGYN')
           AND "procCptId" = (SELECT id FROM "proc_cpts" WHERE "alphaCode" = $1 AND "numCode" = $2)`,
        [alphaCode, numCode]);
    }
  }
}
