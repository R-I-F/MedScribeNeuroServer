import "reflect-metadata";
import { inject, injectable } from "inversify";
import { DataSource } from "typeorm";
import { InAppSearchService } from "./inAppSearch.service";
import { SearchService, SearchType, PublicSearchResult } from "../publicSearch/search.service";

/**
 * Authenticated in-form semantic search (docs/IN_FORM_SEMANTIC_SEARCH_PLAN.md).
 *
 * Reuses the shared SearchService, scoped to the logged-in user's department (resolved from
 * the JWT `departmentId` claim, the SAME resolution `/mainDiag` uses, so results always match
 * the tree the submission form already loaded). Enforces a per-user daily quota (default 5 per
 * UTC day) via a DB count. `includeCpt:true` because these are authenticated institutional users.
 */

const numEnv = (name: string, def: number): number =>
  Number(process.env[name]) > 0 ? Number(process.env[name]) : def;
const getMaxPerDay = () => numEnv("IN_APP_SEARCH_MAX_PER_DAY", 5);

export interface InAppSearchInput {
  query: string;
  type: SearchType;
}
export interface Actor {
  userId: string;
  userRole: string;
  departmentId?: string | null; // JWT claim (departments mirror id)
}
export type InAppQueryResult =
  | { status: "ok"; results: PublicSearchResult[]; remaining: number }
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
    const max = getMaxPerDay();
    const startOfUtcDay = new Date();
    startOfUtcDay.setUTCHours(0, 0, 0, 0);

    const used = await this.events.countByUserSince(actor.userId, startOfUtcDay, dataSource);
    if (used >= max) return { status: "quota_exhausted", remaining: 0 };

    const dept = await this.resolveDepartment(actor.departmentId, dataSource);

    // Spend the credit before running (a search attempt counts), mirroring the public tool.
    await this.events.record(
      { userId: actor.userId, userRole: actor.userRole, departmentId: dept.id, type: input.type },
      dataSource
    );

    const results = await this.searchService.search({
      query: input.query,
      type: input.type,
      departments: [{ code: dept.code, name: dept.name, arName: dept.arName }],
      limit: 5,
      includeCpt: true, // authenticated institutional users may see the CPT numCode (D5)
    });
    return { status: "ok", results, remaining: Math.max(0, max - (used + 1)) };
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
