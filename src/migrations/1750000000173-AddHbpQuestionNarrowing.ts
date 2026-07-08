import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * HBP additional-questions professor authoring — part 2 of 2 (part 1: migration 172).
 * Design record: MEDICAL_CODE_AUDITS/HBP/QUESTIONS_HBP.md.
 *
 * Narrowing so each category only offers its real modalities/sites (pancreatic cancer never
 * offers "percutaneous"; a liver resection category never offers "pancreatic tail"; acute
 * pancreatitis keeps the full step-up ladder percutaneous → endoscopic → surgical).
 * 68 approach + 22 region = 90 rows. No narrowing for urgency/childPugh.
 */
export class AddHbpQuestionNarrowing1750000000173 implements MigrationInterface {
  name = "AddHbpQuestionNarrowing1750000000173";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const LAP = "laparoscopic";
    const LAPC = "laparoscopic converted to open";
    const OPEN = "open";
    const ROBOT = "robotic-assisted";
    const ERCP = "endoscopic (ercp)";
    const PERC = "percutaneous";
    const OTHER = "other";

    const RLIVER = "right hemiliver";
    const LLIVER = "left hemiliver";
    const BILOBAR = "bilobar / multiple segments";
    const INTRAHEP = "intrahepatic ducts";
    const HILAR = "perihilar (hilar)";
    const DISTAL = "mid / distal bile duct";
    const PHEAD = "pancreatic head / uncinate";
    const PBODY = "pancreatic body";
    const PTAIL = "pancreatic tail";
    const PDIFF = "diffuse pancreas";

    const narrowing: Array<{ key: string; sets: Record<string, string[]> }> = [
      {
        key: "approach",
        sets: {
          "acute pancreatitis": [PERC, ERCP, LAP, LAPC, OPEN, OTHER],
          "ampullary cancer": [OPEN, LAP, LAPC, ROBOT, ERCP, OTHER],
          "benign liver lesions": [LAP, LAPC, OPEN, ROBOT, PERC, OTHER],
          "bile duct injuries": [OPEN, LAP, LAPC, ERCP, PERC, OTHER],
          "biliary stricture": [ERCP, PERC, OPEN, LAP, LAPC, OTHER],
          "cholangiocarcinoma": [OPEN, LAP, LAPC, ROBOT, OTHER],
          "cholecystitis & choledocholithiasis": [LAP, LAPC, OPEN, ERCP, PERC, OTHER],
          "chronic pancreatitis": [OPEN, LAP, LAPC, ERCP, OTHER],
          "hepatocellular carcinoma": [LAP, LAPC, OPEN, ROBOT, PERC, OTHER],
          "liver cirrhosis & portal hypertension": [ERCP, OPEN, LAP, LAPC, OTHER],
          "metastatic liver disease": [LAP, LAPC, OPEN, ROBOT, PERC, OTHER],
          "pancreatic cancer": [OPEN, LAP, LAPC, ROBOT, OTHER],
        },
      },
      {
        key: "region",
        sets: {
          "benign liver lesions": [RLIVER, LLIVER, BILOBAR],
          "hepatocellular carcinoma": [RLIVER, LLIVER, BILOBAR],
          "metastatic liver disease": [RLIVER, LLIVER, BILOBAR],
          "cholangiocarcinoma": [INTRAHEP, HILAR, DISTAL],
          "biliary stricture": [HILAR, DISTAL, INTRAHEP],
          "pancreatic cancer": [PHEAD, PBODY, PTAIL],
          "chronic pancreatitis": [PHEAD, PDIFF, PBODY, PTAIL],
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
        JOIN "departments" d ON d."code" = 'HBP'
        JOIN "main_diags" md ON md."departmentId" = d."id" AND md."title" = m.title
        JOIN "additional_questions" q ON q."departmentId" = d."id" AND q."key" = '${block.key}'
        JOIN "question_options" o ON o."questionId" = q."id" AND o."value" = m.value
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // HBP had zero narrowing rows before this migration — remove them all.
    await queryRunner.query(`
      DELETE FROM "main_diag_question_options" n
      USING "additional_questions" q, "departments" d
      WHERE n."questionId" = q."id" AND q."departmentId" = d."id" AND d."code" = 'HBP'
    `);
  }
}
