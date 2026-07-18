import { injectable } from "inversify";
import { DataSource } from "typeorm";
import { MainDiagEntity } from "../mainDiag/mainDiag.mDbSchema";

/**
 * Department-scoped reads over the reference mirror (KA spoke, full institute).
 *
 * The mirror now carries ALL departments (mirroring the hub's wiring:
 * main_diags.departmentId, department_diagnoses, lecture_topics.departmentId +
 * lectures.topicId), so every list read MUST be scoped to one department — otherwise the
 * legacy endpoints would dump the whole 15-department catalog into a single department's
 * frontend. Callers resolve the department from the `?deptCode=` query parameter, falling
 * back to REF_DEPT_CODE (the institute's original/default department).
 */
@injectable()
export class ReferenceReadProvider {

  /** Resolve a mirror department id from its code (case-insensitive); null when unknown. */
  public async resolveDepartmentId(ds: DataSource, deptCode: string): Promise<string | null> {
    const rows = await ds.query(
      `SELECT "id" FROM "departments" WHERE UPPER("code") = UPPER($1)`,
      [deptCode]
    );
    return rows[0]?.id ?? null;
  }

  /** True when the given department id exists in the mirror. */
  public async departmentExists(ds: DataSource, departmentId: string): Promise<boolean> {
    const rows = await ds.query(`SELECT 1 FROM "departments" WHERE "id" = $1`, [departmentId]);
    return rows.length > 0;
  }

  /** All mirrored departments (for pickers): id, code, bilingual name, flags. */
  public async getDepartments(ds: DataSource) {
    return ds.query(
      `SELECT "id", "code", "name", "arName", "isAcademic", "isPractical"
         FROM "departments"
        ORDER BY "name"`
    );
  }

  /** Legacy /mainDiag list shape (relations), one department. */
  public async getMainDiagsByDepartment(ds: DataSource, departmentId: string) {
    const repo = ds.getRepository(MainDiagEntity);
    return repo.find({
      where: { departmentId },
      relations: ["procs", "diagnosis"],
      order: { createdAt: "DESC" },
    });
  }

  /** Legacy /diagnosis list shape, scoped via department_diagnoses. */
  public async getDiagnosesByDepartment(ds: DataSource, departmentId: string) {
    return ds.query(
      `SELECT dx."id", dx."icdCode", dx."icdName", dx."neuroLogName", dx."createdAt", dx."updatedAt"
         FROM "diagnoses" dx
         JOIN "department_diagnoses" dd ON dd."diagnosisId" = dx."id"
        WHERE dd."departmentId" = $1
        ORDER BY dx."icdName"`,
      [departmentId]
    );
  }

  /**
   * Legacy /procCpt list shape (+ additive `arTitle` since the honest-mirror resync —
   * the calendar form shows Arabic procedure names from it), scoped transitively via
   * main_diag_procs → main_diags.
   */
  public async getProcCptsByDepartment(ds: DataSource, departmentId: string) {
    return ds.query(
      `SELECT DISTINCT p."id", p."title", p."arTitle", p."alphaCode", p."numCode", p."description", p."createdAt", p."updatedAt"
         FROM "proc_cpts" p
         JOIN "main_diag_procs" mdp ON mdp."procCptId" = p."id"
         JOIN "main_diags" md ON md."id" = mdp."mainDiagId"
        WHERE md."departmentId" = $1
        ORDER BY p."alphaCode", p."numCode"`,
      [departmentId]
    );
  }

  /**
   * Legacy /lecture list shape (id/lectureTitle/mainTopic/level), scoped via lecture_topics.
   * The mirror now carries the hub's column names (migration 1783782610090: `title`, no
   * `mainTopic`) — the legacy field names are restored here by aliasing: `lectureTitle` =
   * lecture title, `mainTopic` = the parent topic's title. Additive since the hub-scaled
   * schema: `lectureNumber` (outline number, its own column now) + `arTitle` — the CM
   * event form shows/searches both.
   */
  public async getLecturesByDepartment(ds: DataSource, departmentId: string) {
    return ds.query(
      `SELECT l."id", l."title" AS "lectureTitle", t."title" AS "mainTopic", l."level",
              l."lectureNumber", l."arTitle"
         FROM "lectures" l
         JOIN "lecture_topics" t ON t."id" = l."topicId"
        WHERE t."departmentId" = $1
        ORDER BY t."sortOrder", l."sortOrder", l."title"`,
      [departmentId]
    );
  }

  /** Legacy /lecture/:id shape — the pre-conform mirror row (lectureTitle/mainTopic/google_uid kept). */
  public async getLectureById(ds: DataSource, id: string) {
    const rows = await ds.query(
      `SELECT l."id", l."title" AS "lectureTitle", t."title" AS "mainTopic", l."arTitle",
              l."lectureNumber", l."sortOrder", l."level", l."topicId",
              NULL AS "google_uid", l."createdAt", l."updatedAt"
         FROM "lectures" l
         LEFT JOIN "lecture_topics" t ON t."id" = l."topicId"
        WHERE l."id" = $1`,
      [id]
    );
    return rows[0] ?? null;
  }

  /**
   * Dynamic additional questions for a main-diagnosis, from the hub-synced mirror
   * (ref_questions / main_diag_questions / ref_question_options / main_diag_question_options).
   * Reproduces the hub's /v1/refAdditionalQuestions/main-diag/:id shape: each attached
   * question with per-diag isRequired/sortOrder and its narrowed option set. free_text
   * questions carry an empty options array. Replaces the legacy six-flag config.
   */
  public async getQuestionsByMainDiag(ds: DataSource, mainDiagId: string) {
    const rows = await ds.query(
      `
      SELECT
        q."id", q."key", q."label", q."arLabel", q."inputType",
        mdq."isRequired", mdq."sortOrder",
        COALESCE(
          json_agg(
            json_build_object('id', o."id", 'value', o."value", 'arValue', o."arValue", 'sortOrder', o."sortOrder")
            ORDER BY o."sortOrder", o."value"
          ) FILTER (WHERE o."id" IS NOT NULL),
          '[]'
        ) AS "options"
      FROM "main_diag_questions" mdq
      JOIN "ref_questions" q ON q."id" = mdq."questionId"
      LEFT JOIN "main_diag_question_options" mdqo
        ON mdqo."mainDiagId" = mdq."mainDiagId" AND mdqo."questionId" = mdq."questionId"
      LEFT JOIN "ref_question_options" o ON o."id" = mdqo."optionId"
      WHERE mdq."mainDiagId" = $1
      GROUP BY q."id", q."key", q."label", q."arLabel", q."inputType", mdq."isRequired", mdq."sortOrder"
      ORDER BY mdq."sortOrder", q."key"
      `,
      [mainDiagId]
    );
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
