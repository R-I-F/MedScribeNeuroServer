import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Links all ORTHO proc_cpts (migrations 074-075) to the 17 ORTHO main_diags,
 * plus the shared MNR 00001-00 (basic surgical step) to every category.
 */
export class LinkOrthoProcCptsToMainDiags1750000000076 implements MigrationInterface {
  name = "LinkOrthoProcCptsToMainDiags1750000000076";

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
         WHERE dept.code = 'ORTHO' AND md.title = $3
         ON CONFLICT DO NOTHING`,
        [alphaCode, numCode, mainDiagTitle]
      );
    }
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.link(queryRunner, "anterior cruciate ligament injury", [
      ["SCOP", "29888-00"], ["SCOP", "29889-00"], ["SCOP", "29882-00"],
      ["SOFT", "27427-00"], ["SOFT", "27380-00"], ["SCOP", "29870-00"], ["MNR", "00001-00"],
    ]);

    await this.link(queryRunner, "carpal tunnel syndrome", [
      ["HAND", "64721-00"], ["HAND", "29848-00"], ["MNR", "00001-00"],
    ]);

    await this.link(queryRunner, "fractures (lower extremity)", [
      ["FIXN", "27236-00"], ["FIXN", "27244-00"], ["FIXN", "27245-00"], ["FIXN", "27506-00"],
      ["FIXN", "27535-00"], ["FIXN", "27759-00"], ["FIXN", "27814-00"], ["FIXN", "27792-00"],
      ["FIXN", "28415-00"], ["FIXN", "28445-00"], ["ARTH", "27125-00"], ["FIXN", "20690-00"],
      ["FIXN", "11010-00"], ["FIXN", "20680-00"], ["MNR", "00001-00"],
    ]);

    await this.link(queryRunner, "fractures (spine)", [
      ["SPIN", "22514-00"], ["SPIN", "22524-00"], ["SPIN", "22842-00"],
      ["SPIN", "22612-00"], ["SPIN", "22206-00"], ["MNR", "00001-00"],
    ]);

    await this.link(queryRunner, "fractures (upper extremity)", [
      ["FIXN", "23615-00"], ["FIXN", "24515-00"], ["FIXN", "24546-00"], ["FIXN", "24685-00"],
      ["FIXN", "25609-00"], ["FIXN", "25628-00"], ["FIXN", "23515-00"], ["FIXN", "26615-00"],
      ["ARTH", "23470-00"], ["FIXN", "20690-00"], ["MNR", "00001-00"],
    ]);

    await this.link(queryRunner, "meniscal tears", [
      ["SCOP", "29881-00"], ["SCOP", "29880-00"], ["SCOP", "29882-00"],
      ["SCOP", "29870-00"], ["SCOP", "29877-00"], ["MNR", "00001-00"],
    ]);

    await this.link(queryRunner, "osteoarthritis", [
      ["ARTH", "27447-00"], ["ARTH", "27446-00"], ["ARTH", "27130-00"], ["ARTH", "23472-00"],
      ["ARTH", "27702-00"], ["ARTH", "24363-00"], ["OSTE", "27457-00"], ["FOOT", "27870-00"],
      ["MNR", "00001-00"],
    ]);

    await this.link(queryRunner, "osteomyelitis & septic joint", [
      ["INFX", "27303-00"], ["INFX", "27310-00"], ["INFX", "23040-00"],
      ["INFX", "27030-00"], ["INFX", "11044-00"], ["MNR", "00001-00"],
    ]);

    await this.link(queryRunner, "osteonecrosis", [
      ["ARTH", "27130-00"], ["ARTH", "27125-00"], ["ARTH", "23472-00"],
      ["ARTH", "27447-00"], ["OSTE", "27165-00"], ["MNR", "00001-00"],
    ]);

    await this.link(queryRunner, "pathologic fractures", [
      ["FIXN", "27187-00"], ["FIXN", "27245-00"], ["FIXN", "27506-00"], ["FIXN", "23615-00"],
      ["SPIN", "22524-00"], ["TUMR", "20245-00"], ["MNR", "00001-00"],
    ]);

    await this.link(queryRunner, "rotator cuff pathology", [
      ["SCOP", "29827-00"], ["SCOP", "29826-00"], ["SOFT", "23410-00"],
      ["SOFT", "23412-00"], ["SOFT", "23430-00"], ["SOFT", "23700-00"], ["MNR", "00001-00"],
    ]);

    await this.link(queryRunner, "spinal stenosis", [
      ["SPIN", "63047-00"], ["SPIN", "63030-00"], ["SPIN", "22551-00"],
      ["SPIN", "63045-00"], ["SPIN", "22612-00"], ["MNR", "00001-00"],
    ]);

    await this.link(queryRunner, "spondylolisthesis", [
      ["SPIN", "22612-00"], ["SPIN", "22630-00"], ["SPIN", "22842-00"],
      ["SPIN", "63047-00"], ["SPIN", "22206-00"], ["MNR", "00001-00"],
    ]);

    await this.link(queryRunner, "bone tumours", [
      ["TUMR", "20225-00"], ["TUMR", "20245-00"], ["TUMR", "27365-00"],
      ["TUMR", "23220-00"], ["TUMR", "27355-00"], ["TUMR", "27065-00"], ["MNR", "00001-00"],
    ]);

    await this.link(queryRunner, "foot & ankle disorders", [
      ["FOOT", "28296-00"], ["FOOT", "28285-00"], ["FOOT", "27650-00"], ["FOOT", "28060-00"],
      ["FOOT", "28080-00"], ["FOOT", "27870-00"], ["FOOT", "28715-00"], ["FOOT", "28300-00"],
      ["SCOP", "29891-00"], ["MNR", "00001-00"],
    ]);

    await this.link(queryRunner, "hand & wrist disorders", [
      ["HAND", "64721-00"], ["HAND", "64718-00"], ["HAND", "26055-00"], ["HAND", "25000-00"],
      ["HAND", "26121-00"], ["HAND", "25111-00"], ["HAND", "26418-00"], ["HAND", "29848-00"],
      ["MNR", "00001-00"],
    ]);

    await this.link(queryRunner, "paediatric & developmental conditions", [
      ["PEDS", "27176-00"], ["PEDS", "27257-00"], ["PEDS", "27258-00"], ["PEDS", "27606-00"],
      ["PEDS", "29450-00"], ["PEDS", "27485-00"], ["SPIN", "22802-00"], ["OSTE", "27146-00"],
      ["MNR", "00001-00"],
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ORTHO had no proc links before this migration, so remove all proc links
    // for ORTHO main_diags (covers dept-specific groups and the shared MNR).
    await queryRunner.query(`
      DELETE FROM "main_diag_procs"
      WHERE "mainDiagId" IN (
        SELECT md.id FROM "main_diags" md
        JOIN "departments" dept ON md."departmentId" = dept.id
        WHERE dept.code = 'ORTHO')
    `);
  }
}
