import "reflect-metadata";
import { inject, injectable } from "inversify";
import { DataSource } from "typeorm";
import { InAppSearchService, InAppSearchPurpose } from "./inAppSearch.service";
import { SearchService, SearchType, PublicSearchResult } from "../publicSearch/search.service";

/**
 * Authenticated in-form semantic search.
 *
 * Two purposes share this path:
 * - 'assist' (docs/IN_FORM_SEMANTIC_SEARCH_PLAN.md): the optional AI assist above Main Diagnosis,
 *   5 per user per UTC day (IN_APP_SEARCH_MAX_PER_DAY).
 * - 'missing' (docs/OTHER_FIELD_SEMANTIC_SEARCH_PLAN.md): the "Not listed?" search that replaces the
 *   bare "Other" tile, 20 per user per UTC day (IN_APP_MISSING_SEARCH_MAX_PER_DAY), counted apart.
 *
 * Department comes from the JWT `departmentId` claim (same resolution `/mainDiag` uses), so hits
 * map back onto the tree the form loaded. Every search is logged with what was typed, what came
 * back and (via setOutcome) what the user did next.
 */

const numEnv = (name: string, def: number): number =>
  Number(process.env[name]) > 0 ? Number(process.env[name]) : def;
const maxPerDay = (purpose: InAppSearchPurpose) =>
  purpose === "missing" ? numEnv("IN_APP_MISSING_SEARCH_MAX_PER_DAY", 20) : numEnv("IN_APP_SEARCH_MAX_PER_DAY", 5);

/** The catalogue's "other" rows; never offered as a search result. */
export const OTHER_PROC_NUMCODE = "00000-00";
export const OTHER_DIAG_ICDCODE = "AAAA";

export interface InAppSearchInput {
  query: string;
  type: SearchType;
  purpose?: InAppSearchPurpose;
  mainDiagId?: string | null;
}
export interface Actor {
  userId: string;
  userRole: string;
  departmentId?: string | null; // JWT claim (departments mirror id)
}
export type InAppSearchHit = PublicSearchResult & { inCurrentMainDiag: boolean };
export type InAppQueryResult =
  | { status: "ok"; eventId: string; results: InAppSearchHit[]; remaining: number }
  | { status: "quota_exhausted"; remaining: 0 };

@injectable()
export class InAppSearchProvider {
  constructor(
    @inject(InAppSearchService) private events: InAppSearchService,
    @inject(SearchService) private searchService: SearchService
  ) {}

  public async query(
    actor: Actor,
    input: InAppSearchInput,
    dataSource: DataSource
  ): Promise<InAppQueryResult> {
    const purpose: InAppSearchPurpose = input.purpose === "missing" ? "missing" : "assist";
    const max = maxPerDay(purpose);
    const startOfUtcDay = new Date();
    startOfUtcDay.setUTCHours(0, 0, 0, 0);

    const used = await this.events.countByUserSince(actor.userId, purpose, startOfUtcDay, dataSource);
    if (used >= max) return { status: "quota_exhausted", remaining: 0 };

    const dept = await this.resolveDepartment(actor.departmentId, dataSource);
    const mainDiagId = input.mainDiagId ?? null;

    // Spend the credit and log the query before running (a search attempt counts).
    const eventId = await this.events.record(
      {
        userId: actor.userId,
        userRole: actor.userRole,
        departmentId: dept.id,
        type: input.type,
        purpose,
        query: input.query,
        mainDiagId,
      },
      dataSource
    );

    const raw = await this.searchService.search({
      query: input.query,
      type: input.type,
      departments: [{ code: dept.code, name: dept.name, arName: dept.arName }],
      limit: 10, // fetch extra so dropping the "other" rows still leaves 5
      includeCpt: true, // authenticated institutional users may see the CPT numCode (D5)
    });

    const real = raw.filter((r) =>
      r.kind === "procedure"
        ? r.procedure?.numCode !== OTHER_PROC_NUMCODE
        : r.diagnosis?.icdCode !== OTHER_DIAG_ICDCODE
    );
    const inCurrent = await this.codesInMainDiag(mainDiagId, input.type, real, dataSource);
    const results: InAppSearchHit[] = real
      .map((r) => ({ ...r, inCurrentMainDiag: inCurrent.has(this.codeOf(r) ?? "") }))
      // Stable: in-category hits first, each group keeps the similarity order.
      .sort((a, b) => Number(b.inCurrentMainDiag) - Number(a.inCurrentMainDiag))
      .slice(0, 5);

    await this.events.saveResults(
      eventId,
      results.map((r) => ({
        kind: r.kind,
        code: this.codeOf(r),
        title: r.kind === "procedure" ? r.procedure?.title : r.diagnosis?.icdName,
        mainDiagTitle: r.mainDiagnosis?.title ?? null,
        inCurrentMainDiag: r.inCurrentMainDiag,
        similarity: Math.round(r.similarity * 1000) / 1000,
      })),
      dataSource
    );

    return { status: "ok", eventId, results, remaining: Math.max(0, max - (used + 1)) };
  }

  /** Record what the user did after a search (own events only). */
  public setOutcome(
    actor: Actor,
    eventId: string,
    outcome: "picked" | "none",
    pickedCode: string | null,
    dataSource: DataSource
  ): Promise<boolean> {
    return this.events.setOutcome(eventId, actor.userId, outcome, outcome === "picked" ? pickedCode : null, dataSource);
  }

  private codeOf(r: PublicSearchResult): string | null {
    return r.kind === "procedure" ? r.procedure?.numCode ?? null : r.diagnosis?.icdCode ?? null;
  }

  /**
   * Which hit codes are linked to the category the user is in. A procedure can sit in several
   * categories while the hub reports only the first, so this is checked against the local mirror.
   */
  private async codesInMainDiag(
    mainDiagId: string | null,
    type: SearchType,
    hits: PublicSearchResult[],
    dataSource: DataSource
  ): Promise<Set<string>> {
    const codes = hits.map((h) => this.codeOf(h)).filter((c): c is string => !!c);
    if (!mainDiagId || codes.length === 0) return new Set();
    const rows =
      type === "procedure"
        ? await dataSource.query(
            `SELECT p."numCode" AS code FROM "main_diag_procs" mp
               JOIN "proc_cpts" p ON p."id" = mp."procCptId"
              WHERE mp."mainDiagId" = $1::uuid AND p."numCode" = ANY($2::text[])`,
            [mainDiagId, codes]
          )
        : await dataSource.query(
            `SELECT d."icdCode" AS code FROM "main_diag_diagnoses" md
               JOIN "diagnoses" d ON d."id" = md."diagnosisId"
              WHERE md."mainDiagId" = $1::uuid AND d."icdCode" = ANY($2::text[])`,
            [mainDiagId, codes]
          );
    return new Set(rows.map((r: { code: string }) => r.code));
  }

  /**
   * Resolve the user's department from the JWT `departmentId` claim (a departments-mirror id),
   * falling back to REF_DEPT_CODE (NS). Returns {id,code,name,arName} for the log + SearchService.
   */
  private async resolveDepartment(
    jwtDepartmentId: string | null | undefined,
    dataSource: DataSource
  ): Promise<{ id: string; code: string; name: string; arName: string }> {
    if (jwtDepartmentId) {
      const rows = await dataSource.query(
        `SELECT "id", "code", "name", "arName" FROM "departments" WHERE "id" = $1 LIMIT 1`,
        [jwtDepartmentId]
      );
      if (rows.length) return rows[0];
    }
    const code = process.env.REF_DEPT_CODE || "NS";
    const rows = await dataSource.query(
      `SELECT "id", "code", "name", "arName" FROM "departments" WHERE UPPER("code") = UPPER($1) LIMIT 1`,
      [code]
    );
    if (rows.length) return rows[0];
    throw new Error("Could not resolve a department for the search");
  }
}
