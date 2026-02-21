import { Request, Response } from "express";
import { matchedData } from "express-validator";
import { inject, injectable } from "inversify";
import { RegionsService } from "./regions.service";
import { IRegionDoc, IRegionInput } from "./regions.interface";

@injectable()
export class RegionsController {
  constructor(@inject(RegionsService) private regionsService: RegionsService) {}

  public async handleGetAll(req: Request, res: Response): Promise<IRegionDoc[]> | never {
    try {
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      return await this.regionsService.getAll(dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleGetById(req: Request, res: Response): Promise<IRegionDoc | null> | never {
    const validatedReq = matchedData(req) as { id: string };
    try {
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      return await this.regionsService.getById(validatedReq.id, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handlePost(req: Request, res: Response): Promise<IRegionDoc> | never {
    const dataSource = (req as any).institutionDataSource;
    if (!dataSource) throw new Error("Institution DataSource not resolved");
    const validatedReq = matchedData(req) as IRegionInput;
    return await this.regionsService.create(validatedReq, dataSource);
  }

  public async handlePut(req: Request, res: Response): Promise<IRegionDoc | null> | never {
    const dataSource = (req as any).institutionDataSource;
    if (!dataSource) throw new Error("Institution DataSource not resolved");
    const id = req.params.id;
    const validatedReq = matchedData(req) as Partial<IRegionInput>;
    return await this.regionsService.update(id, validatedReq, dataSource);
  }

  public async handleDelete(req: Request, res: Response): Promise<{ message: string }> | never {
    const dataSource = (req as any).institutionDataSource;
    if (!dataSource) throw new Error("Institution DataSource not resolved");
    const { id } = matchedData(req) as { id: string };
    const deleted = await this.regionsService.delete(id, dataSource);
    if (!deleted) throw new Error("Region not found");
    return { message: "Region deleted successfully" };
  }
}
