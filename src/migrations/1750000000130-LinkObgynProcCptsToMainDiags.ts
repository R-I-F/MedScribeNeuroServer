import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * OBGYN proc_cpts — links the 100 imported procedures (migrations 128-129) plus the shared
 * MNR basic-step row to the 12 OBGYN main_diags. Several procs are linked to more than one
 * category (eg hysterectomy → fibroids/prolapse/cancer; adnexal surgery → ovarian masses,
 * pelvic mass & endometriosis; placenta/cesarean codes → placental abnormalities).
 *
 * Every category receives ≥5 procedures + MNR. OBGYN had zero proc links before this migration,
 * so down() simply removes all OBGYN main_diag↔proc links.
 */
export class LinkObgynProcCptsToMainDiags1750000000130 implements MigrationInterface {
  name = "LinkObgynProcCptsToMainDiags1750000000130";

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

    await this.link(queryRunner, "OBGYN", "cesarean section", [
      ["CSEC", "59510-00"], ["CSEC", "59514-00"], ["CSEC", "59515-00"], ["CSEC", "59525-00"], ["CSEC", "59618-00"],
      ["CSEC", "59620-00"], ["VDEL", "59412-00"], ["VDEL", "59414-00"], MNR,
    ]);
    await this.link(queryRunner, "OBGYN", "ectopic pregnancy", [
      ["ECTO", "59120-00"], ["ECTO", "59121-00"], ["ECTO", "59130-00"], ["ECTO", "59135-00"], ["ECTO", "59136-00"],
      ["ECTO", "59140-00"], ["ECTO", "59150-00"], ["ECTO", "59151-00"], ["ADNX", "58661-00"], MNR,
    ]);
    await this.link(queryRunner, "OBGYN", "endometriosis", [
      ["ADNX", "58662-00"], ["ADNX", "58661-00"], ["ADNX", "58925-00"], ["ADNX", "58720-00"],
      ["HYST", "58150-00"], ["HYST", "58570-00"], MNR,
    ]);
    await this.link(queryRunner, "OBGYN", "gynecologic cancer", [
      ["ONCO", "58210-00"], ["ONCO", "58200-00"], ["ONCO", "58950-00"], ["ONCO", "58951-00"], ["ONCO", "58953-00"],
      ["ONCO", "58954-00"], ["ONCO", "58956-00"], ["ONCO", "58960-00"], ["ONCO", "58548-00"],
      ["CERV", "57520-00"], ["CERV", "57522-00"], ["CERV", "57530-00"], ["ADNX", "58943-00"], ["HYST", "58150-00"], MNR,
    ]);
    await this.link(queryRunner, "OBGYN", "miscarriage", [
      ["DILC", "58120-00"], ["DILC", "59812-00"], ["DILC", "59820-00"], ["DILC", "59821-00"], ["DILC", "59840-00"],
      ["DILC", "59841-00"], ["DILC", "59160-00"], ["DILC", "59320-00"], MNR,
    ]);
    await this.link(queryRunner, "OBGYN", "ovarian cysts & masses", [
      ["ADNX", "58661-00"], ["ADNX", "58662-00"], ["ADNX", "58720-00"], ["ADNX", "58925-00"], ["ADNX", "58920-00"],
      ["ADNX", "58940-00"], ["ADNX", "58943-00"], MNR,
    ]);
    await this.link(queryRunner, "OBGYN", "pelvic mass", [
      ["ADNX", "58661-00"], ["ADNX", "58720-00"], ["ADNX", "58940-00"], ["ADNX", "58943-00"], ["ADNX", "58820-00"],
      ["HYST", "58150-00"], MNR,
    ]);
    await this.link(queryRunner, "OBGYN", "placental abnormalities", [
      ["VDEL", "59414-00"], ["CSEC", "59510-00"], ["CSEC", "59525-00"], ["DILC", "59160-00"], ["MYOM", "37243-00"], MNR,
    ]);
    await this.link(queryRunner, "OBGYN", "stress urinary incontinence", [
      ["INCO", "57288-00"], ["INCO", "51992-00"], ["INCO", "57287-00"], ["INCO", "51990-00"], ["INCO", "53860-00"],
      ["PROL", "57240-00"], MNR,
    ]);
    await this.link(queryRunner, "OBGYN", "uterine fibroids", [
      ["MYOM", "58140-00"], ["MYOM", "58146-00"], ["MYOM", "58145-00"], ["MYOM", "58545-00"], ["MYOM", "58546-00"],
      ["MYOM", "58561-00"], ["MYOM", "37243-00"], ["HYST", "58150-00"], ["HYST", "58570-00"],
      ["HYSC", "58555-00"], ["HYSC", "58558-00"], ["HYSC", "58563-00"], MNR,
    ]);
    await this.link(queryRunner, "OBGYN", "uterine prolapse", [
      ["PROL", "57240-00"], ["PROL", "57250-00"], ["PROL", "57260-00"], ["PROL", "57265-00"], ["PROL", "57282-00"],
      ["PROL", "57283-00"], ["PROL", "57284-00"], ["PROL", "57285-00"], ["PROL", "57423-00"], ["PROL", "57425-00"],
      ["HYST", "58260-00"], ["HYST", "58262-00"], ["HYST", "58290-00"], MNR,
    ]);
    await this.link(queryRunner, "OBGYN", "vaginal delivery complications", [
      ["VDEL", "59400-00"], ["VDEL", "59409-00"], ["VDEL", "59410-00"], ["VDEL", "59412-00"], ["VDEL", "59414-00"],
      ["VDEL", "59425-00"], ["VDEL", "59430-00"], ["VDEL", "59300-00"], ["VDEL", "59866-00"],
      ["CSEC", "59514-00"], ["DILC", "59160-00"], ["CERV", "57700-00"], MNR,
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "main_diag_procs"
      WHERE "mainDiagId" IN (SELECT md.id FROM "main_diags" md JOIN "departments" d ON md."departmentId" = d.id WHERE d.code = 'OBGYN')
    `);
  }
}
