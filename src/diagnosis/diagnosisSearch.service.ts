import { inject, injectable } from "inversify";
import { ReferenceDataSource, ensureReferenceDbInitialized } from "../config/referenceDb.config";
import { AiAgentService } from "../aiAgent/aiAgent.service";

/** A linked main diagnosis (department-scoped) for a matched diagnosis. */
export interface IMainDiagnosisRef {
  title: string;
  arTitle: string;
}

/** A single semantic-search match. */
export interface IDiagnosisSearchResult {
  icdCode: string;
  icdName: string;
  icdArName: string;
  description: string;
  arDescription: string;
  /** Cosine similarity in [0,1]; higher is closer. */
  similarity: number;
  /** Main diagnoses this diagnosis is linked to within the requested department. */
  mainDiagnoses: IMainDiagnosisRef[];
}

/**
 * Semantic diagnosis search over the shared reference data in defaultdb.
 *
 * Given a department and a free-text description (EN or AR), embeds the query with
 * Gemini and finds the nearest diagnoses by meaning (pgvector cosine `<=>`), scoped
 * to the department via `department_diagnoses`. Each result carries the department's
 * linked main diagnosis (via `main_diag_diagnoses` -> `main_diags.departmentId`).
 */
@injectable()
export class DiagnosisSearchService {
  constructor(
    @inject(AiAgentService) private aiAgentService: AiAgentService
  ) {}

  public async searchByDepartment(
    departmentId: string,
    queryText: string,
    limit = 5
  ): Promise<IDiagnosisSearchResult[]> {
    await ensureReferenceDbInitialized();

    const embedding = await this.aiAgentService.embedText(queryText, "RETRIEVAL_QUERY");
    // pgvector accepts a textual `[v1,v2,...]` literal cast to ::vector.
    const vectorLiteral = `[${embedding.join(",")}]`;

    const rows = await ReferenceDataSource.query(
      `
      SELECT
        d."icdCode"        AS "icdCode",
        d."icdName"        AS "icdName",
        d."icdArName"      AS "icdArName",
        d."description"    AS "description",
        d."arDescription"  AS "arDescription",
        1 - (d."embedding" <=> $1::vector) AS "similarity",
        COALESCE(
          json_agg(
            json_build_object('title', md."title", 'arTitle', md."arTitle")
          ) FILTER (WHERE md."id" IS NOT NULL),
          '[]'
        ) AS "mainDiagnoses"
      FROM "diagnoses" d
      JOIN "department_diagnoses" dd
        ON dd."diagnosisId" = d."id" AND dd."departmentId" = $2
      LEFT JOIN "main_diag_diagnoses" mdd
        ON mdd."diagnosisId" = d."id"
      LEFT JOIN "main_diags" md
        ON md."id" = mdd."mainDiagId" AND md."departmentId" = $2
      WHERE d."embedding" IS NOT NULL
      GROUP BY d."id"
      ORDER BY d."embedding" <=> $1::vector
      LIMIT $3
      `,
      [vectorLiteral, departmentId, limit]
    );

    return (rows as any[]).map((r) => ({
      icdCode: r.icdCode,
      icdName: r.icdName,
      icdArName: r.icdArName,
      description: r.description,
      arDescription: r.arDescription,
      similarity: Number(r.similarity),
      mainDiagnoses: (r.mainDiagnoses ?? []) as IMainDiagnosisRef[],
    }));
  }
}
