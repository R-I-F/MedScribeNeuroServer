import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * The NS department reviewed the eliminator pool and marked 13 lectures as outside the
 * teaching curriculum for 2026-2027 (mostly pure anatomy / embryology basic science, plus
 * the staff-rounds etiquette talk). They are removed from the "New Lectures Only" public
 * form ONLY.
 *
 * This is an exclusion, NOT a deletion: the `lectures` rows stay untouched, so the academic
 * curriculum, event calendars, attendance and e-certificates are unaffected. The base link
 * /eliminator/<campaignId> keeps offering all 152 lectures (per the user's decision).
 *
 * Effect on the form: 60 -> 73 excluded, so 92 -> 79 offered lectures against 76 seats.
 * All 13 were verified read-only on ka-institute as currently offered: none was already
 * excluded and none carried a reservation, so nothing here cancels a booking.
 *
 * Lecture numbers and titles (each number matched exactly one NS lecture):
 *   0.1.2b  rules of thumb in staff rounds
 *   1.4.1   clinical examination of cranial nerves
 *   1.5.1   anatomy of cranial nerves ( except 7,8)
 *   1.5.3   types of genetic syndromes involving the cns
 *   1.6.1   normal basalis interna and externa anatomy, anatomy of the cranial fossas
 *   1.7.4   new trends in management of cpa lesions
 *   3.2.1   internal structures of the spinal cord and tractography
 *   3.5.1   anatomy and biomechanics of the spine
 *   4.2.1   embryology of the cranium development
 *   5.2.1   anatomy of the carotid
 *   5.5.1   anatomy of the vertebrobasilar system (part 2)
 *   6.3.1   anatomy of the trigeminal and facial nerves
 *   7.2.4   amebic infectioons of the cns
 */
const FORM_ID = "0a2e958c-e032-495e-8f7e-2360a8b1682b";

const OFF_CURRICULUM_LECTURE_IDS = [
  "0b104bdc-2520-43f6-b650-829248dca040", // 0.1.2b
  "beb2e130-a509-4be5-8124-ae6bfed156b6", // 1.4.1
  "756b26b0-7e7c-401f-80a9-afc5e2b6e9f5", // 1.5.1
  "03574f54-2ff3-42cc-8a74-d21a2d1894fa", // 1.5.3
  "d66b1367-4089-42c1-93e4-797cc2d68d3a", // 1.6.1
  "cf8ef5b9-ea7e-4d4d-9692-0ce32be7dbec", // 1.7.4
  "1fa4db43-1951-48b0-a60a-6a07f0c8ad4d", // 3.2.1
  "d88db7ee-c8b8-4bec-a587-f71fd255797a", // 3.5.1
  "82f26b8d-6953-4e47-877b-5752b9ec2a2d", // 4.2.1
  "0edebf9a-74fa-4a24-9da2-877ca9fdcd52", // 5.2.1
  "94810bb9-01f8-489c-a44e-b6ce410424a7", // 5.5.1
  "da77faa4-2d21-41cc-9075-48f867a4994d", // 6.3.1
  "8021dd89-97e5-428d-8638-78745e5c0beb", // 7.2.4
];

export class ExcludeNonCurriculumLecturesNsForm1783782610310 implements MigrationInterface {
  name = "ExcludeNonCurriculumLecturesNsForm1783782610310";

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const lectureId of OFF_CURRICULUM_LECTURE_IDS) {
      await queryRunner.query(
        `INSERT INTO "eliminator_form_excluded_lectures" ("formId", "lectureId")
         VALUES ($1, $2)
         ON CONFLICT ("formId", "lectureId") DO NOTHING`,
        [FORM_ID, lectureId]
      );
    }
  }

  /** Puts the 13 back on offer. Leaves the original 60 held-last-year exclusions alone. */
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "eliminator_form_excluded_lectures"
        WHERE "formId" = $1 AND "lectureId" = ANY($2::uuid[])`,
      [FORM_ID, OFF_CURRICULUM_LECTURE_IDS]
    );
  }
}
