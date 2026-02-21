import { Request, Response } from "express";
import { matchedData } from "express-validator";
import { inject, injectable } from "inversify";
import { PositionsService } from "./positions.service";
import { IPositionDoc, IPositionInput } from "./positions.interface";

@injectable()
export class PositionsController {
  constructor(@inject(PositionsService) private positionsService: PositionsService) {}

  public async handleGetAll(req: Request, res: Response): Promise<IPositionDoc[]> | never {
    try {
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      return await this.positionsService.getAll(dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleGetById(req: Request, res: Response): Promise<IPositionDoc | null> | never {
    const validatedReq = matchedData(req) as { id: string };
    try {
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      return await this.positionsService.getById(validatedReq.id, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handlePost(req: Request, res: Response): Promise<IPositionDoc> | never {
    const dataSource = (req as any).institutionDataSource;
    if (!dataSource) throw new Error("Institution DataSource not resolved");
    const validatedReq = matchedData(req) as IPositionInput;
    return await this.positionsService.create(validatedReq, dataSource);
  }

  public async handlePut(req: Request, res: Response): Promise<IPositionDoc | null> | never {
    const dataSource = (req as any).institutionDataSource;
    if (!dataSource) throw new Error("Institution DataSource not resolved");
    const id = req.params.id;
    const validatedReq = matchedData(req) as Partial<IPositionInput>;
    return await this.positionsService.update(id, validatedReq, dataSource);
  }

  public async handleDelete(req: Request, res: Response): Promise<{ message: string }> | never {
    const dataSource = (req as any).institutionDataSource;
    if (!dataSource) throw new Error("Institution DataSource not resolved");
    const { id } = matchedData(req) as { id: string };
    const deleted = await this.positionsService.delete(id, dataSource);
    if (!deleted) throw new Error("Position not found");
    return { message: "Position deleted successfully" };
  }
}
