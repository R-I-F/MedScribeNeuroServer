import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * OPHTHAL proc_cpts — links the 104 imported procedures (migrations 142-143) plus the shared MNR
 * basic-step row to the 12 OPHTHAL main_diags. OPHTHAL had ZERO proc links before this migration,
 * so down() removes all OPHTHAL main_diag↔proc links. Every category receives ≥5 procedures + MNR.
 * Some procs dual-link (INJX 67028/67027/67025 → diabetic retinopathy & macular degeneration;
 * RETN 67210/67113/67036 → multiple retinal categories; CORN 65772 → cornea & refractive;
 * CATR 66984 → cataract & refractive; CORN 65286/65222 & CATR 67005 → cornea & ocular trauma).
 */
export class LinkOphthalProcCptsToMainDiags1750000000144 implements MigrationInterface {
  name = "LinkOphthalProcCptsToMainDiags1750000000144";

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

  public async up(q: QueryRunner): Promise<void> {
    const MNR: [string, string] = ["MNR", "00001-00"];

    await this.link(q, "OPHTHAL", "cataract", [
      ["CATR", "66984-00"], ["CATR", "66982-00"], ["CATR", "66983-00"], ["CATR", "66985-00"], ["CATR", "66986-00"],
      ["CATR", "66830-00"], ["CATR", "66840-00"], ["CATR", "66850-00"], ["CATR", "66821-00"], ["CATR", "67005-00"], MNR,
    ]);
    await this.link(q, "OPHTHAL", "corneal disease & scarring", [
      ["CORN", "65730-00"], ["CORN", "65750-00"], ["CORN", "65755-00"], ["CORN", "65710-00"], ["CORN", "65756-00"],
      ["CORN", "65778-00"], ["CORN", "0402T-00"], ["CORN", "65222-00"], ["CORN", "65286-00"], ["CORN", "65435-00"],
      ["CORN", "65450-00"], ["CORN", "65772-00"], MNR,
    ]);
    await this.link(q, "OPHTHAL", "glaucoma", [
      ["GLAU", "66170-00"], ["GLAU", "66172-00"], ["GLAU", "66180-00"], ["GLAU", "66183-00"], ["GLAU", "66761-00"],
      ["GLAU", "66625-00"], ["GLAU", "66711-00"], ["GLAU", "66710-00"], ["GLAU", "65855-00"], ["GLAU", "66174-00"],
      ["GLAU", "0671T-00"], MNR,
    ]);
    await this.link(q, "OPHTHAL", "diabetic retinopathy", [
      ["INJX", "67028-00"], ["INJX", "67027-00"], ["INJX", "67025-00"],
      ["RETN", "67228-00"], ["RETN", "67210-00"], ["RETN", "67040-00"], ["RETN", "67039-00"], ["RETN", "67113-00"], MNR,
    ]);
    await this.link(q, "OPHTHAL", "macular degeneration", [
      ["INJX", "67028-00"], ["INJX", "67027-00"], ["INJX", "67025-00"],
      ["RETN", "67042-00"], ["RETN", "67041-00"], ["RETN", "67210-00"], ["RETN", "67036-00"], MNR,
    ]);
    await this.link(q, "OPHTHAL", "retinal detachment", [
      ["RETN", "67108-00"], ["RETN", "67107-00"], ["RETN", "67101-00"], ["RETN", "67105-00"], ["RETN", "67110-00"],
      ["RETN", "67113-00"], ["RETN", "67036-00"], ["RETN", "67145-00"], ["RETN", "67141-00"], ["INJX", "67025-00"], MNR,
    ]);
    await this.link(q, "OPHTHAL", "ocular trauma", [
      ["OTRA", "21390-00"], ["OTRA", "21401-00"], ["OTRA", "65235-00"], ["OTRA", "65260-00"], ["OTRA", "65265-00"],
      ["OTRA", "65285-00"], ["OTRA", "65920-00"], ["CORN", "65286-00"], ["CORN", "65222-00"], ["CATR", "67005-00"], MNR,
    ]);
    await this.link(q, "OPHTHAL", "orbital pathology", [
      ["ORBT", "65103-00"], ["ORBT", "65091-00"], ["ORBT", "65110-00"], ["ORBT", "67400-00"], ["ORBT", "67412-00"],
      ["ORBT", "67414-00"], ["ORBT", "67445-00"], ["ORBT", "67550-00"], ["LACR", "68720-00"], ["LACR", "68810-00"],
      ["LACR", "68815-00"], ["LACR", "68840-00"], MNR,
    ]);
    await this.link(q, "OPHTHAL", "eyelid pathology", [
      ["OPLT", "67904-00"], ["OPLT", "67906-00"], ["OPLT", "67917-00"], ["OPLT", "67924-00"], ["OPLT", "67800-00"],
      ["OPLT", "67801-00"], ["OPLT", "67820-00"], ["OPLT", "67961-00"], ["OPLT", "67930-00"], ["OPLT", "67700-00"],
      ["OPLT", "67875-00"], ["OPLT", "67810-00"], MNR,
    ]);
    await this.link(q, "OPHTHAL", "pterygium", [
      ["PTRY", "65426-00"], ["PTRY", "65420-00"], ["PTRY", "68110-00"], ["PTRY", "68115-00"], ["PTRY", "68130-00"],
      ["PTRY", "68135-00"], ["PTRY", "68340-00"], ["LACR", "68761-00"], ["LACR", "68760-00"], ["CORN", "65778-00"], MNR,
    ]);
    await this.link(q, "OPHTHAL", "refractive errors", [
      ["REFR", "65760-00"], ["REFR", "65765-00"], ["REFR", "65767-00"], ["REFR", "65775-00"],
      ["CORN", "65772-00"], ["CATR", "66984-00"], MNR,
    ]);
    await this.link(q, "OPHTHAL", "strabismus", [
      ["STRB", "67311-00"], ["STRB", "67312-00"], ["STRB", "67314-00"], ["STRB", "67316-00"], ["STRB", "67318-00"],
      ["STRB", "67320-00"], ["STRB", "67332-00"], ["STRB", "67340-00"], ["STRB", "67345-00"], MNR,
    ]);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`
      DELETE FROM "main_diag_procs"
      WHERE "mainDiagId" IN (
        SELECT md.id FROM "main_diags" md
        JOIN "departments" dept ON md."departmentId" = dept.id
        WHERE dept.code = 'OPHTHAL')`);
  }
}
