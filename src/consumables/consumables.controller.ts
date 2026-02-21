import { Request, Response } from "express";
import { matchedData } from "express-validator";
import { inject, injectable } from "inversify";
import { ConsumablesService } from "./consumables.service";
import { IConsumableDoc, IConsumableInput } from "./consumables.interface";

@injectable()
export class ConsumablesController {
  constructor(@inject(ConsumablesService) private consumablesService: ConsumablesService) {}

  public async handleGetAll(req: Request, res: Response): Promise<IConsumableDoc[]> | never {
    try {
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      return await this.consumablesService.getAll(dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleGetById(req: Request, res: Response): Promise<IConsumableDoc | null> | never {
    const validatedReq = matchedData(req) as { id: string };
    try {
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      return await this.consumablesService.getById(validatedReq.id, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handlePost(req: Request, res: Response): Promise<IConsumableDoc> | never {
    const dataSource = (req as any).institutionDataSource;
    if (!dataSource) throw new Error("Institution DataSource not resolved");
    const validatedReq = matchedData(req) as IConsumableInput;
    return await this.consumablesService.create(validatedReq, dataSource);
  }

  public async handlePut(req: Request, res: Response): Promise<IConsumableDoc | null> | never {
    const dataSource = (req as any).institutionDataSource;
    if (!dataSource) throw new Error("Institution DataSource not resolved");
    const id = req.params.id;
    const validatedReq = matchedData(req) as Partial<IConsumableInput>;
    return await this.consumablesService.update(id, validatedReq, dataSource);
  }

  public async handleDelete(req: Request, res: Response): Promise<{ message: string }> | never {
    const dataSource = (req as any).institutionDataSource;
    if (!dataSource) throw new Error("Institution DataSource not resolved");
    const { id } = matchedData(req) as { id: string };
    const deleted = await this.consumablesService.delete(id, dataSource);
    if (!deleted) throw new Error("Consumable not found");
    return { message: "Consumable deleted successfully" };
  }
}
