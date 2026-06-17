import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Links all GS proc_cpts (ABDO, LAPR, ENDO, COLO, BREA, THYR) to the 13 GS main_diags,
 * plus the shared MNR 00001-00 (basic surgical step) to every category.
 */
export class LinkGsProcCptsToMainDiags1750000000054 implements MigrationInterface {
  name = "LinkGsProcCptsToMainDiags1750000000054";

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
    await this.link(queryRunner, "abdominal trauma", [
      ["ABDO", "49000-00"], // exploratory laparotomy
      ["ABDO", "38100-00"], // open splenectomy
      ["LAPR", "38120-00"], // laparoscopic splenectomy
      ["MNR",  "00001-00"], // basic surgical step
    ]);

    await this.link(queryRunner, "acute abdomen", [
      ["ABDO", "49000-00"], // exploratory laparotomy
      ["ABDO", "44950-00"], // open appendectomy
      ["ABDO", "43840-00"], // Graham patch
      ["ABDO", "44900-00"], // drainage of appendiceal abscess
      ["LAPR", "44970-00"], // laparoscopic appendectomy
      ["ENDO", "43235-00"], // diagnostic EGD
      ["ENDO", "43255-00"], // EGD with haemostasis
      ["COLO", "46250-00"], // haemorrhoidectomy
      ["COLO", "46910-00"], // lateral internal sphincterotomy
      ["COLO", "46040-00"], // drainage of perianal abscess
      ["COLO", "46060-00"], // fistulotomy
      ["COLO", "11770-00"], // pilonidal cyst excision
      ["MNR",  "00001-00"],
    ]);

    await this.link(queryRunner, "appendicitis", [
      ["ABDO", "44950-00"], // open appendectomy
      ["ABDO", "44900-00"], // drainage of appendiceal abscess
      ["LAPR", "44970-00"], // laparoscopic appendectomy
      ["MNR",  "00001-00"],
    ]);

    await this.link(queryRunner, "bariatric conditions", [
      ["LAPR", "43644-00"], // laparoscopic Roux-en-Y gastric bypass
      ["LAPR", "43775-00"], // laparoscopic sleeve gastrectomy
      ["LAPR", "43770-00"], // laparoscopic adjustable gastric band
      ["MNR",  "00001-00"],
    ]);

    await this.link(queryRunner, "bowel obstruction", [
      ["ABDO", "49000-00"], // exploratory laparotomy
      ["ABDO", "44120-00"], // small bowel resection
      ["ABDO", "44005-00"], // open enterolysis
      ["ABDO", "44320-00"], // colostomy formation
      ["ABDO", "44310-00"], // ileostomy formation
      ["ABDO", "44620-00"], // stoma closure
      ["LAPR", "44202-00"], // laparoscopic enterolysis
      ["MNR",  "00001-00"],
    ]);

    await this.link(queryRunner, "breast lumps & cancer", [
      ["BREA", "19120-00"], // wide local excision
      ["BREA", "19301-00"], // partial mastectomy (BCS)
      ["BREA", "19303-00"], // simple total mastectomy
      ["BREA", "19307-00"], // modified radical mastectomy
      ["BREA", "19020-00"], // I&D breast abscess
      ["BREA", "38525-00"], // axillary lymph node dissection
      ["BREA", "38900-00"], // sentinel lymph node biopsy
      ["MNR",  "00001-00"],
    ]);

    await this.link(queryRunner, "cholecystitis & cholelithiasis", [
      ["ABDO", "47600-00"], // open cholecystectomy
      ["LAPR", "47562-00"], // laparoscopic cholecystectomy
      ["LAPR", "47563-00"], // lap chole with cholangiogram
      ["ENDO", "43260-00"], // ERCP
      ["MNR",  "00001-00"],
    ]);

    await this.link(queryRunner, "colorectal polyps & masses", [
      ["COLO", "44140-00"], // partial colectomy open
      ["COLO", "44143-00"], // Hartmann's procedure
      ["COLO", "44145-00"], // low anterior resection open
      ["COLO", "45110-00"], // APR
      ["COLO", "44204-00"], // laparoscopic colectomy
      ["COLO", "44207-00"], // laparoscopic LAR
      ["COLO", "45171-00"], // transanal excision
      ["ENDO", "45378-00"], // diagnostic colonoscopy
      ["ENDO", "45380-00"], // colonoscopy with biopsy
      ["ENDO", "45385-00"], // colonoscopy with polypectomy
      ["MNR",  "00001-00"],
    ]);

    await this.link(queryRunner, "diverticulitis", [
      ["ABDO", "49000-00"], // exploratory laparotomy
      ["ABDO", "44140-00"], // partial colectomy open
      ["ABDO", "44143-00"], // Hartmann's procedure
      ["LAPR", "44202-00"], // laparoscopic enterolysis
      ["LAPR", "44204-00"], // laparoscopic colectomy
      ["ENDO", "45378-00"], // diagnostic colonoscopy
      ["MNR",  "00001-00"],
    ]);

    await this.link(queryRunner, "hernias", [
      ["ABDO", "49505-00"], // open inguinal repair (initial)
      ["ABDO", "49507-00"], // open inguinal repair (recurrent)
      ["ABDO", "49550-00"], // open femoral repair
      ["ABDO", "49560-00"], // open incisional repair
      ["ABDO", "49570-00"], // open epigastric/umbilical repair
      ["LAPR", "49650-00"], // laparoscopic inguinal repair TEP/TAPP
      ["LAPR", "49652-00"], // laparoscopic umbilical/ventral repair
      ["LAPR", "49654-00"], // laparoscopic incisional repair
      ["LAPR", "43280-00"], // Nissen fundoplication (hiatal hernia)
      ["MNR",  "00001-00"],
    ]);

    await this.link(queryRunner, "peptic ulcer disease", [
      ["ABDO", "43840-00"], // Graham patch (perforated ulcer repair)
      ["ABDO", "43830-00"], // open gastrostomy
      ["ENDO", "43235-00"], // diagnostic EGD
      ["ENDO", "43239-00"], // EGD with biopsy
      ["ENDO", "43255-00"], // EGD with haemostasis
      ["MNR",  "00001-00"],
    ]);

    await this.link(queryRunner, "perforated viscus", [
      ["ABDO", "49000-00"], // exploratory laparotomy
      ["ABDO", "43840-00"], // Graham patch
      ["ABDO", "44120-00"], // small bowel resection
      ["ABDO", "44143-00"], // Hartmann's procedure
      ["MNR",  "00001-00"],
    ]);

    await this.link(queryRunner, "thyroid nodules", [
      ["THYR", "60100-00"], // thyroid FNA biopsy
      ["THYR", "60210-00"], // partial thyroidectomy
      ["THYR", "60220-00"], // total lobectomy (hemithyroidectomy)
      ["THYR", "60240-00"], // total thyroidectomy
      ["THYR", "60252-00"], // total thyroidectomy + central neck dissection
      ["THYR", "60500-00"], // parathyroidectomy
      ["MNR",  "00001-00"],
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove all main_diag_procs links for GS main_diags pointing to GS proc_cpts
    await queryRunner.query(`
      DELETE FROM "main_diag_procs"
      WHERE "mainDiagId" IN (
        SELECT md.id FROM "main_diags" md
        JOIN "departments" dept ON md."departmentId" = dept.id
        WHERE dept.code = 'GS'
      )
      AND "procCptId" IN (
        SELECT id FROM "proc_cpts"
        WHERE "alphaCode" IN ('ABDO','LAPR','ENDO','COLO','BREA','THYR')
      )
    `);
    // Remove MNR 00001-00 links from GS main_diags
    await queryRunner.query(`
      DELETE FROM "main_diag_procs"
      WHERE "mainDiagId" IN (
        SELECT md.id FROM "main_diags" md
        JOIN "departments" dept ON md."departmentId" = dept.id
        WHERE dept.code = 'GS'
      )
      AND "procCptId" IN (
        SELECT id FROM "proc_cpts"
        WHERE "alphaCode" = 'MNR' AND "numCode" = '00001-00'
      )
    `);
  }
}
