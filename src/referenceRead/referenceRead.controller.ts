import { Request, Response } from "express";
import { inject, injectable } from "inversify";
import { matchedData } from "express-validator";
import { AppDataSource } from "../config/database.config";
import { MainDiagService } from "../mainDiag/mainDiag.service";
import { LectureProvider } from "../lecture/lecture.provider";
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
    @inject(LectureProvider) private lectureProvider: LectureProvider,
    @inject(ReferenceReadProvider) private refReadProvider: ReferenceReadProvider
  ) {}

  private ds(req: Request) {
    return (req as any).institutionDataSource || AppDataSource;
  }

  /** Resolve the requested department (query param → default) to a mirror department id. */
  private async departmentId(req: Request): Promise<string> {
    const validated = matchedData(req, { locations: ["query"] }) as { deptCode?: string };
    const code = validated.deptCode || process.env.REF_DEPT_CODE || "NS";
    const id = await this.refReadProvider.resolveDepartmentId(this.ds(req), code);
    if (!id) {
      throw Object.assign(new Error(`Unknown department code: ${code}`), { status: 404 });
    }
    return id;
  }

  public async getAllMainDiags(req: Request, _res: Response) {
    const departmentId = await this.departmentId(req);
    return this.refReadProvider.getMainDiagsByDepartment(this.ds(req), departmentId);
  }

  public async getMainDiagById(req: Request, _res: Response) {
    const validated = matchedData(req) as { id: string };
    const id = validated.id ?? req.params.id;
    return this.mainDiagService.getMainDiagById({ id }, this.ds(req));
  }

  public async getAllDiagnoses(req: Request, _res: Response) {
    const departmentId = await this.departmentId(req);
    return this.refReadProvider.getDiagnosesByDepartment(this.ds(req), departmentId);
  }

  public async getAllProcCpts(req: Request, _res: Response) {
    const departmentId = await this.departmentId(req);
    return this.refReadProvider.getProcCptsByDepartment(this.ds(req), departmentId);
  }

  public async getAllLectures(req: Request, _res: Response) {
    const departmentId = await this.departmentId(req);
    return this.refReadProvider.getLecturesByDepartment(this.ds(req), departmentId);
  }

  public async getLectureById(req: Request, _res: Response) {
    const id = req.params.id;
    return this.lectureProvider.getLectureById(id, this.ds(req));
  }
}
