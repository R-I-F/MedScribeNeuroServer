import { injectable } from "inversify";
import { ReferenceDataSource, ensureReferenceDbInitialized } from "../config/referenceDb.config";
import { IRefQuestion } from "./refAdditionalQuestions.interface";

/**
 * Read access to the scaled additional-questions framework in defaultdb
 * (additional_questions / question_options / main_diag_questions /
 * main_diag_question_options). Raw parameterized SQL on ReferenceDataSource,
 * same pattern as DiagnosisSearchService — no entities.
 */
@injectable()
export class RefAdditionalQuestionsProvider {
  private readonly uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  private readonly optionsJson = `
    COALESCE(
      json_agg(
        json_build_object(
          'id', o."id",
          'value', o."value",
          'arValue', o."arValue",
          'sortOrder', o."sortOrder"
        )
        ORDER BY o."sortOrder", o."value"
      ) FILTER (WHERE o."id" IS NOT NULL),
      '[]'
    ) AS "options"`;

  /** All active questions (+ active options) defined for a department, by dept code. */
  public async getByDepartmentCode(deptCode: string): Promise<IRefQuestion[]> | never {
    try {
      await ensureReferenceDbInitialized();
      const rows = await ReferenceDataSource.query(
        `
        SELECT
          q."id", q."key", q."label", q."arLabel", q."inputType",
          q."isRequired", q."sortOrder",
          ${this.optionsJson}
        FROM "additional_questions" q
        JOIN "departments" d ON d."id" = q."departmentId" AND d."code" = $1
        LEFT JOIN "question_options" o ON o."questionId" = q."id" AND o."isActive" = TRUE
        WHERE q."isActive" = TRUE
        GROUP BY q."id"
        ORDER BY q."sortOrder", q."key"
        `,
        [deptCode.toUpperCase()]
      );
      return this.mapRows(rows);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  /**
   * Questions attached to a main_diag via main_diag_questions, with per-diag
   * isRequired/sortOrder overrides applied. Options are narrowed by
   * main_diag_question_options when subset rows exist for the (mainDiag, question);
   * otherwise all of the question's active options apply.
   */
  public async getByMainDiagId(mainDiagId: string): Promise<IRefQuestion[]> | never {
    try {
      if (!this.uuidRegex.test(mainDiagId)) {
        throw new Error("Invalid mainDiagId format");
      }
      await ensureReferenceDbInitialized();
      const rows = await ReferenceDataSource.query(
        `
        SELECT
          q."id", q."key", q."label", q."arLabel", q."inputType",
          COALESCE(mdq."isRequired", q."isRequired") AS "isRequired",
          COALESCE(mdq."sortOrder", q."sortOrder")   AS "sortOrder",
          ${this.optionsJson}
        FROM "main_diag_questions" mdq
        JOIN "additional_questions" q ON q."id" = mdq."questionId" AND q."isActive" = TRUE
        LEFT JOIN "question_options" o
          ON o."questionId" = q."id" AND o."isActive" = TRUE
          AND (
            NOT EXISTS (
              SELECT 1 FROM "main_diag_question_options" n
              WHERE n."mainDiagId" = mdq."mainDiagId" AND n."questionId" = mdq."questionId"
            )
            OR EXISTS (
              SELECT 1 FROM "main_diag_question_options" n
              WHERE n."mainDiagId" = mdq."mainDiagId" AND n."questionId" = mdq."questionId"
                AND n."optionId" = o."id"
            )
          )
        WHERE mdq."mainDiagId" = $1
        GROUP BY q."id", mdq."isRequired", mdq."sortOrder"
        ORDER BY COALESCE(mdq."sortOrder", q."sortOrder"), q."key"
        `,
        [mainDiagId]
      );
      return this.mapRows(rows);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  private mapRows(rows: any[]): IRefQuestion[] {
    return (rows as any[]).map((r) => ({
      id: r.id,
      key: r.key,
      label: r.label,
      arLabel: r.arLabel ?? null,
      inputType: r.inputType,
      isRequired: Boolean(r.isRequired),
      sortOrder: Number(r.sortOrder),
      options: r.options ?? [],
    }));
  }
}
