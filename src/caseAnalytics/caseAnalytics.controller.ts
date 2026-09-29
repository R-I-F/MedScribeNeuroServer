import { Request, Response } from "express";
import { inject, injectable } from "inversify";
import { CaseAnalyticsService } from "./caseAnalytics.service";
import { InstituteAdminService } from "../instituteAdmin/instituteAdmin.service";
import { AgeBand, AGE_BANDS, CaseAnalyticsFilters } from "./caseAnalytics.provider";
import { buildReportMeta, ReportLang } from "./caseAnalyticsReportModel";
import { buildCaseAnalyticsWorkbook } from "./caseAnalyticsExcel";
import { buildCaseAnalyticsPdf } from "./caseAnalyticsPdf";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Case Analytics controller (docs/CASE_ANALYTICS_TOOL_PLAN.md).
 *
 * Institute-admin surface. The department is AUTO-LOCKED: it is resolved from the calling admin's
 * DB row, never from the JWT departmentId claim, which goes stale after a department switch. An
 * admin cannot widen their own scope; `?deptCode` is honoured only for a caller who is already
 * institution-wide (a department-less admin row, or a superAdmin, who has no admin row at all and
 * passes requireInstituteAdmin hierarchically).
 */
@injectable()
export class CaseAnalyticsController {
  constructor(
    @inject(CaseAnalyticsService) private service: CaseAnalyticsService,
    @inject(InstituteAdminService) private instituteAdminService: InstituteAdminService
  ) {}

  /**
   * Query arrays arrive either repeated (`?hospitalId=a&hospitalId=b`) or comma-separated
   * (`?hospitalId=a,b`). Both are accepted; empty means "filter not applied" (NULL), never an
   * empty array, which would otherwise match nothing.
   */
  private static toList(raw: unknown): string[] | null {
    if (raw == null) return null;
    const flat = (Array.isArray(raw) ? raw : [raw])
      .flatMap((v) => String(v).split(","))
      .map((v) => v.trim())
      .filter((v) => v.length > 0);
    return flat.length ? Array.from(new Set(flat)) : null;
  }

  private static toUuidList(raw: unknown): string[] | null {
    const list = CaseAnalyticsController.toList(raw);
    if (!list) return null;
    const valid = list.filter((v) => UUID_RE.test(v));
    if (valid.length !== list.length) throw new Error("Invalid id in filter");
    return valid.length ? valid : null;
  }

  /** ISO calendar date (YYYY-MM-DD) only. A full timestamp would make the range ambiguous. */
  private static toDate(raw: unknown): string | null {
    if (typeof raw !== "string" || !raw.trim()) return null;
    const v = raw.trim().slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) throw new Error("Dates must be YYYY-MM-DD");
    if (Number.isNaN(Date.parse(v))) throw new Error("Dates must be a real calendar date");
    return v;
  }

  private static parseFilters(req: Request): CaseAnalyticsFilters {
    const q = req.query as Record<string, unknown>;

    const from = CaseAnalyticsController.toDate(q.from);
    const to = CaseAnalyticsController.toDate(q.to);
    if (from && to && from > to) throw new Error("from must not be after to");

    const bands = CaseAnalyticsController.toList(q.ageBand);
    if (bands) {
      const bad = bands.filter((b) => !AGE_BANDS.includes(b as AgeBand));
      if (bad.length) throw new Error(`Unknown age band: ${bad.join(", ")}`);
    }

    const gender = typeof q.gender === "string" ? q.gender.trim() : "";
    if (gender && gender !== "male" && gender !== "female") {
      throw new Error("gender must be male or female");
    }

    return {
      from,
      to,
      hospitalIds: CaseAnalyticsController.toUuidList(q.hospitalId),
      procCptIds: CaseAnalyticsController.toUuidList(q.procCptId),
      // alphaCodes are free-form labels, not ids, and include the "no procedure recorded" sentinel.
      alphaCodes: CaseAnalyticsController.toList(q.alphaCode),
      mainDiagIds: CaseAnalyticsController.toUuidList(q.mainDiagId),
      ageBands: (bands as AgeBand[] | null) ?? null,
      gender: gender ? (gender as "male" | "female") : null,
    };
  }

  private static dataSourceOf(req: Request): any {
    const dataSource = (req as any).institutionDataSource;
    if (!dataSource) throw new Error("Institution DataSource not resolved");
    return dataSource;
  }

  /**
   * The department this request is locked to. Resolved from the admin's DB row. When that is NULL
   * the caller is institution-wide and may narrow with `?deptCode`; a scoped admin's deptCode is
   * ignored, which is what prevents scope widening.
   */
  public async resolveDepartmentScope(req: Request, res: Response): Promise<string | null> {
    const dataSource = CaseAnalyticsController.dataSourceOf(req);
    const jwtPayload = res.locals.jwt as { id?: string; _id?: string } | undefined;
    const own = await this.instituteAdminService.getAdminDepartmentScope(
      jwtPayload?.id || jwtPayload?._id,
      dataSource
    );
    if (own) return own;

    const deptCode = typeof req.query.deptCode === "string" ? req.query.deptCode.trim() : "";
    if (!deptCode) return null;
    if (!/^[A-Za-z]{2,10}$/.test(deptCode)) throw new Error("Invalid deptCode");
    const rows = await dataSource.query(
      `SELECT "id" FROM "departments" WHERE upper("code") = upper($1)`,
      [deptCode]
    );
    if (!rows?.length) throw new Error(`Unknown deptCode: ${deptCode}`);
    return rows[0].id as string;
  }

  public async handleGetFilters(req: Request, res: Response) {
    const dataSource = CaseAnalyticsController.dataSourceOf(req);
    const departmentId = await this.resolveDepartmentScope(req, res);
    return await this.service.getFilters(dataSource, departmentId);
  }

  public async handleGetSummary(req: Request, res: Response) {
    const dataSource = CaseAnalyticsController.dataSourceOf(req);
    const departmentId = await this.resolveDepartmentScope(req, res);
    const filters = CaseAnalyticsController.parseFilters(req);
    const summary = await this.service.getSummary(dataSource, filters, departmentId);
    return { filtersApplied: filters, ...summary };
  }

  /**
   * Shared preamble for both exports: resolve the scope once, then pull the filter option lists
   * (needed to turn filter ids into names), the summary, and the full row set.
   */
  private async buildExportPayload(req: Request, res: Response) {
    const dataSource = CaseAnalyticsController.dataSourceOf(req);
    const departmentId = await this.resolveDepartmentScope(req, res);
    const filters = CaseAnalyticsController.parseFilters(req);
    const lang: ReportLang = req.query.lang === "ar" ? "ar" : "en";

    const [options, summary, cases] = await Promise.all([
      this.service.getFilters(dataSource, departmentId),
      this.service.getSummary(dataSource, filters, departmentId),
      this.service.getAllCasesForExport(dataSource, filters, departmentId),
    ]);

    const meta = buildReportMeta(filters, options as any, lang);
    return { meta, summary, cases };
  }

  /** Streams the workbook. Writes nothing; the file is built in memory and sent. */
  public async handleExportXlsx(req: Request, res: Response) {
    const { meta, summary, cases } = await this.buildExportPayload(req, res);
    const buffer = await buildCaseAnalyticsWorkbook(meta, summary, cases);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${meta.fileStem}.xlsx"`);
    res.setHeader("Content-Length", String(buffer.length));
    res.setHeader("Cache-Control", "private, no-cache");
    res.status(200).end(buffer);
  }

  /**
   * Streams the PDF. The row set is not needed here (the PDF is charts and aggregates, not a case
   * listing), so only the summary is fetched.
   */
  public async handleExportPdf(req: Request, res: Response) {
    const dataSource = CaseAnalyticsController.dataSourceOf(req);
    const departmentId = await this.resolveDepartmentScope(req, res);
    const filters = CaseAnalyticsController.parseFilters(req);
    const lang: ReportLang = req.query.lang === "ar" ? "ar" : "en";

    const [options, summary] = await Promise.all([
      this.service.getFilters(dataSource, departmentId),
      this.service.getSummary(dataSource, filters, departmentId),
    ]);
    const meta = buildReportMeta(filters, options as any, lang);
    const buffer = await buildCaseAnalyticsPdf(meta, summary);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${meta.fileStem}.pdf"`);
    res.setHeader("Content-Length", String(buffer.length));
    res.setHeader("Cache-Control", "private, no-cache");
    res.status(200).end(buffer);
  }

  public async handleGetCases(req: Request, res: Response) {
    const dataSource = CaseAnalyticsController.dataSourceOf(req);
    const departmentId = await this.resolveDepartmentScope(req, res);
    const filters = CaseAnalyticsController.parseFilters(req);
    const page = Number.parseInt(String(req.query.page ?? "1"), 10);
    const pageSize = Number.parseInt(String(req.query.pageSize ?? "100"), 10);
    return await this.service.getCases(
      dataSource,
      filters,
      departmentId,
      Number.isFinite(page) ? page : 1,
      Number.isFinite(pageSize) ? pageSize : 100
    );
  }
}
