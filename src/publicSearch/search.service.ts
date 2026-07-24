import { inject, injectable } from "inversify";
import { RefApiClient } from "../refApi/refApi.client";
import { IRefProcSearchHit, IRefDiagnosisSearchHit } from "../refApi/refApi.types";

/**
 * Reusable semantic-search core (docs/PUBLIC_SEMANTIC_SEARCH_TOOL_PLAN.md).
 *
 * Calls the hub (RefApiClient) once per selected department (1 or 2), merges the hits by
 * similarity, and shapes them to a stable DTO. Caller-aware: the public tool passes
 * `includeCpt:false` so the AMA-licensed CPT `numCode` is omitted; a future authenticated
 * in-app caller passes its single known department and `includeCpt:true`.
 */

export type SearchType = "procedure" | "diagnosis";

export interface SearchDepartment {
  code: string;
  name: string;
  arName: string;
}

export interface PublicSearchResult {
  kind: SearchType;
  department: SearchDepartment;
  mainDiagnosis: { title: string; arTitle: string | null } | null;
  diagnosis?: { icdCode: string; icdName: string; icdArName: string };
  procedure?: { title: string; arTitle: string | null; alphaCode: string; numCode?: string };
  description: string;
  arDescription: string | null;
  similarity: number;
}

export interface SearchParams {
  query: string;
  type: SearchType;
  departments: SearchDepartment[]; // 1 or 2
  limit?: number;
  includeCpt?: boolean; // default false (public); in-app passes true
}

@injectable()
export class SearchService {
  constructor(@inject(RefApiClient) private refApiClient: RefApiClient) {}

  public async search(params: SearchParams): Promise<PublicSearchResult[]> {
    const limit = params.limit ?? 5;
    const departments = params.departments.slice(0, 2);
    const perDept = Math.max(limit, 5);

    // One hub call per department, in parallel; a failing department degrades to no hits.
    const perDeptResults = await Promise.all(
      departments.map(async (dept) => {
        try {
          if (params.type === "procedure") {
            const hits = await this.refApiClient.procedureSearch(params.query, dept.code, perDept);
            return hits.map((h) => this.shapeProcedure(h, dept, !!params.includeCpt));
          }
          const hits = await this.refApiClient.diagnosisSearch(params.query, dept.code, perDept);
          return hits.map((h) => this.shapeDiagnosis(h, dept));
        } catch (err: any) {
          console.warn(`[Search] department ${dept.code} search failed: ${err?.message ?? err}`);
          return [] as PublicSearchResult[];
        }
      })
    );

    const merged = perDeptResults.flat();
    merged.sort((a, b) => b.similarity - a.similarity);
    return merged.slice(0, limit);
  }

  private mainDiag(mainDiagnoses: { title: string; arTitle: string | null }[] | undefined) {
    const first = mainDiagnoses?.[0];
    return first ? { title: first.title, arTitle: first.arTitle } : null;
  }

  private shapeProcedure(
    h: IRefProcSearchHit,
    department: SearchDepartment,
    includeCpt: boolean
  ): PublicSearchResult {
    return {
      kind: "procedure",
      department,
      mainDiagnosis: this.mainDiag(h.mainDiagnoses),
      procedure: {
        title: h.title,
        arTitle: h.arTitle,
        alphaCode: h.alphaCode,
        ...(includeCpt ? { numCode: h.numCode } : {}),
      },
      description: h.description,
      arDescription: h.arDescription,
      similarity: h.similarity,
    };
  }

  private shapeDiagnosis(h: IRefDiagnosisSearchHit, department: SearchDepartment): PublicSearchResult {
    return {
      kind: "diagnosis",
      department,
      mainDiagnosis: this.mainDiag(h.mainDiagnoses),
      diagnosis: { icdCode: h.icdCode, icdName: h.icdName, icdArName: h.icdArName },
      description: h.description,
      arDescription: h.arDescription,
      similarity: h.similarity,
    };
  }
}
