import { MigrationInterface, QueryRunner } from "typeorm";

export class LinkCtsProcCptsToMainDiags1750000000049 implements MigrationInterface {
  name = "LinkCtsProcCptsToMainDiags1750000000049";

  private link(mainDiagTitle: string, pairs: [string, string][]): string {
    return pairs
      .map(
        ([alpha, num]) => `
      INSERT INTO "main_diag_procs" ("mainDiagId","procCptId")
      SELECT md.id, p.id FROM "main_diags" md
      JOIN "departments" dept ON md."departmentId" = dept.id
      JOIN "proc_cpts" p ON p."alphaCode" = '${alpha}' AND p."numCode" = '${num}'
      WHERE dept.code = 'CTS' AND md.title = '${mainDiagTitle}'
      ON CONFLICT DO NOTHING;`
      )
      .join("\n");
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── aortic valve disease ──────────────────────────────────────────────
    await queryRunner.query(this.link("aortic valve disease", [
      ["CARD", "33405-00"], // aortic valve replacement
      ["CARD", "33411-00"], // AVR with annuloplasty
      ["CARD", "33413-00"], // aortic root replacement
      ["CARD", "33863-00"], // Bentall procedure
      ["MNR",  "12001-00"], // basic surgical step
      ["MNR",  "13121-00"], // wound closure
      ["NONE", "00000-00"], // other procedure
    ]));

    // ── benign lung / airway disease ──────────────────────────────────────
    await queryRunner.query(this.link("benign lung / airway disease", [
      ["THOR", "32440-00"], // pneumonectomy
      ["THOR", "32480-00"], // lobectomy upper
      ["THOR", "32482-00"], // lobectomy middle
      ["THOR", "32484-00"], // lobectomy lower
      ["THOR", "32500-00"], // wedge resection
      ["THOR", "32663-00"], // VATS lobectomy
      ["THOR", "32666-00"], // VATS wedge resection
      ["THOR", "32668-00"], // VATS segmentectomy
      ["THOR", "32700-00"], // VATS diagnostic
      ["THOR", "32096-00"], // open lung biopsy
      ["THOR", "32100-00"], // thoracotomy exploratory
      ["THOR", "43107-00"], // esophagectomy total
      ["THOR", "43116-00"], // esophagectomy partial
      ["THOR", "43328-00"], // Heller myotomy
      ["THOR", "31760-00"], // tracheoplasty
      ["THOR", "39501-00"], // diaphragmatic hernia repair
      ["THOR", "32421-00"], // tube thoracostomy
      ["MNR",  "12001-00"], // basic surgical step
      ["MNR",  "13121-00"], // wound closure
      ["NONE", "00000-00"], // other procedure
    ]));

    // ── cardiac arrhythmias ───────────────────────────────────────────────
    await queryRunner.query(this.link("cardiac arrhythmias", [
      ["CARD", "33208-00"], // permanent pacemaker dual chamber
      ["CARD", "33249-00"], // ICD implantation
      ["MNR",  "12001-00"], // basic surgical step
      ["NONE", "00000-00"], // other procedure
    ]));

    // ── chest wall deformities / tumors ───────────────────────────────────
    await queryRunner.query(this.link("chest wall deformities / tumors", [
      ["THOR", "21740-00"], // pectus excavatum repair Ravitch
      ["THOR", "21742-00"], // pectus excavatum repair Nuss
      ["THOR", "32900-00"], // rib resection partial
      ["THOR", "32664-00"], // VATS sympathectomy
      ["THOR", "32100-00"], // thoracotomy exploratory
      ["THOR", "39220-00"], // mediastinal tumor resection
      ["THOR", "32700-00"], // VATS diagnostic
      ["THOR", "32096-00"], // open lung biopsy
      ["MNR",  "12001-00"], // basic surgical step
      ["MNR",  "13121-00"], // wound closure
      ["NONE", "00000-00"], // other procedure
    ]));

    // ── congenital acyanotic heart defect ─────────────────────────────────
    await queryRunner.query(this.link("congenital acyanotic heart defect", [
      ["CARD", "33641-00"], // ASD repair
      ["CARD", "33684-00"], // VSD repair
      ["CARD", "33820-00"], // PDA ligation
      ["CARD", "33851-00"], // coarctation repair
      ["MNR",  "12001-00"], // basic surgical step
      ["NONE", "00000-00"], // other procedure
    ]));

    // ── congenital cyanotic heart defect ──────────────────────────────────
    await queryRunner.query(this.link("congenital cyanotic heart defect", [
      ["CARD", "33692-00"], // tetralogy of fallot repair
      ["CARD", "33770-00"], // arterial switch operation
      ["CARD", "33750-00"], // modified Blalock-Taussig shunt
      ["CARD", "33768-00"], // bidirectional Glenn shunt
      ["MNR",  "12001-00"], // basic surgical step
      ["NONE", "00000-00"], // other procedure
    ]));

    // ── coronary artery disease (cad) ─────────────────────────────────────
    await queryRunner.query(this.link("coronary artery disease (cad)", [
      ["CARD", "33510-00"], // CABG single vessel
      ["CARD", "33511-00"], // CABG two vessels
      ["CARD", "33512-00"], // CABG three vessels
      ["CARD", "33516-00"], // CABG four or more vessels
      ["CARD", "33533-00"], // off-pump CABG single vessel
      ["CARD", "33535-00"], // off-pump CABG three vessels
      ["CARD", "33536-00"], // off-pump CABG four or more vessels
      ["MNR",  "12001-00"], // basic surgical step
      ["NONE", "00000-00"], // other procedure
    ]));

    // ── heart failure & cardiomyopathy ────────────────────────────────────
    await queryRunner.query(this.link("heart failure & cardiomyopathy", [
      ["CARD", "33940-00"], // heart transplantation
      ["CARD", "33975-00"], // LVAD insertion
      ["CARD", "33960-00"], // ECMO initiation
      ["MNR",  "12001-00"], // basic surgical step
      ["NONE", "00000-00"], // other procedure
    ]));

    // ── mediastinal mass / thymoma ────────────────────────────────────────
    await queryRunner.query(this.link("mediastinal mass / thymoma", [
      ["THOR", "39220-00"], // mediastinal tumor resection
      ["THOR", "32673-00"], // VATS thymectomy
      ["THOR", "32700-00"], // VATS diagnostic
      ["THOR", "32096-00"], // open lung biopsy
      ["MNR",  "12001-00"], // basic surgical step
      ["NONE", "00000-00"], // other procedure
    ]));

    // ── metastatic/secondary lung disease ─────────────────────────────────
    await queryRunner.query(this.link("metastatic/secondary lung disease", [
      ["THOR", "32500-00"], // wedge resection
      ["THOR", "32666-00"], // VATS wedge resection
      ["THOR", "32700-00"], // VATS diagnostic
      ["THOR", "32096-00"], // open lung biopsy
      ["MNR",  "12001-00"], // basic surgical step
      ["NONE", "00000-00"], // other procedure
    ]));

    // ── mitral valve disease ──────────────────────────────────────────────
    await queryRunner.query(this.link("mitral valve disease", [
      ["CARD", "33430-00"], // mitral valve replacement
      ["CARD", "33425-00"], // mitral commissurotomy
      ["CARD", "33426-00"], // mitral valvuloplasty
      ["CARD", "33427-00"], // mitral valve radical repair
      ["MNR",  "12001-00"], // basic surgical step
      ["NONE", "00000-00"], // other procedure
    ]));

    // ── pericardial disease ───────────────────────────────────────────────
    await queryRunner.query(this.link("pericardial disease", [
      ["CARD", "33020-00"], // pericardiotomy
      ["CARD", "33025-00"], // pericardial window
      ["CARD", "33030-00"], // pericardiectomy partial
      ["CARD", "33031-00"], // pericardiectomy complete
      ["THOR", "32660-00"], // VATS pericardiectomy
      ["THOR", "32421-00"], // tube thoracostomy (cardiac tamponade drainage)
      ["MNR",  "12001-00"], // basic surgical step
      ["NONE", "00000-00"], // other procedure
    ]));

    // ── pleural effusion & empyema ────────────────────────────────────────
    await queryRunner.query(this.link("pleural effusion & empyema", [
      ["THOR", "32421-00"], // tube thoracostomy
      ["THOR", "32220-00"], // decortication partial
      ["THOR", "32225-00"], // decortication total
      ["THOR", "32310-00"], // pleurectomy
      ["THOR", "32650-00"], // VATS pleurodesis
      ["THOR", "32651-00"], // VATS partial pleurectomy
      ["THOR", "32652-00"], // VATS decortication
      ["THOR", "32700-00"], // VATS diagnostic
      ["THOR", "32100-00"], // thoracotomy exploratory
      ["MNR",  "12001-00"], // basic surgical step
      ["NONE", "00000-00"], // other procedure
    ]));

    // ── pneumothorax & bullous disease ────────────────────────────────────
    await queryRunner.query(this.link("pneumothorax & bullous disease", [
      ["THOR", "32421-00"], // tube thoracostomy
      ["THOR", "32655-00"], // VATS bullectomy
      ["THOR", "32650-00"], // VATS pleurodesis
      ["THOR", "32651-00"], // VATS partial pleurectomy
      ["THOR", "32220-00"], // decortication partial
      ["THOR", "32700-00"], // VATS diagnostic
      ["MNR",  "12001-00"], // basic surgical step
      ["NONE", "00000-00"], // other procedure
    ]));

    // ── primary lung cancer ───────────────────────────────────────────────
    await queryRunner.query(this.link("primary lung cancer", [
      ["THOR", "32440-00"], // pneumonectomy
      ["THOR", "32480-00"], // lobectomy upper lobe
      ["THOR", "32482-00"], // lobectomy middle lobe
      ["THOR", "32484-00"], // lobectomy lower lobe
      ["THOR", "32500-00"], // wedge resection
      ["THOR", "32663-00"], // VATS lobectomy
      ["THOR", "32666-00"], // VATS wedge resection
      ["THOR", "32668-00"], // VATS segmentectomy
      ["THOR", "32671-00"], // VATS pneumonectomy
      ["THOR", "32700-00"], // VATS diagnostic
      ["THOR", "32096-00"], // open lung biopsy
      ["MNR",  "12001-00"], // basic surgical step
      ["NONE", "00000-00"], // other procedure
    ]));

    // ── thoracic aortic aneurysm / dissection ─────────────────────────────
    await queryRunner.query(this.link("thoracic aortic aneurysm / dissection", [
      ["CARD", "33860-00"], // ascending aorta graft
      ["CARD", "33863-00"], // Bentall procedure
      ["CARD", "33870-00"], // aortic arch graft
      ["CARD", "33875-00"], // descending thoracic aorta graft
      ["CARD", "33851-00"], // coarctation repair (also under congenital)
      ["MNR",  "12001-00"], // basic surgical step
      ["NONE", "00000-00"], // other procedure
    ]));

    // ── tricuspid / multi-valve disease ───────────────────────────────────
    await queryRunner.query(this.link("tricuspid / multi-valve disease", [
      ["CARD", "33460-00"], // tricuspid valvectomy
      ["CARD", "33463-00"], // tricuspid valvuloplasty
      ["CARD", "33464-00"], // tricuspid annuloplasty
      ["CARD", "33465-00"], // tricuspid valve replacement
      ["CARD", "33472-00"], // pulmonary valve replacement
      ["CARD", "33430-00"], // mitral valve replacement (combined)
      ["CARD", "33425-00"], // mitral commissurotomy (combined)
      ["CARD", "33426-00"], // mitral valvuloplasty (combined)
      ["CARD", "33427-00"], // mitral valve radical repair (combined)
      ["CARD", "33405-00"], // aortic valve replacement (combined)
      ["MNR",  "12001-00"], // basic surgical step
      ["NONE", "00000-00"], // other procedure
    ]));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "main_diag_procs"
      WHERE "mainDiagId" IN (
        SELECT md.id FROM "main_diags" md
        JOIN "departments" dept ON md."departmentId" = dept.id
        WHERE dept.code = 'CTS'
      )
    `);
  }
}
