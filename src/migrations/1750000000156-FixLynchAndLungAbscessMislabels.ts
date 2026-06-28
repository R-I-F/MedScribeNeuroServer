import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Fixes the last two long-open cross-department ICD-11 mislabels (both targets verified against
 * WHO ICD-11 MMS via findacode, both confirmed free of collision → clean in-place recodes):
 *
 *  1. GS "Lynch syndrome" sat on 2B90.Y = "Other specified malignant neoplasms of colon" (a
 *     colon-adenocarcinoma code; colon adeno is already covered by 2B90 [GS] and 2B90.Z [SOC]).
 *     ICD-11 has NO dedicated Lynch-syndrome leaf. The closest verifiable home for this hereditary
 *     digestive-cancer predisposition is the family-history block → QC61.0 "Family history of
 *     malignant neoplasm of digestive organs" (≈ ICD-10 Z15.0/Z80.0). Clinical name kept.
 *
 *  2. CTS "lung abscess - unspecified" sat on CA22.Z = "Chronic obstructive pulmonary disease,
 *     unspecified" (COPD is already covered by CA22 [TRS]). Recode → CA43.2 "Abscess of lung
 *     without pneumonia" — the canonical lung-abscess leaf (≈ ICD-10 J85.2). Clinical name kept.
 *
 * Department and main_diag links reference the row id (not the code), so they are preserved.
 * Names/descriptions are unchanged, so existing embeddings remain valid — no backfill required.
 */
export class FixLynchAndLungAbscessMislabels1750000000156 implements MigrationInterface {
  name = "FixLynchAndLungAbscessMislabels1750000000156";

  public async up(q: QueryRunner): Promise<void> {
    // 1. Lynch syndrome (GS): 2B90.Y (colon adeno) → QC61.0 (family hx of digestive-organ malignancy)
    await q.query(`UPDATE "diagnoses" SET "icdCode" = 'QC61.0' WHERE "icdCode" = '2B90.Y'`);
    // 2. Lung abscess (CTS): CA22.Z (COPD unspecified) → CA43.2 (abscess of lung without pneumonia)
    await q.query(`UPDATE "diagnoses" SET "icdCode" = 'CA43.2' WHERE "icdCode" = 'CA22.Z'`);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`UPDATE "diagnoses" SET "icdCode" = '2B90.Y' WHERE "icdCode" = 'QC61.0'`);
    await q.query(`UPDATE "diagnoses" SET "icdCode" = 'CA22.Z' WHERE "icdCode" = 'CA43.2'`);
  }
}
