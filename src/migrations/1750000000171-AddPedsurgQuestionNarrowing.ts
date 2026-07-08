import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * PEDSURG additional-questions professor authoring — part 2 of 2 (part 1: migration 170).
 * Design record: MEDICAL_CODE_AUDITS/PEDSURG/QUESTIONS_PEDSURG.md.
 *
 * Narrowing so each category only offers its real choices (a pyloromyotomy never offers
 * "thoracoscopic"; appendicitis never offers "premature neonate"; CDH is left/right only —
 * bilateral CDH is vanishingly rare; imperforate anus offers the ARM colostomies, not
 * ileostomies). 45 approach + 20 ageGroup + 17 stomaFormed + 2 laterality = 84 rows.
 */
export class AddPedsurgQuestionNarrowing1750000000171 implements MigrationInterface {
  name = "AddPedsurgQuestionNarrowing1750000000171";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const OPEN = "open";
    const LAP = "laparoscopic";
    const LAPC = "laparoscopic converted to open";
    const THOR = "thoracoscopic";
    const THORC = "thoracoscopic converted to open";
    const OTHER = "other";

    const PREM = "premature neonate";
    const NEO = "term neonate (0-28 days)";
    const INF = "infant (1-12 months)";
    const CHILD = "child (1-12 years)";
    const ADOL = "adolescent (>12 years)";

    const NONE = "none";
    const LOOPC = "loop colostomy";
    const DIVC = "divided (double-barrel) colostomy";
    const LOOPI = "loop ileostomy";
    const ENDI = "end ileostomy";

    const narrowing: Array<{ key: string; sets: Record<string, string[]> }> = [
      {
        key: "approach",
        sets: {
          "appendicitis": [LAP, LAPC, OPEN, OTHER],
          "congenital diaphragmatic hernia": [OPEN, THOR, THORC, OTHER],
          "esophageal atresia": [OPEN, THOR, THORC, OTHER],
          "imperforate anus": [OPEN, LAP, LAPC, OTHER],
          "inguinal hernia": [OPEN, LAP, LAPC, OTHER],
          "intussusception": [LAP, LAPC, OPEN, OTHER],
          "malrotation & volvulus": [LAP, LAPC, OPEN, OTHER],
          "neonatal emergencies": [OPEN, LAP, LAPC, OTHER],
          "pediatric tumor resection": [OPEN, LAP, LAPC, THOR, OTHER],
          "pyloric stenosis": [LAP, OPEN, LAPC, OTHER],
          "thoracic & lung anomalies": [THOR, THORC, OPEN, OTHER],
        },
      },
      {
        key: "ageGroup",
        sets: {
          "appendicitis": [INF, CHILD, ADOL],
          "hydrocele": [INF, CHILD, ADOL],
          "intussusception": [INF, CHILD, ADOL],
          "umbilical hernia": [INF, CHILD, ADOL],
          "imperforate anus": [PREM, NEO, INF, CHILD],
          "congenital diaphragmatic hernia": [PREM, NEO, INF, CHILD],
        },
      },
      {
        key: "stomaFormed",
        sets: {
          "imperforate anus": [NONE, DIVC, LOOPC, OTHER],
          "neonatal emergencies": [NONE, LOOPI, ENDI, LOOPC, OTHER],
          "intussusception": [NONE, ENDI, LOOPI, OTHER],
          "malrotation & volvulus": [NONE, ENDI, LOOPI, OTHER],
        },
      },
      {
        key: "laterality",
        sets: {
          "congenital diaphragmatic hernia": ["left", "right"],
        },
      },
    ];

    for (const block of narrowing) {
      const rows: string[] = [];
      for (const [title, values] of Object.entries(block.sets)) {
        for (const value of values) {
          rows.push(`('${title.replace(/'/g, "''")}', '${value.replace(/'/g, "''")}')`);
        }
      }
      await queryRunner.query(`
        INSERT INTO "main_diag_question_options" ("mainDiagId", "questionId", "optionId")
        SELECT md."id", q."id", o."id"
        FROM (VALUES ${rows.join(",\n          ")}) AS m(title, value)
        JOIN "departments" d ON d."code" = 'PEDSURG'
        JOIN "main_diags" md ON md."departmentId" = d."id" AND md."title" = m.title
        JOIN "additional_questions" q ON q."departmentId" = d."id" AND q."key" = '${block.key}'
        JOIN "question_options" o ON o."questionId" = q."id" AND o."value" = m.value
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // PEDSURG had zero narrowing rows before this migration — remove them all.
    await queryRunner.query(`
      DELETE FROM "main_diag_question_options" n
      USING "additional_questions" q, "departments" d
      WHERE n."questionId" = q."id" AND q."departmentId" = d."id" AND d."code" = 'PEDSURG'
    `);
  }
}
