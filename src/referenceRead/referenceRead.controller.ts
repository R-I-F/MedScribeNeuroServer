import { Request, Response } from "express";
import { inject, injectable } from "inversify";
import { matchedData } from "express-validator";
import { AppDataSource } from "../config/database.config";
import { MainDiagService } from "../mainDiag/mainDiag.service";
import { ReferenceReadProvider } from "./referenceRead.provider";

/**
 * Read-only reference endpoints (KA spoke, full institute).
 *
 * Replaces the legacy CRUD controllers for `/mainDiag`, `/diagnosis`, `/procCpt`,
 * `/lecture`. Reads come from the LOCAL MIRROR TABLES (kept synced from the hub) so IDs
 * and shapes are byte-identical to the old endpoints and submissions' FKs are preserved.
 *
 * The mirror carries ALL departments, so every LIST read is department-scoped:
 * `?deptCode=XXX` selects the department; omitted → REF_DEPT_CODE (the institute's
 * original/default department) so the pre-multi-department frontend behaves unchanged.
 * By-id reads stay unscoped (ids are globally unique). Writes on these paths are gone (404).
 */
@injectable()
export class ReferenceReadController {
  constructor(
    @inject(MainDiagService) private mainDiagService: MainDiagService,
    @inject(ReferenceReadProvider) private refReadProvider: ReferenceReadProvider
  ) {}

  private ds(req: Request) {
    return (req as any).institutionDataSource || AppDataSource;
  }

  /**
   * Resolve the requested department to a mirror department id.
   * Chain: explicit `?deptCode=` (404 if unknown) → the JWT's departmentId claim
   * (silently skipped if stale/unknown) → REF_DEPT_CODE (the institute default).
   */
  private async departmentId(req: Request, res: Response): Promise<string> {
    const ds = this.ds(req);
    const validated = matchedData(req, { locations: ["query"] }) as { deptCode?: string };

    if (validated.deptCode) {
      const id = await this.refReadProvider.resolveDepartmentId(ds, validated.deptCode);
      if (!id) {
        throw Object.assign(new Error(`Unknown department code: ${validated.deptCode}`), {
          status: 404,
        });
      }
      return id;
    }

    const jwtDepartmentId = (res.locals as any)?.jwt?.departmentId as string | undefined;
    if (jwtDepartmentId && (await this.refReadProvider.departmentExists(ds, jwtDepartmentId))) {
      return jwtDepartmentId;
    }

    const code = process.env.REF_DEPT_CODE || "NS";
    const id = await this.refReadProvider.resolveDepartmentId(ds, code);
    if (!id) {
      throw Object.assign(new Error(`Default department code not in mirror: ${code}`), {
        status: 500,
      });
    }
    return id;
  }

  public async getDepartments(req: Request, _res: Response) {
    return this.refReadProvider.getDepartments(this.ds(req));
  }

  public async getAllMainDiags(req: Request, res: Response) {
    const departmentId = await this.departmentId(req, res);
    return this.refReadProvider.getMainDiagsByDepartment(this.ds(req), departmentId);
  }

  public async getMainDiagById(req: Request, _res: Response) {
    const validated = matchedData(req) as { id: string };
    const id = validated.id ?? req.params.id;
    return this.mainDiagService.getMainDiagById({ id }, this.ds(req));
  }

  public async getAllDiagnoses(req: Request, res: Response) {
    const departmentId = await this.departmentId(req, res);
    return this.refReadProvider.getDiagnosesByDepartment(this.ds(req), departmentId);
  }

  public async getAllProcCpts(req: Request, res: Response) {
    const departmentId = await this.departmentId(req, res);
    return this.refReadProvider.getProcCptsByDepartment(this.ds(req), departmentId);
  }

  public async getAllLectures(req: Request, res: Response) {
    const departmentId = await this.departmentId(req, res);
    return this.refReadProvider.getLecturesByDepartment(this.ds(req), departmentId);
  }

  public async getLectureById(req: Request, _res: Response) {
    const id = req.params.id;
    return this.refReadProvider.getLectureById(this.ds(req), id);
  }

  /** Dynamic additional questions (+ options) for a main-diagnosis, from the mirror. */
  public async getQuestionsByMainDiag(req: Request, _res: Response) {
    const id = (req.params.mainDiagId ?? req.params.id) as string;
    return this.refReadProvider.getQuestionsByMainDiag(this.ds(req), id);
  }
}
