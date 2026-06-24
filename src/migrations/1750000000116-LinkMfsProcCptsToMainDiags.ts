import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * MFS proc_cpts — links the 94 imported procedures (migrations 114-115) plus 10 shared rows
 * (PRS CLEF cleft codes, SOC HNCK glossectomy/parotidectomy/lip, PRS EXCN face-tumour) and
 * the shared MNR basic-step row to the 12 MFS main_diags. Some procs are linked to more than
 * one category (eg JCYS malignant excisions → jaw cysts & oral cancer; DTAL/VEST → dentoalveolar
 * & impacted teeth & implants; ORIF/ARCH → facial trauma & jaw fractures).
 *
 * Every category receives ≥5 procedures + MNR. MFS had zero proc links before this migration,
 * so down() simply removes all MFS main_diag↔proc links.
 */
export class LinkMfsProcCptsToMainDiags1750000000116 implements MigrationInterface {
  name = "LinkMfsProcCptsToMainDiags1750000000116";

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

    await this.link(queryRunner, "MFS", "benign oral tumors", [
      ["JCYS", "21030-00"], ["JCYS", "21040-00"], ["JCYS", "21046-00"], ["JCYS", "21048-00"], ["JCYS", "21025-00"],
      ["DTAL", "41825-00"], ["DTAL", "41826-00"], MNR,
    ]);
    await this.link(queryRunner, "MFS", "cleft lip & palate", [
      ["CLEF", "40700-00"], ["CLEF", "40701-00"], ["CLEF", "40720-00"], ["CLEF", "42200-00"], ["CLEF", "42235-00"],
      ["CLEF", "40702-00"], ["CLEF", "42205-00"], ["CLEF", "42210-00"], ["CLEF", "42215-00"], ["CLEF", "42226-00"], MNR,
    ]);
    await this.link(queryRunner, "MFS", "dental implants", [
      ["IMPL", "21248-00"], ["IMPL", "21249-00"], ["IMPL", "21215-00"], ["IMPL", "20900-00"],
      ["VEST", "40840-00"], ["VEST", "41874-00"], MNR,
    ]);
    await this.link(queryRunner, "MFS", "dentoalveolar surgery", [
      ["DTAL", "40810-00"], ["DTAL", "41825-00"], ["DTAL", "41826-00"], ["DTAL", "41805-00"], ["DTAL", "41115-00"],
      ["VEST", "40840-00"], ["VEST", "40842-00"], ["VEST", "41874-00"], MNR,
    ]);
    await this.link(queryRunner, "MFS", "facial trauma", [
      ["ORIF", "21315-00"], ["ORIF", "21320-00"], ["ORIF", "21325-00"], ["ORIF", "21330-00"], ["ORIF", "21336-00"],
      ["ORIF", "21338-00"], ["ORIF", "21339-00"], ["ORIF", "21346-00"], ["ORIF", "21355-00"], ["ORIF", "21356-00"],
      ["ORIF", "21365-00"], ["ORIF", "21385-00"], ["ORIF", "21407-00"], ["ORIF", "21408-00"], ["ARCH", "21110-00"], MNR,
    ]);
    await this.link(queryRunner, "MFS", "impacted teeth", [
      ["DTAL", "41825-00"], ["DTAL", "40810-00"], ["DTAL", "41805-00"], ["DTAL", "41115-00"],
      ["VEST", "41874-00"], ["JCYS", "21025-00"], MNR,
    ]);
    await this.link(queryRunner, "MFS", "jaw cysts & pathology", [
      ["JCYS", "21030-00"], ["JCYS", "21034-00"], ["JCYS", "21040-00"], ["JCYS", "21044-00"], ["JCYS", "21046-00"],
      ["JCYS", "21048-00"], ["JCYS", "21025-00"], MNR,
    ]);
    await this.link(queryRunner, "MFS", "jaw fractures", [
      ["ORIF", "21421-00"], ["ORIF", "21422-00"], ["ORIF", "21432-00"], ["ORIF", "21445-00"], ["ORIF", "21450-00"],
      ["ORIF", "21453-00"], ["ORIF", "21461-00"], ["ORIF", "21462-00"], ["ORIF", "21465-00"], ["ORIF", "21470-00"],
      ["ORIF", "21346-00"], ["ARCH", "21110-00"], MNR,
    ]);
    await this.link(queryRunner, "MFS", "oral cancer", [
      ["ONCO", "40510-00"], ["ONCO", "41110-00"], ["ONCO", "41112-00"], ["ONCO", "41120-00"], ["ONCO", "41130-00"],
      ["ONCO", "41150-00"], ["ONCO", "41155-00"], ["ONCO", "42104-00"], ["ONCO", "42106-00"], ["ONCO", "42107-00"],
      ["ONCO", "42120-00"], ["HNCK", "40530-00"], ["HNCK", "41135-00"], ["EXCN", "21015-00"], ["JCYS", "21034-00"], ["JCYS", "21044-00"], MNR,
    ]);
    await this.link(queryRunner, "MFS", "orthognathic surgery", [
      ["ORTH", "21141-00"], ["ORTH", "21150-00"], ["ORTH", "21154-00"], ["ORTH", "21196-00"], ["ORTH", "21193-00"],
      ["ORTH", "21198-00"], ["ORTH", "21206-00"], ["ORTH", "21120-00"], ["ORTH", "21121-00"], ["ORTH", "21125-00"],
      ["ORTH", "21127-00"], ["ORTH", "21188-00"], ["ORTH", "21208-00"], ["ORTH", "21209-00"], ["ORTH", "21247-00"], ["ORTH", "21255-00"], MNR,
    ]);
    await this.link(queryRunner, "MFS", "salivary gland pathology", [
      ["SALV", "42300-00"], ["SALV", "42330-00"], ["SALV", "42335-00"], ["SALV", "42340-00"], ["SALV", "42408-00"],
      ["SALV", "42409-00"], ["SALV", "42410-00"], ["SALV", "42440-00"], ["SALV", "42450-00"],
      ["HNCK", "42415-00"], ["HNCK", "42420-00"], MNR,
    ]);
    await this.link(queryRunner, "MFS", "temporomandibular joint disorders", [
      ["TMJS", "21010-00"], ["TMJS", "21050-00"], ["TMJS", "21060-00"], ["TMJS", "21070-00"], ["TMJS", "21073-00"],
      ["TMJS", "21240-00"], ["TMJS", "21480-00"], ["TMJS", "21485-00"], ["TMJS", "21490-00"], MNR,
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "main_diag_procs"
      WHERE "mainDiagId" IN (SELECT md.id FROM "main_diags" md JOIN "departments" d ON md."departmentId" = d.id WHERE d.code = 'MFS')
    `);
  }
}
