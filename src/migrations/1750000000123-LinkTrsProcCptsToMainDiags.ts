import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * TRS proc_cpts — links the 100 imported procedures (migrations 121-122) plus the shared MNR
 * basic-step row to the 10 TRS main_diags. Some procs are linked to more than one category
 * (eg LIVT donor codes → liver transplant & donor hepatectomy; KTNP donor codes → renal
 * transplant & donor nephrectomy; biopsies → rejection; heart-lung → multi-organ).
 *
 * Every category receives ≥5 procedures + MNR. TRS had zero proc links before this migration,
 * so down() simply removes all TRS main_diag↔proc links.
 */
export class LinkTrsProcCptsToMainDiags1750000000123 implements MigrationInterface {
  name = "LinkTrsProcCptsToMainDiags1750000000123";

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
    const MNR: [string, string] = ["MNR", "00001-00"];

    await this.link(queryRunner, "TRS", "liver transplant", [
      ["LIVT", "47133-00"], ["LIVT", "47135-00"], ["LIVT", "47140-00"], ["LIVT", "47141-00"], ["LIVT", "47142-00"],
      ["LIVT", "47143-00"], ["LIVT", "47144-00"], ["LIVT", "47146-00"], ["LIVT", "47147-00"], ["LIVT", "47100-00"], ["LIVT", "47000-00"],
      ["PORT", "37182-00"], ["PORT", "37183-00"], ["PORT", "43244-00"], ["PORT", "49082-00"], ["PORT", "49083-00"],
      ["BILR", "47780-00"], MNR,
    ]);
    await this.link(queryRunner, "TRS", "donor hepatectomy", [
      ["LIVT", "47133-00"], ["LIVT", "47140-00"], ["LIVT", "47141-00"], ["LIVT", "47142-00"], ["LIVT", "47143-00"], ["LIVT", "47100-00"], MNR,
    ]);
    await this.link(queryRunner, "TRS", "renal transplant", [
      ["KTNP", "50300-00"], ["KTNP", "50320-00"], ["KTNP", "50547-00"], ["KTNP", "50323-00"], ["KTNP", "50325-00"],
      ["KTNP", "50327-00"], ["KTNP", "50328-00"], ["KTNP", "50329-00"], ["KTNP", "50340-00"], ["KTNP", "50360-00"],
      ["KTNP", "50365-00"], ["KTNP", "50370-00"], ["KTNP", "50380-00"], ["KTNP", "50200-00"], ["KTNP", "50780-00"],
      ["DIAL", "36821-00"], ["DIAL", "36818-00"], ["DIAL", "36819-00"], ["DIAL", "36825-00"], ["DIAL", "36830-00"],
      ["DIAL", "36831-00"], ["DIAL", "36833-00"], ["DIAL", "36561-00"], ["DIAL", "36558-00"], ["DIAL", "49421-00"], MNR,
    ]);
    await this.link(queryRunner, "TRS", "donor nephrectomy", [
      ["KTNP", "50300-00"], ["KTNP", "50320-00"], ["KTNP", "50547-00"], ["KTNP", "50323-00"], ["KTNP", "50325-00"], ["DIAL", "36821-00"], MNR,
    ]);
    await this.link(queryRunner, "TRS", "heart transplant", [
      ["HRTT", "33940-00"], ["HRTT", "33944-00"], ["HRTT", "33945-00"], ["HRTT", "33975-00"], ["HRTT", "33976-00"],
      ["HRTT", "33979-00"], ["HRTT", "33990-00"], ["HRTT", "33980-00"], ["HRTT", "33927-00"], ["IMMB", "93505-00"], MNR,
    ]);
    await this.link(queryRunner, "TRS", "lung transplant", [
      ["LUNT", "32850-00"], ["LUNT", "32851-00"], ["LUNT", "32852-00"], ["LUNT", "32853-00"], ["LUNT", "32854-00"],
      ["LUNT", "32855-00"], ["LUNT", "32856-00"], ["LUNT", "31622-00"], ["IMMB", "31628-00"], MNR,
    ]);
    await this.link(queryRunner, "TRS", "multi-organ transplant", [
      ["INTT", "44132-00"], ["INTT", "44133-00"], ["INTT", "44135-00"], ["INTT", "44136-00"], ["INTT", "44137-00"],
      ["INTT", "44715-00"], ["LUNT", "33930-00"], ["LUNT", "33935-00"], MNR,
    ]);
    await this.link(queryRunner, "TRS", "pancreas transplant", [
      ["PANT", "48550-00"], ["PANT", "48551-00"], ["PANT", "48552-00"], ["PANT", "48554-00"], ["PANT", "48556-00"], ["PANT", "48160-00"], MNR,
    ]);
    await this.link(queryRunner, "TRS", "immunologic rejection", [
      ["IMMB", "93505-00"], ["IMMB", "31628-00"], ["IMMB", "36514-00"], ["KTNP", "50200-00"], ["LIVT", "47000-00"], MNR,
    ]);
    await this.link(queryRunner, "TRS", "transplant complications", [
      ["BILR", "47780-00"], ["BILR", "43260-00"], ["BILR", "43262-00"], ["BILR", "43264-00"], ["BILR", "43274-00"],
      ["BILR", "47535-00"], ["BILR", "47536-00"], ["BILR", "47538-00"], ["BILR", "47542-00"], ["BILR", "47531-00"],
      ["VASR", "37246-00"], ["VASR", "37236-00"], ["VASR", "36904-00"], ["VASR", "36905-00"], ["VASR", "36906-00"],
      ["VASR", "36907-00"], ["VASR", "35876-00"],
      ["COMP", "49406-00"], ["COMP", "49323-00"], ["COMP", "50432-00"], ["COMP", "50693-00"], ["COMP", "52332-00"],
      ["COMP", "49591-00"], ["COMP", "49593-00"], ["COMP", "49613-00"], MNR,
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "main_diag_procs"
      WHERE "mainDiagId" IN (SELECT md.id FROM "main_diags" md JOIN "departments" d ON md."departmentId" = d.id WHERE d.code = 'TRS')
    `);
  }
}
