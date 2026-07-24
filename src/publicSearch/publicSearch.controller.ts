import { inject, injectable } from "inversify";
import { DataSource } from "typeorm";
import {
  PublicSearchProvider,
  StartSessionInput,
  RequestMeta,
} from "./publicSearch.provider";
import { SearchType } from "./search.service";

/** Thin passthrough to the provider (docs/PUBLIC_SEMANTIC_SEARCH_TOOL_PLAN.md). */
@injectable()
export class PublicSearchController {
  constructor(
    @inject(PublicSearchProvider) private provider: PublicSearchProvider
  ) {}

  handleStartSession(input: StartSessionInput, meta: RequestMeta, ds: DataSource) {
    return this.provider.startSession(input, meta, ds);
  }
  handleVerify(sessionId: string, code: string, ds: DataSource) {
    return this.provider.verifyOtp(sessionId, code, ds);
  }
  handleResend(sessionId: string, ds: DataSource) {
    return this.provider.resendOtp(sessionId, ds);
  }
  handleQuery(
    sessionId: string,
    input: { query: string; type: SearchType; deptCodes: string[] },
    ds: DataSource
  ) {
    return this.provider.runQuery(sessionId, input, ds);
  }
  handleExplain(
    sessionId: string,
    input: { kind: SearchType; name: string; description?: string; code: string; departmentName: string; language?: string },
    ds: DataSource
  ) {
    return this.provider.explain(sessionId, input, ds);
  }
}
