import { inject, injectable } from "inversify";
import { DataSource } from "typeorm";
import { InAppSearchProvider, Actor, InAppSearchInput } from "./inAppSearch.provider";

/** Thin passthrough to the provider (docs/IN_FORM_SEMANTIC_SEARCH_PLAN.md). */
@injectable()
export class InAppSearchController {
  constructor(
    @inject(InAppSearchProvider) private provider: InAppSearchProvider
  ) {}

  handleQuery(actor: Actor, input: InAppSearchInput, ds: DataSource) {
    return this.provider.query(actor, input, ds);
  }
}
