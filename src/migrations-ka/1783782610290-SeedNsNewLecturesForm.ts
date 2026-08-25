import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Seeds a second public entry point into the SAME NS 2026-2027 eliminator campaign
 * (same shared dates/reservations - a lecture or date taken through either form is gone
 * from both), that by default hides the lectures already held during the prior academic
 * year. The 60 excluded ids below are every distinct NS lecture with a `status='held'`
 * event dated 25-Sep-2025 through 25-Jun-2026 in production (verified read-only against
 * ka-institute; user-confirmed as the source of truth for "held last academic year").
 *
 * Fixed form id (not gen_random_uuid()) so the public link is knowable before this runs:
 * https://<frontend>/eliminator/form/0a2e958c-e032-495e-8f7e-2360a8b1682b
 */
const CAMPAIGN_ID = "a378463f-ae99-4549-bda7-0febd1feec43";
const FORM_ID = "0a2e958c-e032-495e-8f7e-2360a8b1682b";

const HELD_LAST_YEAR_LECTURE_IDS = [
  "4c1952d5-c543-4f5d-8867-d60193be1509", "5b0f161d-cee0-4cd7-8781-e2d29d9e56b7",
  "e2c3d7d2-c10c-4151-85c8-4b1f14bcfd4b", "f91e7f45-92d8-421d-9fec-41ff8a5d2a8d",
  "c90a4490-10ee-4d96-9e01-7f8a66a3b1af", "f38243d8-9400-4b8d-9df9-5ef8ffdf9783",
  "cd02682b-42e6-43b5-b512-93e47eb86794", "b2c883c7-e4a2-434b-8d0a-678100f851ee",
  "414b3584-0614-4a77-aab6-cf1e4a96b9a9", "f89fee05-1a88-4edc-b79a-a4aca4fb1827",
  "569fd539-5388-4b5e-8115-b66070ec78fb", "38c96597-a9d3-40e9-84c6-da6f1921bbc3",
  "3a1fc818-12af-48e4-a8d5-93aff098a9bd", "cc572900-0139-474b-b32f-76c2ef672e8e",
  "aaac4e5b-9de1-4be1-8e1d-fdc56efabdc8", "2fbd0fc4-78aa-4d28-afd3-6165f15586d8",
  "d2b2c4b0-38c4-4d63-b3c1-6e1185e992a6", "a3cfcabb-4837-4189-a9d7-9816d38a8301",
  "2a8d630b-95b8-41db-8d1e-1d1085e7b1cf", "32b33547-6f43-4893-824a-cb4f57a80997",
  "9f1fe950-3e0f-4418-a69c-4ba5658b7bd4", "6b4fcad2-4d20-43b0-a093-1e592af82277",
  "72af034f-742b-4db7-9cdd-7a06d5e0fc26", "d9827868-785c-4b39-b420-09c761fc829f",
  "8653aa68-95ac-4c23-819c-3127324bee4e", "874009e9-5dac-4314-bb66-5aa92a33b175",
  "c7385a21-0a7d-4e57-90bc-e5f3bbc66aa0", "cdeca5aa-1baf-4aff-bb21-5d36d8c08b31",
  "00d18924-4a06-4886-847c-258d24f6fd55", "9f5e56f2-83b4-4533-a613-a6ea09c4ab8c",
  "d93c9c19-f301-46dc-9f24-005bc65cd3d3", "89dd2b9f-b35d-4cd0-8509-9a670edd07e8",
  "678aa382-ad86-4676-98d0-9f090e3ea0fd", "11e12061-036e-4349-8166-e8cefa9d4642",
  "1f9bb0cf-7bb5-4ed4-8701-9ee7c1c2aa69", "ecca9836-b833-40f8-9a17-b85b9e834fe4",
  "b44d5033-3c94-4cad-a620-5103b550638f", "4d2e0449-f563-4ba7-a244-fd4b50e7f9b1",
  "c1afb986-7e3e-4374-ac28-f878633834ad", "8e64b9d8-f74e-412d-a6bc-83f5ee41ebbe",
  "78b1aca8-0b14-49db-87ac-0b8d4c4d41fe", "587f9ec1-7a67-4e71-9957-409ad89fbd01",
  "b7ac2579-cd97-41fb-9d8c-9a6c942de884", "37e254a5-ac5f-4e2b-b4b9-93a5f9b3a03f",
  "a2e19900-c8a6-49b8-b498-01b7bd5fb733", "5edbe239-5668-4e72-a19f-2f8d547ebc0e",
  "c8ebf0e5-10cc-4a4c-94b6-faf0675c065c", "341b78ea-84e2-43e6-bbec-26ffbda25ca9",
  "3627c2c1-5cf8-43ee-8fd2-7d2ffea7c254", "233d95b3-3a1d-4f7a-86bc-0be8a16c31f4",
  "d6b234ac-8871-4f35-9ca3-e5aa25c3de86", "697f702a-9a4e-4446-90ba-123c31492fd8",
  "78d9516f-941d-403f-8b70-eb38bcf41502", "a7204f8b-4c6a-47a6-ab7f-cdd4bf0444e3",
  "dd00c453-21c3-42e6-9bc1-b467c757224f", "f7d6f302-b4bf-4082-85b4-f646edc1a648",
  "1d57771f-98df-4836-b911-a10d9cbb2b0b", "1c834cbd-d22a-4b02-b9a9-741f5dbbfd39",
  "80cae200-d0af-40f2-852c-f6027fcb7099", "5ae75a9c-e843-4ccf-8743-a5423c03db5a",
];

export class SeedNsNewLecturesForm1783782610290 implements MigrationInterface {
  name = "SeedNsNewLecturesForm1783782610290";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO "eliminator_forms" ("id", "campaignId", "label")
       VALUES ($1, $2, $3)`,
      [FORM_ID, CAMPAIGN_ID, "NS Academic Year 2026-2027 - New Lectures Only"]
    );

    for (const lectureId of HELD_LAST_YEAR_LECTURE_IDS) {
      await queryRunner.query(
        `INSERT INTO "eliminator_form_excluded_lectures" ("formId", "lectureId") VALUES ($1, $2)`,
        [FORM_ID, lectureId]
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "eliminator_form_excluded_lectures" WHERE "formId" = $1`, [FORM_ID]);
    await queryRunner.query(`DELETE FROM "eliminator_forms" WHERE "id" = $1`, [FORM_ID]);
  }
}
