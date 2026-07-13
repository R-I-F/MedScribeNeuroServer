import { Request, Response } from "express";
import { matchedData } from "express-validator";
import { inject, injectable } from "inversify";
import { AppDataSource } from "../config/database.config";
import { EquipmentService } from "./equipment.service";
import { ReferenceReadProvider } from "../referenceRead/referenceRead.provider";
import { IEquipmentDoc } from "./equipment.interface";

/**
 * Read-only equipment endpoints over the local mirror. List reads are
 * department-scoped: `?deptCode=` (404 if unknown) → JWT departmentId claim →
 * REF_DEPT_CODE, mirroring the referenceRead resolution chain.
 */
@injectable()
export class EquipmentController {
  constructor(
    @inject(EquipmentService) private equipmentService: EquipmentService,
    @inject(ReferenceReadProvider) private refReadProvider: ReferenceReadProvider
  ) {}

  private ds(req: Request) {
    return (req as any).institutionDataSource || AppDataSource;
  }

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

  public async handleGetAll(req: Request, res: Response): Promise<IEquipmentDoc[]> | never {
    const departmentId = await this.departmentId(req, res);
    return await this.equipmentService.getAllByDepartment(departmentId, this.ds(req));
  }

  public async handleGetById(req: Request, res: Response): Promise<IEquipmentDoc | null> | never {
    const validatedReq = matchedData(req) as { id: string };
    return await this.equipmentService.getById(validatedReq.id, this.ds(req));
  }
}
