import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Links all imported NS proc_cpts to their neurosurgery main_diags.
 * Also inserts the one row missed in migration 040 (LAM 64493-02).
 * Uses (alphaCode, numCode) as the natural key for proc_cpts lookups.
 */
export class LinkNsProcCptsToMainDiags1750000000041 implements MigrationInterface {
  name = "LinkNsProcCptsToMainDiags1750000000041";

  // Helper: returns the SQL to link a set of proc_cpts (by alphaCode+numCode pairs)
  // to an NS main_diag (by title). Each pair is ['ALPHA','numcode'].
  private link(mainDiagTitle: string, pairs: [string, string][]): string {
    return pairs
      .map(
        ([alpha, num]) => `
      INSERT INTO "main_diag_procs" ("mainDiagId","procCptId")
      SELECT md.id, p.id FROM "main_diags" md
      JOIN "departments" dept ON md."departmentId" = dept.id
      JOIN "proc_cpts" p ON p."alphaCode" = '${alpha}' AND p."numCode" = '${num}'
      WHERE dept.code = 'NS' AND md.title = '${mainDiagTitle}'
      ON CONFLICT DO NOTHING;`
      )
      .join("\n");
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Insert the one row missed in migration 040
    await queryRunner.query(`
      INSERT INTO "proc_cpts" ("title","alphaCode","numCode","description","ar_title","ar_description")
      VALUES (
        'local injection','LAM','64493-02',
        'lumbar facet injection',
        'حقن موضعي للمفصل الوجيهي (مستوى إضافي)',
        'حقن موضعي للمفصل الوجيهي القطني في مستوى إضافي بمخدر وكورتيكوستيرويد لعلاج آلام أسفل الظهر متعددة المستويات.'
      )
      ON CONFLICT ("alphaCode","numCode") DO NOTHING
    `);

    // ── cns infection ──────────────────────────────────────────────────
    await queryRunner.query(this.link('cns infection', [
      ['CRAN','61140-00'], // biopsy
      ['CRAN','61304-00'], // craniotomy for further procedure
      ['CRAN','61570-00'], // foreign body removal
      ['MNR', '11044-00'], // debridment
      ['MNR', '11044-01'], // tissue excision
      ['MNR', '12001-00'], // basic surgical step
      ['MNR', '13121-00'], // wound closure
      ['MNR', '61000-00'], // ventricular tapping
      ['MNR', '62270-00'], // lumbar puncture
      ['NONE','00000-00'], // other procedure
    ]));

    // ── cns tumors ─────────────────────────────────────────────────────
    await queryRunner.query(this.link('cns tumors', [
      ['CRAN','61140-00'], // biopsy
      ['CRAN','61304-00'], // craniotomy for further procedure
      ['CRAN','61510-00'], // subtotal resection
      ['CRAN','61510-01'], // gross total resection
      ['CRAN','61516-00'], // cyst fenestration
      ['CRAN','61534-00'], // lesionectomy
      ['CRAN','61537-00'], // lobectomy
      ['CRAN','61570-00'], // foreign body removal
      ['MNR', '12001-00'], // basic surgical step
      ['MNR', '13121-00'], // wound closure
      ['NONE','00000-00'], // other procedure
    ]));

    // ── congenital anomalies, infantile hydrocephalus ──────────────────
    await queryRunner.query(this.link('congenital anomalies, infantile hydrocephalus', [
      ['VSHN','62223-00'], // vp shunt
      ['VSHN','62223-01'], // vp shunt (programmable)
      ['VSHN','62223-02'], // vp shunt (fixed pressure)
      ['CRAN','62201-00'], // etv
      ['VSHN','62160-00'], // laparoscopic implantation of the ventricular catheter
      ['VSHN','62160-01'], // irrigation and lavage
      ['CRAN','61210-00'], // ventriculosubgaleal shunt
      ['CRAN','62161-00'], // foraminoplasty
      ['CRAN','62161-01'], // septostomy
      ['LAM', '63200-00'], // release of the tethered cord
      ['CRAN','61107-00'], // csf diversion neither vp shunt nor etv
      ['CRAN','61107-01'], // evd
      ['CRAN','61107-04'], // csf diversion otherwise
      ['MNR', '61000-00'], // ventricular tapping
      ['MNR', '61020-00'], // manometry
      ['MNR', '61020-01'], // tapping
      ['NONE','00000-00'], // other procedure
    ]));

    // ── cranial trauma ─────────────────────────────────────────────────
    await queryRunner.query(this.link('cranial trauma', [
      ['CRAN','61108-00'], // burr holes
      ['CRAN','61312-00'], // evacuation of the hematoma
      ['CRAN','61313-00'], // evacuation
      ['CRAN','61322-00'], // bony decompression
      ['CRAN','61322-01'], // decompressive craniectomy
      ['CRAN','61322-02'], // decompressive craniotomy
      ['CRAN','61322-03'], // duroplasty (cranial)
      ['CRAN','62000-00'], // elevation of depressed fracture
      ['CRAN','61570-00'], // foreign body removal
      ['CRAN','61304-00'], // craniotomy for further procedure
      ['MNR', '11044-00'], // debridment
      ['MNR', '12001-00'], // basic surgical step
      ['MNR', '13121-00'], // wound closure
      ['MNR', '97605-00'], // vacuum drainage
      ['NONE','00000-00'], // other procedure
    ]));

    // ── csf disorders- other than infantile hydrocephalus ──────────────
    await queryRunner.query(this.link('csf disorders- other than infantile hydrocephalus', [
      ['CRAN','61107-00'], // csf diversion neither vp shunt nor etv
      ['CRAN','61107-01'], // evd
      ['CRAN','61107-04'], // csf diversion otherwise
      ['CRAN','62201-00'], // etv
      ['CRAN','62161-00'], // foraminoplasty
      ['CRAN','62161-01'], // septostomy
      ['VSHN','62223-00'], // vp shunt
      ['VSHN','62223-01'], // vp shunt (programmable)
      ['VSHN','62223-02'], // vp shunt (fixed pressure)
      ['VSHN','62160-00'], // laparoscopic implantation of the ventricular catheter
      ['VSHN','62160-01'], // irrigation and lavage
      ['LAM', '63741-00'], // lumboperitoneal shunt
      ['MNR', '61000-00'], // ventricular tapping
      ['MNR', '61020-00'], // manometry
      ['MNR', '61020-01'], // tapping
      ['MNR', '62270-00'], // lumbar puncture
      ['MNR', '62272-00'], // tap test
      ['MNR', '62272-01'], // lumbar csf drainage
      ['NONE','00000-00'], // other procedure
    ]));

    // ── functional neurosurgery ────────────────────────────────────────
    await queryRunner.query(this.link('functional neurosurgery', [
      ['CRAN','61863-00'], // deep brain stimulation
      ['CRAN','61534-00'], // lesionectomy
      ['CRAN','61537-00'], // lobectomy
      ['CRAN','61541-00'], // callostomy
      ['CRAN','61543-00'], // hemispherectomy
      ['CRAN','61566-00'], // amygdalohippocampectomy
      ['CRAN','61458-00'], // microvascular decompression
      ['CRAN','61715-00'], // lesion (ultrasonic ablation)
      ['LAM', '63170-00'], // drez
      ['LAM', '63185-00'], // rhizotomy
      ['LAM', '63197-00'], // cordotomy
      ['LAM', '63650-00'], // spinal cord stimulation
      ['PRPH','0908t-00'], // vagal nerve stimulator
      ['NONE','00000-00'], // other procedure
    ]));

    // ── neuro-vascular diseases ────────────────────────────────────────
    await queryRunner.query(this.link('neuro-vascular diseases', [
      ['CRAN','61624-00'], // coiling
      ['CRAN','61635-00'], // stenting
      ['CRAN','61640-00'], // balloon angioplasty
      ['CRAN','61697-00'], // wrapping
      ['CRAN','61703-00'], // clipping
      ['CRAN','61711-00'], // direct bypass
      ['CRAN','61711-01'], // indirect bypass
      ['CRAN','61458-00'], // microvascular decompression
      ['CRAN','61312-00'], // evacuation of the hematoma
      ['CRAN','61313-00'], // evacuation
      ['CRAN','61322-01'], // decompressive craniectomy
      ['CRAN','61304-00'], // craniotomy for further procedure
      ['NONE','00000-00'], // other procedure
    ]));

    // ── peripheral nerve diseases ──────────────────────────────────────
    await queryRunner.query(this.link('peripheral nerve diseases', [
      ['PRPH','64721-00'], // carpal tunnel
      ['PRPH','64718-00'], // ulnar nerve entrapment
      ['PRPH','28035-00'], // tarsal tunnel
      ['PRPH','64790-00'], // peripheral nerve tumor
      ['PRPH','64856-00'], // nerve injury otherwise
      ['PRPH','64858-00'], // sciatic nerve injury
      ['PRPH','64861-00'], // brachial plexus injury
      ['MNR', '12001-00'], // basic surgical step
      ['MNR', '13121-00'], // wound closure
      ['NONE','00000-00'], // other procedure
    ]));

    // ── spinal degenerative diseases ───────────────────────────────────
    await queryRunner.query(this.link('spinal degenerative diseases', [
      ['LAM', '0274t-00'], // foraminotomy
      ['LAM', '63042-00'], // fenestration
      ['LAM', '63047-00'], // laminectomy
      ['LAM', '63047-01'], // decompression
      ['LAM', '63050-00'], // laminoplasty
      ['LAM', '63087-00'], // korpectomy
      ['FUSN','22513-00'], // kyphoplasty
      ['LAM', '22511-00'], // vertebroplasty
      ['FUSN','22612-00'], // spinal fusion
      ['FUSN','22612-01'], // fusion
      ['FUSN','22612-02'], // posterior fusion
      ['FUSN','22612-03'], // intertransverse fusion
      ['FUSN','22630-00'], // intervertebral fusion
      ['FUSN','22630-01'], // removal of prolapsed disc
      ['FUSN','22841-00'], // fixation via wires
      ['FUSN','22842-00'], // fixation via hooks
      ['FUSN','22842-01'], // fixation via pedicle screws and rods
      ['FUSN','22842-02'], // fixation otherwise
      ['FUSN','22845-00'], // fixation via screws and plate
      ['LAM', '20660-00'], // traction and immobilization
      ['LAM', '64483-00'], // foraminal block (peri-radicular)
      ['LAM', '64493-00'], // local injection
      ['LAM', '64493-01'], // facet block
      ['LAM', '64493-02'], // local injection (additional level)
      ['LAM', '64636-00'], // radiofrequency ablation
      ['MNR', '12001-00'], // basic surgical step
      ['NONE','00000-00'], // other procedure
    ]));

    // ── spinal trauma ──────────────────────────────────────────────────
    await queryRunner.query(this.link('spinal trauma', [
      ['LAM', '63087-00'], // korpectomy
      ['LAM', '63047-00'], // laminectomy
      ['LAM', '63047-01'], // decompression
      ['FUSN','22513-00'], // kyphoplasty
      ['LAM', '22511-00'], // vertebroplasty
      ['FUSN','22841-00'], // fixation via wires
      ['FUSN','22842-00'], // fixation via hooks
      ['FUSN','22842-01'], // fixation via pedicle screws and rods
      ['FUSN','22842-02'], // fixation otherwise
      ['FUSN','22845-00'], // fixation via screws and plate
      ['LAM', '20660-00'], // traction and immobilization
      ['CRAN','62000-00'], // elevation of depressed fracture (craniovertebral)
      ['LAM', '63709-00'], // repair duroplasty
      ['LAM', '63709-01'], // duroplasty (spinal)
      ['LAM', '63200-00'], // release of the tethered cord
      ['MNR', '12001-00'], // basic surgical step
      ['MNR', '13121-00'], // wound closure
      ['MNR', '97605-00'], // vacuum drainage
      ['NONE','00000-00'], // other procedure
    ]));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "main_diag_procs"
      WHERE "mainDiagId" IN (
        SELECT md.id FROM "main_diags" md
        JOIN "departments" dept ON md."departmentId" = dept.id
        WHERE dept.code = 'NS'
      )
    `);
    await queryRunner.query(`
      DELETE FROM "proc_cpts" WHERE "alphaCode" = 'LAM' AND "numCode" = '64493-02'
    `);
  }
}
