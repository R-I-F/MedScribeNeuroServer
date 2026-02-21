import { Request, Response } from "express";
import { matchedData } from "express-validator";
import { inject, injectable } from "inversify";
import { EquipmentService } from "./equipment.service";
import { IEquipmentDoc, IEquipmentInput } from "./equipment.interface";

@injectable()
export class EquipmentController {
  constructor(@inject(EquipmentService) private equipmentService: EquipmentService) {}

  public async handleGetAll(req: Request, res: Response): Promise<IEquipmentDoc[]> | never {
    try {
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      return await this.equipmentService.getAll(dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleGetById(req: Request, res: Response): Promise<IEquipmentDoc | null> | never {
    const validatedReq = matchedData(req) as { id: string };
    try {
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      return await this.equipmentService.getById(validatedReq.id, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handlePost(req: Request, res: Response): Promise<IEquipmentDoc> | never {
    const dataSource = (req as any).institutionDataSource;
    if (!dataSource) throw new Error("Institution DataSource not resolved");
    const validatedReq = matchedData(req) as IEquipmentInput;
    return await this.equipmentService.create(validatedReq, dataSource);
  }

  public async handlePut(req: Request, res: Response): Promise<IEquipmentDoc | null> | never {
    const dataSource = (req as any).institutionDataSource;
    if (!dataSource) throw new Error("Institution DataSource not resolved");
    const id = req.params.id;
    const validatedReq = matchedData(req) as Partial<IEquipmentInput>;
    return await this.equipmentService.update(id, validatedReq, dataSource);
  }

  public async handleDelete(req: Request, res: Response): Promise<{ message: string }> | never {
    const dataSource = (req as any).institutionDataSource;
    if (!dataSource) throw new Error("Institution DataSource not resolved");
    const { id } = matchedData(req) as { id: string };
    const deleted = await this.equipmentService.delete(id, dataSource);
    if (!deleted) throw new Error("Equipment not found");
    return { message: "Equipment deleted successfully" };
  }
}
