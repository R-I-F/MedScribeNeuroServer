import { injectable } from "inversify";
import { ReferenceDataSource, ensureReferenceDbInitialized } from "../config/referenceDb.config";
import { IRefLectureTopic } from "./refLectures.interface";

/**
 * Read access to the scaled lectures framework in defaultdb (lecture_topics / lectures).
 * Raw parameterized SQL on ReferenceDataSource, same pattern as RefAdditionalQuestionsProvider —
 * no entities.
 */
@injectable()
export class RefLecturesProvider {
  /**
   * All curriculum topics for a department (by dept code), each with its ordered lectures.
   * Optional `level` filters lectures to msc | md (topics with no matching lecture are dropped).
   */
  public async getByDepartmentCode(
    deptCode: string,
    level?: "msc" | "md"
  ): Promise<IRefLectureTopic[]> | never {
    try {
      await ensureReferenceDbInitialized();
      const rows = await ReferenceDataSource.query(
        `
        SELECT
          lt."id", lt."title", lt."arTitle", lt."sortOrder",
          COALESCE(
            json_agg(
              json_build_object(
                'id', lx."id",
                'lectureNumber', lx."lectureNumber",
                'title', lx."title",
                'arTitle', lx."arTitle",
                'level', lx."level",
                'sortOrder', lx."sortOrder"
              )
              ORDER BY lx."sortOrder", lx."title"
            ) FILTER (WHERE lx."id" IS NOT NULL),
            '[]'
          ) AS "lectures"
        FROM "lecture_topics" lt
        JOIN "departments" d ON d."id" = lt."departmentId" AND d."code" = $1
        LEFT JOIN "lectures" lx
          ON lx."topicId" = lt."id"
          AND ($2::text IS NULL OR lx."level" = $2::text)
        GROUP BY lt."id"
        HAVING $2::text IS NULL OR COUNT(lx."id") > 0
        ORDER BY lt."sortOrder", lt."title"
        `,
        [deptCode.toUpperCase(), level ?? null]
      );
      return (rows as any[]).map((r) => ({
        id: r.id,
        title: r.title,
        arTitle: r.arTitle ?? null,
        sortOrder: Number(r.sortOrder),
        lectures: (r.lectures ?? []).map((l: any) => ({
          id: l.id,
          lectureNumber: l.lectureNumber ?? null,
          title: l.title,
          arTitle: l.arTitle ?? null,
          level: l.level ?? null,
          sortOrder: Number(l.sortOrder),
        })),
      }));
    } catch (err: any) {
      throw new Error(err);
    }
  }
}
