import { MigrationInterface, QueryRunner } from "typeorm";

export class LinkCtsExtProcCptsToMainDiags1750000000059 implements MigrationInterface {
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
         WHERE dept.code = 'CTS' AND md.title = $3
         ON CONFLICT DO NOTHING`,
        [alphaCode, numCode, mainDiagTitle]
      );
    }
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.link(queryRunner, 'aortic valve disease', [
      ['CARD', '33722-00'], // sinus of Valsalva repair
      ['MNR',  '00001-00'],
    ]);

    await this.link(queryRunner, 'benign lung / airway disease', [
      ['THOR', '31780-00'], // tracheal resection
      ['THOR', '32098-00'], // open pleural biopsy
      ['THOR', '32420-00'], // thoracentesis
      ['THOR', '32851-00'], // single lung transplantation
      ['THOR', '43235-00'], // EGD
      ['THOR', '43239-00'], // EGD with biopsy
      ['MNR',  '00001-00'],
    ]);

    await this.link(queryRunner, 'cardiac arrhythmias', [
      ['CARD', '33210-00'], // temporary pacemaker
      ['CARD', '33250-00'], // Maze limited
      ['CARD', '33256-00'], // Maze extended
      ['MNR',  '00001-00'],
    ]);

    await this.link(queryRunner, 'chest wall deformities / tumors', [
      ['THOR', '19260-00'], // chest wall resection
      ['THOR', '21743-00'], // pectus carinatum repair
      ['THOR', '32035-00'], // thoracoplasty
      ['THOR', '32098-00'], // open pleural biopsy
      ['THOR', '32503-00'], // Pancoast resection
      ['MNR',  '00001-00'],
    ]);

    await this.link(queryRunner, 'congenital acyanotic heart defect', [
      ['CARD', '33650-00'], // AV canal repair
      ['CARD', '33690-00'], // PA banding
      ['MNR',  '00001-00'],
    ]);

    await this.link(queryRunner, 'congenital cyanotic heart defect', [
      ['CARD', '33690-00'], // PA banding
      ['CARD', '33766-00'], // Fontan
      ['MNR',  '00001-00'],
    ]);

    await this.link(queryRunner, 'coronary artery disease (cad)', [
      ['CARD', '33300-00'], // cardiac wound repair
      ['CARD', '33542-00'], // LV aneurysm repair
      ['CARD', '33572-00'], // coronary endarterectomy
      ['CARD', '33970-00'], // IABP
      ['MNR',  '00001-00'],
    ]);

    await this.link(queryRunner, 'heart failure & cardiomyopathy', [
      ['CARD', '33945-00'], // heart-lung transplant
      ['CARD', '33970-00'], // IABP
      ['CARD', '33976-00'], // RVAD
      ['CARD', '33980-00'], // total artificial heart
      ['THOR', '32851-00'], // single lung transplant
      ['MNR',  '00001-00'],
    ]);

    await this.link(queryRunner, 'mediastinal mass / thymoma', [
      ['THOR', '39000-00'], // mediastinoscopy with biopsy
      ['THOR', '39200-00'], // mediastinal cyst resection
      ['THOR', '43235-00'], // EGD
      ['THOR', '43239-00'], // EGD with biopsy
      ['MNR',  '00001-00'],
    ]);

    await this.link(queryRunner, 'metastatic/secondary lung disease', [
      ['THOR', '32098-00'], // open pleural biopsy
      ['THOR', '32420-00'], // thoracentesis
      ['MNR',  '00001-00'],
    ]);

    await this.link(queryRunner, 'mitral valve disease', [
      ['CARD', '33250-00'], // Maze limited
      ['CARD', '33256-00'], // Maze extended
      ['CARD', '33420-00'], // closed commissurotomy
      ['MNR',  '00001-00'],
    ]);

    await this.link(queryRunner, 'pericardial disease', [
      ['CARD', '33300-00'], // cardiac wound repair
      ['MNR',  '00001-00'],
    ]);

    await this.link(queryRunner, 'pleural effusion & empyema', [
      ['THOR', '32035-00'], // thoracoplasty
      ['THOR', '32098-00'], // open pleural biopsy
      ['THOR', '32420-00'], // thoracentesis
      ['MNR',  '00001-00'],
    ]);

    await this.link(queryRunner, 'pneumothorax & bullous disease', [
      ['MNR',  '00001-00'],
    ]);

    await this.link(queryRunner, 'primary lung cancer', [
      ['THOR', '32490-00'], // sleeve resection
      ['THOR', '32503-00'], // Pancoast resection
      ['THOR', '39000-00'], // mediastinoscopy
      ['MNR',  '00001-00'],
    ]);

    await this.link(queryRunner, 'thoracic aortic aneurysm / dissection', [
      ['CARD', '33722-00'], // sinus of Valsalva repair
      ['MNR',  '00001-00'],
    ]);

    await this.link(queryRunner, 'tricuspid / multi-valve disease', [
      ['CARD', '33250-00'], // Maze limited
      ['CARD', '33256-00'], // Maze extended
      ['MNR',  '00001-00'],
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const cardCodes = ['33210-00','33250-00','33256-00','33300-00','33420-00','33542-00','33572-00','33650-00','33690-00','33722-00','33766-00','33945-00','33970-00','33976-00','33980-00'];
    const thorCodes = ['19260-00','21743-00','31780-00','32035-00','32098-00','32420-00','32490-00','32503-00','32851-00','39000-00','39200-00','43235-00','43239-00'];

    for (const code of cardCodes) {
      await queryRunner.query(
        `DELETE FROM "main_diag_procs" WHERE "procCptId" IN (SELECT id FROM "proc_cpts" WHERE "alphaCode"='CARD' AND "numCode"=$1)`,
        [code]
      );
    }
    for (const code of thorCodes) {
      await queryRunner.query(
        `DELETE FROM "main_diag_procs" WHERE "procCptId" IN (SELECT id FROM "proc_cpts" WHERE "alphaCode"='THOR' AND "numCode"=$1)`,
        [code]
      );
    }
  }
}
