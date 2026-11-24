import { Request, Response } from "express";
import { inject, injectable } from "inversify";
import { CatalogGapsProvider, GapKind, GapStatus } from "./catalogGaps.provider";
import { InstituteAdminService } from "../instituteAdmin/instituteAdmin.service";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STATUSES: GapStatus[] = ["open", "reported", "dismissed"];
const KINDS: GapKind[] = ["procedure", "diagnosis"];

/**
 * "Not in catalogue" list controller (docs/OTHER_FIELD_SEMANTIC_SEARCH_PLAN.md, J5).
 * Department scope follows case analytics: read from the admin's DB row (never the JWT claim);
 * `?deptCode` is honoured only for an already institution-wide caller (superAdmin or a
 * department-less admin), so an admin cannot widen their own scope.
 */
@injectable()
export class CatalogGapsController {
  constructor(
    @inject(CatalogGapsProvider) private provider: CatalogGapsProvider,
    @inject(InstituteAdminService) private instituteAdminService: InstituteAdminService
  ) {}

  private static ds(req: Request): any {
    const ds = (req as any).institutionDataSource;
    if (!ds) throw new Error("Institution DataSource not resolved");
    return ds;
  }

  private async scope(req: Request, res: Response, deptCodeRaw: unknown): Promise<string | null> {
    const ds = CatalogGapsController.ds(req);
    const jwt = res.locals.jwt as { id?: string; _id?: string } | undefined;
    const own = await this.instituteAdminService.getAdminDepartmentScope(jwt?.id || jwt?._id, ds);
    if (own) return own;
    const deptCode = typeof deptCodeRaw === "string" ? deptCodeRaw.trim() : "";
    if (!deptCode) return null;
    if (!/^[A-Za-z]{2,10}$/.test(deptCode)) throw new Error("Invalid deptCode");
    const rows = await ds.query(`SELECT "id" FROM "departments" WHERE upper("code") = upper($1)`, [deptCode]);
    if (!rows?.length) throw new Error(`Unknown deptCode: ${deptCode}`);
    return rows[0].id as string;
  }

  public async handleList(req: Request, res: Response) {
    const departmentId = await this.scope(req, res, req.query.deptCode);
    const status = STATUSES.includes(req.query.status as GapStatus) ? (req.query.status as GapStatus) : null;
    const kind = KINDS.includes(req.query.kind as GapKind) ? (req.query.kind as GapKind) : null;
    return this.provider.list(CatalogGapsController.ds(req), { departmentId, status, kind });
  }

  public async handleSetStatus(req: Request, res: Response) {
    const b = (req.body ?? {}) as Record<string, unknown>;
    if (!STATUSES.includes(b.status as GapStatus)) throw new Error("Invalid status");
    if (!KINDS.includes(b.kind as GapKind)) throw new Error("Invalid kind");
    const normalizedText = typeof b.normalizedText === "string" ? b.normalizedText : "";
    if (!normalizedText || normalizedText.length > 120) throw new Error("Invalid normalizedText");
    const mainDiagId = b.mainDiagId == null || b.mainDiagId === "" ? null : String(b.mainDiagId);
    if (mainDiagId && !UUID_RE.test(mainDiagId)) throw new Error("Invalid mainDiagId");
    const departmentId = await this.scope(req, res, b.deptCode);
    const updated = await this.provider.setStatus(CatalogGapsController.ds(req), {
      departmentId,
      kind: b.kind as GapKind,
      mainDiagId,
      normalizedText,
      status: b.status as GapStatus,
    });
    if (updated === 0) throw new Error("Not found");
    return { updated };
  }
}
