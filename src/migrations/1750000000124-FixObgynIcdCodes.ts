import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * OBGYN (Obstetrics & Gynaecology) audit — MIG-A: fixes the heavily-corrupted ICD-11 codes
 * (15 of 23 wrong + 3 approximate, ~78%). The seed scattered gynae conditions across the
 * wrong chapter blocks: uterine leiomyoma in the endometriosis block (GA10.0), PCOS in the
 * GA15 block instead of endocrine 5A80.1, ovarian cyst/torsion mis-coded (GA15.0/.3), PID in
 * the pregnancy chapter (JA84.0), prolapse/fistula in the GA30 ovarian-failure area, and an
 * obstetric tangle — pre-eclampsia/eclampsia swapped onto JA22/JA24 (JA24.0 is actually
 * "mild-moderate pre-eclampsia"), uterine rupture on a puerperal-sepsis code (JB40.0), and
 * postpartum haemorrhage on a preterm-labour code (JB00.0). Plus the long-flagged
 * **OBGYN cervix mismap**: 2C76.0 (= corpus uteri / endometrial cancer) labelled "cervix".
 *
 * All 18 rows are OBGYN-only and every target code is free (staging collision check) → these
 * are straight in-place recodes, no merges. All targets verified via icd11_search
 * (AUDIT_OBGYN.md 2B). Every changed row gets embedding = NULL.
 */
export class FixObgynIcdCodes1750000000124 implements MigrationInterface {
  name = "FixObgynIcdCodes1750000000124";

  private async recode(r: QueryRunner, oldCode: string, newCode: string, name: string, arName: string): Promise<void> {
    await r.query(
      `UPDATE "diagnoses" SET "icdCode" = $2, "icdName" = $3, "icdArName" = $4, "embedding" = NULL WHERE "icdCode" = $1`,
      [oldCode, newCode, name, arName]);
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── gynaecologic oncology ──
    await this.recode(queryRunner, "2C76.0", "2C77.Z", "carcinoma of uterine cervix", "سرطان عنق الرحم");
    await this.recode(queryRunner, "2C76.1", "2C76.Z", "carcinoma of endometrium", "سرطان بطانة الرحم");
    await this.recode(queryRunner, "2C76.2", "JA02.Z", "gestational trophoblastic disease", "مرض الأرومة الغاذية الحملية");
    // ── benign gynaecology ──
    await this.recode(queryRunner, "GA10.2", "GA10.Z", "endometriosis", "بطانة الرحم المهاجرة");
    await this.recode(queryRunner, "GA10.0", "2E86.0", "uterine leiomyoma", "الورم العضلي الأملس الرحمي");
    await this.recode(queryRunner, "GA12.0", "GA11", "adenomyosis", "العُضال الغُدّي");
    await this.recode(queryRunner, "GA15.4", "5A80.1", "polycystic ovary syndrome", "متلازمة المبيض متعدد الكيسات");
    await this.recode(queryRunner, "GA15.0", "GA18.6", "ovarian cyst", "كيسة المبيض");
    await this.recode(queryRunner, "GA15.3", "GA18.5", "torsion of ovary", "التواء المبيض");
    await this.recode(queryRunner, "JA84.0", "GA05.Z", "pelvic inflammatory disease", "مرض التهاب الحوض");
    // ── urogynaecology ──
    await this.recode(queryRunner, "GA30.0", "GC40.3Z", "uterovaginal prolapse", "هبوط الرحم والمهبل");
    await this.recode(queryRunner, "GA30.2", "GC04.10", "vesicovaginal fistula", "الناسور المثاني المهبلي");
    // ── obstetrics ──
    await this.recode(queryRunner, "JA41.0", "JA8C.Z", "abruptio placentae", "انفصال المشيمة الباكر");
    await this.recode(queryRunner, "JA22.0", "JA24.Z", "pre-eclampsia", "ما قبل الارتعاج");
    await this.recode(queryRunner, "JA24.0", "JA25.3", "eclampsia", "الارتعاج (تشنّج الحمل)");
    await this.recode(queryRunner, "JB40.0", "JB0A.1", "uterine rupture during labour", "تمزق الرحم أثناء المخاض");
    await this.recode(queryRunner, "JA01", "JA01.Z", "ectopic pregnancy", "الحمل خارج الرحم");
    await this.recode(queryRunner, "JB00.0", "JA43.Z", "postpartum haemorrhage", "نزف ما بعد الولادة");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await this.recode(queryRunner, "JA43.Z", "JB00.0", "postpartum haemorrhage", "نزيف ما بعد الولادة");
    await this.recode(queryRunner, "JA01.Z", "JA01", "ectopic pregnancy", "حمل خارج الرحم");
    await this.recode(queryRunner, "JB0A.1", "JB40.0", "uterine rupture", "تمزق الرحم");
    await this.recode(queryRunner, "JA25.3", "JA24.0", "eclampsia", "ارتعاج الحمل");
    await this.recode(queryRunner, "JA24.Z", "JA22.0", "pre-eclampsia", "ما قبل الارتعاج");
    await this.recode(queryRunner, "JA8C.Z", "JA41.0", "abruptio placentae", "انفصال المشيمة");
    await this.recode(queryRunner, "GC04.10", "GA30.2", "vesicovaginal fistula", "ناسور مثاني مهبلي");
    await this.recode(queryRunner, "GC40.3Z", "GA30.0", "uterovaginal prolapse", "هبوط الرحم والمهبل");
    await this.recode(queryRunner, "GA05.Z", "JA84.0", "pelvic inflammatory disease", "مرض التهابي حوضي");
    await this.recode(queryRunner, "GA18.5", "GA15.3", "torsion of ovary", "التواء المبيض");
    await this.recode(queryRunner, "GA18.6", "GA15.0", "ovarian cyst", "كيسة مبيض");
    await this.recode(queryRunner, "5A80.1", "GA15.4", "polycystic ovary syndrome", "متلازمة المبيض متعدد الكيسات");
    await this.recode(queryRunner, "GA11", "GA12.0", "adenomyosis", "داء الغدد العضلي");
    await this.recode(queryRunner, "2E86.0", "GA10.0", "uterine leiomyoma", "ورم العضلي الليفي الرحمي");
    await this.recode(queryRunner, "GA10.Z", "GA10.2", "endometriosis", "بطانة الرحم المهاجرة");
    await this.recode(queryRunner, "JA02.Z", "2C76.2", "gestational trophoblastic disease", "مرض الأرومة الغاذية الحملية");
    await this.recode(queryRunner, "2C76.Z", "2C76.1", "carcinoma of endometrium", "سرطانة بطانة الرحم");
    await this.recode(queryRunner, "2C77.Z", "2C76.0", "carcinoma of uterine cervix", "سرطانة عنق الرحم");
  }
}
