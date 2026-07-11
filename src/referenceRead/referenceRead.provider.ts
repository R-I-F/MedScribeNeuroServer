import { inject, injectable } from "inversify";
import { DataSource } from "typeorm";
import { MainDiagEntity } from "../mainDiag/mainDiag.mDbSchema";
import { AdditionalQuestionsProvider } from "../additionalQuestions/additionalQuestions.provider";

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
  constructor(
    @inject(AdditionalQuestionsProvider)
    private additionalQuestionsProvider: AdditionalQuestionsProvider
  ) {}

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

  /** Legacy /mainDiag list shape (relations + attached six-flag config), one department. */
  public async getMainDiagsByDepartment(ds: DataSource, departmentId: string) {
    const repo = ds.getRepository(MainDiagEntity);
    const mainDiags = await repo.find({
      where: { departmentId },
      relations: ["procs", "diagnosis"],
      order: { createdAt: "DESC" },
    });
    const additionalQuestionsList = await this.additionalQuestionsProvider.getAll(ds);
    const aqByMainDiagId = new Map(additionalQuestionsList.map((aq) => [aq.mainDiagDocId, aq]));
    return mainDiags.map((md) => {
      (md as any).additionalQuestions = aqByMainDiagId.get(md.id) ?? null;
      return md;
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

  /** Legacy /procCpt list shape, scoped transitively via main_diag_procs → main_diags. */
  public async getProcCptsByDepartment(ds: DataSource, departmentId: string) {
    return ds.query(
      `SELECT DISTINCT p."id", p."title", p."alphaCode", p."numCode", p."description", p."createdAt", p."updatedAt"
         FROM "proc_cpts" p
         JOIN "main_diag_procs" mdp ON mdp."procCptId" = p."id"
         JOIN "main_diags" md ON md."id" = mdp."mainDiagId"
        WHERE md."departmentId" = $1
        ORDER BY p."alphaCode", p."numCode"`,
      [departmentId]
    );
  }

  /** Legacy /lecture list shape (id/lectureTitle/mainTopic/level), scoped via lecture_topics. */
  public async getLecturesByDepartment(ds: DataSource, departmentId: string) {
    return ds.query(
      `SELECT l."id", l."lectureTitle", l."mainTopic", l."level"
         FROM "lectures" l
         JOIN "lecture_topics" t ON t."id" = l."topicId"
        WHERE t."departmentId" = $1
        ORDER BY t."sortOrder", l."sortOrder", l."lectureTitle"`,
      [departmentId]
    );
  }
}
