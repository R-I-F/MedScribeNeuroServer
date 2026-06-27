import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * ENT proc_cpts — links the 81 imported procedures (migrations 136-137) plus 24 reused shared
 * rows (HNCK laryngectomy/neck-dissection/parotidectomy/glossectomy, ONCO lip/tongue/node,
 * SALV sialolithotomy/parotid/submandibular, THYR thyroidectomy/parathyroidectomy, SOFT
 * thyroglossal cyst) and the shared MNR basic-step row to the 13 ENT main_diags. ENT had ZERO
 * proc links before this migration, so down() removes all ENT main_diag↔proc links.
 *
 * Every category receives ≥5 procedures + MNR. Some procs dual-link (FESS 31237/31267 →
 * sinusitis & polyps; TONS T&A/adenoid → tonsillitis & sleep apnoea; TYMP 69635 → TM & mastoid;
 * HNCK parotidectomy → H&N cancer & salivary; THYR 60252/60254 → thyroid & H&N cancer).
 */
export class LinkEntProcCptsToMainDiags1750000000138 implements MigrationInterface {
  name = "LinkEntProcCptsToMainDiags1750000000138";

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

    await this.link(q, "ENT", "chronic sinusitis", [
      ["FESS", "31231-00"], ["FESS", "31237-00"], ["FESS", "31254-00"], ["FESS", "31255-00"], ["FESS", "31256-00"],
      ["FESS", "31267-00"], ["FESS", "31276-00"], ["FESS", "31287-00"], ["FESS", "31288-00"], ["FESS", "31240-00"],
      ["NASF", "31030-00"], MNR,
    ]);
    await this.link(q, "ENT", "deviated septum", [
      ["SEPT", "30520-00"], ["SEPT", "30140-00"], ["SEPT", "30130-00"], ["SEPT", "30802-00"], ["SEPT", "30630-00"],
      ["SEPT", "30560-00"], ["SEPT", "30420-00"], ["SEPT", "30901-00"], ["SEPT", "30903-00"], ["SEPT", "30905-00"],
      ["FESS", "31240-00"], MNR,
    ]);
    await this.link(q, "ENT", "nasal polyps", [
      ["NASF", "30110-00"], ["NASF", "30115-00"], ["NASF", "30300-00"], ["NASF", "31040-00"], ["NASF", "31030-00"],
      ["FESS", "31237-00"], ["FESS", "31267-00"], MNR,
    ]);
    await this.link(q, "ENT", "tonsillitis & adenoid hypertrophy", [
      ["TONS", "42820-00"], ["TONS", "42821-00"], ["TONS", "42825-00"], ["TONS", "42826-00"], ["TONS", "42830-00"],
      ["TONS", "42831-00"], ["TONS", "42836-00"], ["TONS", "42700-00"], ["TONS", "42720-00"], ["TONS", "42725-00"],
      ["TONS", "42960-00"], MNR,
    ]);
    await this.link(q, "ENT", "obstructive sleep apnea", [
      ["OSAS", "42145-00"], ["OSAS", "41530-00"], ["OSAS", "21685-00"], ["OSAS", "41512-00"], ["OSAS", "64582-00"],
      ["TONS", "42820-00"], ["TONS", "42821-00"], ["TONS", "42830-00"], ["TONS", "42831-00"], MNR,
    ]);
    await this.link(q, "ENT", "otitis media with effusion", [
      ["MYRT", "69420-00"], ["MYRT", "69421-00"], ["MYRT", "69433-00"], ["MYRT", "69436-00"], ["MYRT", "69540-00"],
      ["EARC", "69210-00"], ["EARC", "69200-00"], MNR,
    ]);
    await this.link(q, "ENT", "tympanic membrane perforation", [
      ["TYMP", "69610-00"], ["TYMP", "69620-00"], ["TYMP", "69631-00"], ["TYMP", "69632-00"], ["TYMP", "69635-00"],
      ["TYMP", "69641-00"], MNR,
    ]);
    await this.link(q, "ENT", "mastoiditis", [
      ["MAST", "69501-00"], ["MAST", "69502-00"], ["MAST", "69505-00"], ["MAST", "69511-00"], ["MAST", "69740-00"],
      ["MAST", "69955-00"], ["TYMP", "69635-00"], MNR,
    ]);
    await this.link(q, "ENT", "hearing loss", [
      ["STAP", "69660-00"], ["STAP", "69661-00"], ["STAP", "69930-00"], ["STAP", "69915-00"], ["STAP", "69990-00"], MNR,
    ]);
    await this.link(q, "ENT", "laryngeal pathology", [
      ["LARY", "31505-00"], ["LARY", "31525-00"], ["LARY", "31535-00"], ["LARY", "31540-00"], ["LARY", "31541-00"],
      ["LARY", "31571-00"], ["LARY", "31530-00"], ["LARY", "31580-00"], ["LARY", "31551-00"], ["LARY", "31600-00"],
      ["LARY", "31603-00"], ["LARY", "31300-00"], MNR,
    ]);
    await this.link(q, "ENT", "thyroid & parathyroid diseases", [
      ["THYR", "60220-00"], ["THYR", "60240-00"], ["THYR", "60252-00"], ["THYR", "60254-00"], ["THYR", "60260-00"],
      ["THYR", "60100-00"], ["THYR", "60500-00"], ["THYR", "60512-00"], ["THYR", "60271-00"], ["THYR", "60502-00"],
      ["THYR", "60505-00"], ["SOFT", "60280-00"], MNR,
    ]);
    await this.link(q, "ENT", "salivary gland disease", [
      ["SALV", "42410-00"], ["SALV", "42440-00"], ["SALV", "42408-00"], ["SALV", "42330-00"], ["SALV", "42335-00"],
      ["HNCK", "42415-00"], ["HNCK", "42420-00"], MNR,
    ]);
    await this.link(q, "ENT", "head & neck cancer", [
      ["HNCK", "31360-00"], ["HNCK", "31365-00"], ["HNCK", "38720-00"], ["HNCK", "38724-00"], ["HNCK", "41135-00"],
      ["HNCK", "42415-00"], ["HNCK", "42420-00"], ["HNCK", "42842-00"], ["ONCO", "40510-00"], ["ONCO", "41130-00"],
      ["ONCO", "38510-00"], ["THYR", "60252-00"], ["THYR", "60254-00"], MNR,
    ]);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`
      DELETE FROM "main_diag_procs"
      WHERE "mainDiagId" IN (SELECT md.id FROM "main_diags" md JOIN "departments" d ON md."departmentId" = d.id WHERE d.code = 'ENT')
    `);
  }
}
