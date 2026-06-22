import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Links the 114 VASC proc_cpts (migrations 088-089) to the 12 VASC main_diags, plus the
 * shared MNR 00001-00 (basic surgical step) to every category.
 *
 * Some procedures are intentionally linked to more than one main_diag where they serve
 * both (eg, TEVAR 33880/33881 → thoracic aortic aneurysm + aortic dissection; arch/root
 * grafts 33863/33871 → dissection + TAA; embolectomies 34101/34151 → their territory +
 * peripheral artery disease; venous embolization 37241 → AVF + varicose veins).
 */
export class LinkVascProcCptsToMainDiags1750000000090 implements MigrationInterface {
  name = "LinkVascProcCptsToMainDiags1750000000090";

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
         WHERE dept.code = 'VASC' AND md.title = $3
         ON CONFLICT DO NOTHING`,
        [alphaCode, numCode, mainDiagTitle]
      );
    }
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.link(queryRunner, "abdominal aortic aneurysm", [
      ["AORT", "35081-00"], ["AORT", "35082-00"], ["AORT", "35091-00"], ["AORT", "35102-00"],
      ["AORT", "35103-00"], ["EVAR", "34701-00"], ["EVAR", "34702-00"], ["EVAR", "34703-00"],
      ["EVAR", "34705-00"], ["EVAR", "34841-00"], ["EVAR", "34845-00"], ["MNR", "00001-00"],
    ]);

    await this.link(queryRunner, "aortic dissection", [
      ["AORT", "33858-00"], ["AORT", "33863-00"], ["AORT", "33871-00"], ["EVAR", "33880-00"],
      ["EVAR", "33881-00"], ["MNR", "00001-00"],
    ]);

    await this.link(queryRunner, "arterial trauma", [
      ["TRMA", "35206-00"], ["TRMA", "35226-00"], ["TRMA", "35236-00"], ["TRMA", "35256-00"],
      ["TRMA", "35266-00"], ["TRMA", "35286-00"], ["TRMA", "35201-00"], ["TRMA", "35211-00"],
      ["TRMA", "35221-00"], ["THRM", "34101-00"], ["MNR", "00001-00"],
    ]);

    await this.link(queryRunner, "arteriovenous fistula", [
      ["AVFR", "35182-00"], ["AVFR", "35184-00"], ["AVFR", "35188-00"], ["AVFR", "35189-00"],
      ["AVFR", "37242-00"], ["AVFR", "37241-00"], ["MNR", "00001-00"],
    ]);

    await this.link(queryRunner, "carotid artery disease", [
      ["ENDA", "35301-00"], ["ENDO", "37215-00"], ["ENDO", "37216-00"], ["BYPS", "35606-00"],
      ["PERA", "35001-00"], ["PERA", "60600-00"], ["MNR", "00001-00"],
    ]);

    await this.link(queryRunner, "peripheral aneurysms", [
      ["PERA", "35141-00"], ["PERA", "35151-00"], ["PERA", "35131-00"], ["PERA", "35121-00"],
      ["PERA", "35045-00"], ["EVAR", "34707-00"], ["MNR", "00001-00"],
    ]);

    await this.link(queryRunner, "peripheral artery disease", [
      ["ENDO", "37254-00"], ["ENDO", "37256-00"], ["ENDO", "37258-00"], ["ENDO", "37260-00"],
      ["ENDO", "37263-00"], ["ENDO", "37265-00"], ["ENDO", "37267-00"], ["ENDO", "37269-00"],
      ["ENDO", "37271-00"], ["ENDO", "37273-00"], ["ENDO", "37280-00"], ["ENDO", "37296-00"],
      ["BYPS", "35646-00"], ["BYPS", "35647-00"], ["BYPS", "35621-00"], ["BYPS", "35556-00"],
      ["BYPS", "35656-00"], ["BYPS", "35566-00"], ["BYPS", "35571-00"], ["BYPS", "35661-00"],
      ["ENDA", "35371-00"], ["ENDA", "35372-00"], ["ENDA", "35351-00"], ["ENDA", "35331-00"],
      ["THRM", "34201-00"], ["THRM", "34203-00"], ["THRM", "34101-00"], ["THRM", "34151-00"],
      ["THRM", "37184-00"], ["THRM", "37211-00"], ["AMPU", "27590-00"], ["AMPU", "27880-00"],
      ["AMPU", "28805-00"], ["AMPU", "28820-00"], ["AMPU", "27295-00"], ["MNR", "00001-00"],
    ]);

    await this.link(queryRunner, "renal artery disease", [
      ["ENDO", "37236-00"], ["ENDO", "37246-00"], ["BYPS", "35636-00"], ["BYPS", "35560-00"],
      ["ENDA", "35341-00"], ["THRM", "34151-00"], ["MNR", "00001-00"],
    ]);

    await this.link(queryRunner, "thoracic aortic aneurysm", [
      ["AORT", "33863-00"], ["AORT", "33871-00"], ["AORT", "33875-00"], ["AORT", "33877-00"],
      ["EVAR", "33880-00"], ["EVAR", "33881-00"], ["EVAR", "33883-00"], ["MNR", "00001-00"],
    ]);

    await this.link(queryRunner, "varicose veins", [
      ["VARX", "36475-00"], ["VARX", "36478-00"], ["VARX", "36465-00"], ["VARX", "36468-00"],
      ["VARX", "36470-00"], ["VARX", "37700-00"], ["VARX", "37722-00"], ["VARX", "37718-00"],
      ["VARX", "37765-00"], ["VARX", "37766-00"], ["AVFR", "37241-00"], ["MNR", "00001-00"],
    ]);

    await this.link(queryRunner, "vascular access", [
      ["DIAL", "36821-00"], ["DIAL", "36818-00"], ["DIAL", "36819-00"], ["DIAL", "36825-00"],
      ["DIAL", "36830-00"], ["DIAL", "36831-00"], ["DIAL", "36833-00"], ["DIAL", "36832-00"],
      ["DIAL", "36558-00"], ["DIAL", "36902-00"], ["DIAL", "37607-00"], ["MNR", "00001-00"],
    ]);

    await this.link(queryRunner, "venous thromboembolism", [
      ["IVCF", "37191-00"], ["IVCF", "37193-00"], ["IVCF", "34401-00"], ["IVCF", "34421-00"],
      ["IVCF", "33910-00"], ["IVCF", "37187-00"], ["IVCF", "37212-00"], ["MNR", "00001-00"],
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // VASC had no proc links before this migration — remove all proc links for VASC main_diags.
    await queryRunner.query(`
      DELETE FROM "main_diag_procs"
      WHERE "mainDiagId" IN (
        SELECT md.id FROM "main_diags" md
        JOIN "departments" dept ON md."departmentId" = dept.id
        WHERE dept.code = 'VASC')
    `);
  }
}
