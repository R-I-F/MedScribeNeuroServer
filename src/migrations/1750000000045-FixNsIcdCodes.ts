import { MigrationInterface, QueryRunner } from "typeorm";

export class FixNsIcdCodes1750000000045 implements MigrationInterface {
  name = "FixNsIcdCodes1750000000045";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── ❌ Definite mismatches ──────────────────────────────────────────────

    // 1. FA9Z "discitis spinal infection" → 1C90.1
    //    FA9Z = spondylopathy, unspecified (musculoskeletal/degenerative chapter)
    //    1C90.1 = pyogenic vertebral osteomyelitis/spondylodiscitis (infectious chapter)
    await queryRunner.query(`
      UPDATE diagnoses
      SET "icdCode" = '1C90.1'
      WHERE "icdCode" = 'FA9Z' AND "icdName" = 'discitis spinal infection'
    `);

    // 2. 5A61.Y "rathkes cleft cyst" → 2F7Y
    //    5A61 = hypopituitarism; 5A61.Y = other specified hypopituitarism
    //    Rathke's cleft cyst is a benign embryonal sellar cyst, not a hypopituitary state.
    //    2F7Y = other specified benign CNS tumour (2F7Z already used for epidermoid/dermoid)
    await queryRunner.query(`
      UPDATE diagnoses
      SET "icdCode" = '2F7Y'
      WHERE "icdCode" = '5A61.Y' AND "icdName" = 'rathkes cleft cyst'
    `);

    // 3. LB73.22 "atlanto-axial instability or subluxation" → NA21.Z
    //    LB73 = congenital malformations of spine (wrong chapter for traumatic/acquired AAI)
    //    NA21.Z = subluxation/dislocation of cervical spine, unspecified (injury chapter)
    await queryRunner.query(`
      UPDATE diagnoses
      SET "icdCode" = 'NA21.Z'
      WHERE "icdCode" = 'LB73.22' AND "icdName" = 'atlanto-axial instability or subluxation'
    `);

    // ── ⚠️ Partial matches — corrected ────────────────────────────────────

    // 4. 1D00.Z "cerebral ventriculitis nos" → 1C80.Y
    //    1D00.Z = bacterial meningitis, unspecified (covers meningeal inflammation, not ventriculitis)
    //    1C80.Y = other specified bacterial CNS infection (correctly captures bacterial ependymitis/ventriculitis)
    await queryRunner.query(`
      UPDATE diagnoses
      SET "icdCode" = '1C80.Y'
      WHERE "icdCode" = '1D00.Z' AND "icdName" = 'cerebral ventriculitis nos'
    `);

    // 5. NE81.2Z "surgical site infection" → NE81.3
    //    NE81.2 = disruption/dehiscence of wound (mechanical failure, not infection)
    //    NE81.3 = infection of wound / surgical site infection
    await queryRunner.query(`
      UPDATE diagnoses
      SET "icdCode" = 'NE81.3'
      WHERE "icdCode" = 'NE81.2Z' AND "icdName" = 'surgical site infection'
    `);

    // 6. 8E60 "post ventricular shunting leak" → NE83.0
    //    8E60 = acquired structural CNS disorder (wrong chapter for a procedure complication)
    //    NE83.0 = mechanical complication of implanted prosthetic device (consistent with NE83.1
    //    "infected VP shunt" already in DB — .0 = mechanical, .1 = infective)
    await queryRunner.query(`
      UPDATE diagnoses
      SET "icdCode" = 'NE83.0'
      WHERE "icdCode" = '8E60' AND "icdName" = 'post ventricular shunting leak'
    `);

    // 7. 8A00 "parkinsonism" → 8A0Z
    //    8A00 = Parkinson disease (idiopathic, primary only)
    //    8A0Z = Parkinson disease or parkinsonism, unspecified (covers all Parkinson-spectrum patients
    //    including secondary/atypical forms seen in DBS practice)
    await queryRunner.query(`
      UPDATE diagnoses
      SET "icdCode" = '8A0Z'
      WHERE "icdCode" = '8A00' AND "icdName" = 'parkinsonism'
    `);

    // 8. FA70.1 "scoliosis" → FA71.Z
    //    FA70 = kyphosis/lordosis family; FA70.1 = other kyphosis (not scoliosis)
    //    FA71 = scoliosis; FA71.Z = scoliosis, unspecified — correct chapter for spinal curvature
    await queryRunner.query(`
      UPDATE diagnoses
      SET "icdCode" = 'FA71.Z'
      WHERE "icdCode" = 'FA70.1' AND "icdName" = 'scoliosis'
    `);

    // 9. NA41.Z "brachial plexus injury" → NA14.0
    //    NA41 = injuries of shoulder/upper arm (anatomically wrong — brachial plexus originates at C5–T1)
    //    NA14.0 = injury of brachial plexus (cervical nerve root level — anatomically correct)
    await queryRunner.query(`
      UPDATE diagnoses
      SET "icdCode" = 'NA14.0'
      WHERE "icdCode" = 'NA41.Z' AND "icdName" = 'brachial plexus injury'
    `);

    // 10. NA23.4Z "whiplash injury" → NA2Y
    //     NA23 = injuries of cervical spinal cord (wrong — whiplash is soft tissue/ligamentous, not cord)
    //     NA2Y = other specified injury of cervical spine (correct for cervical acceleration-deceleration)
    await queryRunner.query(`
      UPDATE diagnoses
      SET "icdCode" = 'NA2Y'
      WHERE "icdCode" = 'NA23.4Z' AND "icdName" = 'whiplash injury'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`UPDATE diagnoses SET "icdCode" = 'NA23.4Z' WHERE "icdCode" = 'NA2Y'    AND "icdName" = 'whiplash injury'`);
    await queryRunner.query(`UPDATE diagnoses SET "icdCode" = 'NA41.Z'  WHERE "icdCode" = 'NA14.0' AND "icdName" = 'brachial plexus injury'`);
    await queryRunner.query(`UPDATE diagnoses SET "icdCode" = 'FA70.1'  WHERE "icdCode" = 'FA71.Z' AND "icdName" = 'scoliosis'`);
    await queryRunner.query(`UPDATE diagnoses SET "icdCode" = '8A00'    WHERE "icdCode" = '8A0Z'   AND "icdName" = 'parkinsonism'`);
    await queryRunner.query(`UPDATE diagnoses SET "icdCode" = '8E60'    WHERE "icdCode" = 'NE83.0' AND "icdName" = 'post ventricular shunting leak'`);
    await queryRunner.query(`UPDATE diagnoses SET "icdCode" = 'NE81.2Z' WHERE "icdCode" = 'NE81.3' AND "icdName" = 'surgical site infection'`);
    await queryRunner.query(`UPDATE diagnoses SET "icdCode" = '1D00.Z'  WHERE "icdCode" = '1C80.Y' AND "icdName" = 'cerebral ventriculitis nos'`);
    await queryRunner.query(`UPDATE diagnoses SET "icdCode" = 'LB73.22' WHERE "icdCode" = 'NA21.Z' AND "icdName" = 'atlanto-axial instability or subluxation'`);
    await queryRunner.query(`UPDATE diagnoses SET "icdCode" = '5A61.Y'  WHERE "icdCode" = '2F7Y'   AND "icdName" = 'rathkes cleft cyst'`);
    await queryRunner.query(`UPDATE diagnoses SET "icdCode" = 'FA9Z'    WHERE "icdCode" = '1C90.1' AND "icdName" = 'discitis spinal infection'`);
  }
}
