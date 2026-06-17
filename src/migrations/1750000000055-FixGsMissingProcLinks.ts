import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Links 3 GS proc_cpts that were inserted in MIG-053 but not linked
 * to any main_diag in MIG-054:
 *   ABDO 44800-00 (Meckel's diverticulectomy)   → bowel obstruction, acute abdomen
 *   ENDO 45330-00 (flexible sigmoidoscopy)       → colorectal polyps & masses
 *   COLO 46020-00 (seton for anal fistula)       → acute abdomen
 */
export class FixGsMissingProcLinks1750000000055 implements MigrationInterface {
  name = "FixGsMissingProcLinks1750000000055";

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
         WHERE dept.code = 'GS' AND md.title = $3
         ON CONFLICT DO NOTHING`,
        [alphaCode, numCode, mainDiagTitle]
      );
    }
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.link(queryRunner, "bowel obstruction", [
      ["ABDO", "44800-00"], // Meckel's diverticulectomy
    ]);
    await this.link(queryRunner, "acute abdomen", [
      ["ABDO", "44800-00"], // Meckel's diverticulectomy (can present as intussusception/obstruction)
      ["COLO", "46020-00"], // seton placement for complex anal fistula
    ]);
    await this.link(queryRunner, "colorectal polyps & masses", [
      ["ENDO", "45330-00"], // flexible sigmoidoscopy
    ]);
    await this.link(queryRunner, "diverticulitis", [
      ["ENDO", "45330-00"], // flexible sigmoidoscopy
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "main_diag_procs"
      WHERE "procCptId" IN (
        SELECT id FROM "proc_cpts"
        WHERE ("alphaCode" = 'ABDO' AND "numCode" = '44800-00')
           OR ("alphaCode" = 'ENDO' AND "numCode" = '45330-00')
           OR ("alphaCode" = 'COLO' AND "numCode" = '46020-00')
      )
      AND "mainDiagId" IN (
        SELECT md.id FROM "main_diags" md
        JOIN "departments" dept ON md."departmentId" = dept.id
        WHERE dept.code = 'GS'
      )
    `);
  }
}
