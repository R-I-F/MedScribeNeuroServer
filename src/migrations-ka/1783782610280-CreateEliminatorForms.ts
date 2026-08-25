import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Lets one eliminator campaign (its shared pool of dates/reservations) be served through
 * multiple public entry points ("forms") that differ only in which lectures are offered.
 *
 * `eliminator_forms` - a form belongs to a campaign; it never gets its own slots or
 * reservation ledger, it reads/writes the campaign's shared ones (that's what keeps the
 * date/lecture pool identical across every form pointing at the same campaign).
 * `eliminator_form_excluded_lectures` - a static per-form "never offer this lecture"
 * list, layered on top of the campaign's normal reserved-lecture exclusion.
 */
export class CreateEliminatorForms1783782610280 implements MigrationInterface {
  name = "CreateEliminatorForms1783782610280";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "eliminator_forms" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "campaignId" uuid NOT NULL,
        "label" character varying(160) NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "FK_elim_form_campaign" FOREIGN KEY ("campaignId") REFERENCES "eliminator_campaigns"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "eliminator_form_excluded_lectures" (
        "formId" uuid NOT NULL,
        "lectureId" uuid NOT NULL,
        PRIMARY KEY ("formId", "lectureId"),
        CONSTRAINT "FK_elim_form_excl_form" FOREIGN KEY ("formId") REFERENCES "eliminator_forms"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_elim_form_excl_lecture" FOREIGN KEY ("lectureId") REFERENCES "lectures"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "eliminator_form_excluded_lectures"`);
    await queryRunner.query(`DROP TABLE "eliminator_forms"`);
  }
}
