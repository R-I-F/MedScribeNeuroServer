import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * UROL proc_cpts — links the 103 imported procedures (migrations 149-150) plus the shared MNR
 * basic-step row to the 13 UROL main_diags. UROL had ZERO proc links before this migration, so
 * down() removes all UROL main_diag↔proc links. Every category receives ≥5 procedures + MNR.
 * One dual-link: URET 52332 (ureteral stent) → ureteral obstruction & nephrolithiasis.
 */
export class LinkUrolProcCptsToMainDiags1750000000151 implements MigrationInterface {
  name = "LinkUrolProcCptsToMainDiags1750000000151";

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

    await this.link(q, "UROL", "benign prostatic hyperplasia", [
      ["TURP", "52601-00"], ["TURP", "52630-00"], ["TURP", "52450-00"], ["TURP", "52441-00"], ["TURP", "52442-00"],
      ["TURP", "52648-00"], ["TURP", "52649-00"], ["TURP", "53850-00"], ["TURP", "53852-00"], MNR,
    ]);
    await this.link(q, "UROL", "prostate cancer", [
      ["PROS", "55706-00"], ["PROS", "55840-00"], ["PROS", "55845-00"], ["PROS", "55866-00"], ["PROS", "55810-00"],
      ["PROS", "55875-00"], ["PROS", "55873-00"], MNR,
    ]);
    await this.link(q, "UROL", "bladder cancer", [
      ["CYST", "52000-00"], ["CYST", "52204-00"], ["CYST", "52234-00"], ["CYST", "52235-00"], ["CYST", "52240-00"],
      ["CYST", "52224-00"], ["CYST", "52214-00"], ["CYST", "51720-00"], ["CYST", "51550-00"], ["CYST", "51570-00"],
      ["CYST", "51595-00"], ["CYST", "51596-00"], ["CYST", "50820-00"], ["CYST", "51525-00"], ["CYST", "51865-00"], MNR,
    ]);
    await this.link(q, "UROL", "nephrolithiasis", [
      ["STON", "50590-00"], ["STON", "50080-00"], ["STON", "50081-00"], ["STON", "50432-00"], ["STON", "52352-00"],
      ["STON", "52353-00"], ["STON", "52356-00"], ["URET", "52332-00"], MNR,
    ]);
    await this.link(q, "UROL", "ureteral obstruction", [
      ["URET", "52351-00"], ["URET", "52332-00"], ["URET", "50400-00"], ["URET", "50405-00"], ["URET", "50544-00"],
      ["URET", "50780-00"], ["URET", "50760-00"], ["URET", "50650-00"], ["URET", "50548-00"], MNR,
    ]);
    await this.link(q, "UROL", "renal cancer", [
      ["NEPH", "50220-00"], ["NEPH", "50230-00"], ["NEPH", "50240-00"], ["NEPH", "50543-00"], ["NEPH", "50545-00"],
      ["NEPH", "50546-00"], ["NEPH", "50250-00"], MNR,
    ]);
    await this.link(q, "UROL", "renal transplantation", [
      ["RTPX", "50360-00"], ["RTPX", "50365-00"], ["RTPX", "50340-00"], ["RTPX", "50320-00"], ["RTPX", "50547-00"],
      ["RTPX", "50370-00"], ["RTPX", "50380-00"], MNR,
    ]);
    await this.link(q, "UROL", "testicular cancer", [
      ["ORCH", "54520-00"], ["ORCH", "54530-00"], ["ORCH", "54535-00"], ["ORCH", "54600-00"], ["ORCH", "54640-00"],
      ["ORCH", "54650-00"], ["ORCH", "54690-00"], ["ORCH", "54860-00"], ["ORCH", "55040-00"], ["ORCH", "55060-00"],
      ["ORCH", "54700-00"], ["ORCH", "54505-00"], MNR,
    ]);
    await this.link(q, "UROL", "male infertility", [
      ["VARI", "55530-00"], ["VARI", "55550-00"], ["VARI", "55400-00"], ["VARI", "55250-00"], ["VARI", "54900-00"],
      ["VARI", "54500-00"], MNR,
    ]);
    await this.link(q, "UROL", "penile pathology", [
      ["PENI", "54150-00"], ["PENI", "54161-00"], ["PENI", "54110-00"], ["PENI", "54322-00"], ["PENI", "54125-00"],
      ["PENI", "54060-00"], MNR,
    ]);
    await this.link(q, "UROL", "erectile dysfunction", [
      ["EREC", "54400-00"], ["EREC", "54401-00"], ["EREC", "54405-00"], ["EREC", "54420-00"], ["EREC", "54430-00"],
      ["EREC", "54235-00"], MNR,
    ]);
    await this.link(q, "UROL", "urinary incontinence", [
      ["INCO", "53445-00"], ["INCO", "57288-00"], ["INCO", "51715-00"], ["INCO", "51992-00"], ["INCO", "53440-00"],
      ["INCO", "53447-00"], MNR,
    ]);
    await this.link(q, "UROL", "urinary retention", [
      ["RETN", "52276-00"], ["RETN", "53400-00"], ["RETN", "53410-00"], ["RETN", "53620-00"], ["RETN", "53600-00"],
      ["RETN", "51960-00"], MNR,
    ]);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`
      DELETE FROM "main_diag_procs"
      WHERE "mainDiagId" IN (
        SELECT md.id FROM "main_diags" md
        JOIN "departments" dept ON md."departmentId" = dept.id
        WHERE dept.code = 'UROL')`);
  }
}
