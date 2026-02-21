import { Request, Response } from "express";
import { matchedData } from "express-validator";
import { inject, injectable } from "inversify";
import { ApproachesService } from "./approaches.service";
import { IApproachDoc, IApproachInput } from "./approaches.interface";

@injectable()
export class ApproachesController {
  constructor(@inject(ApproachesService) private approachesService: ApproachesService) {}

  public async handleGetAll(req: Request, res: Response): Promise<IApproachDoc[]> | never {
    try {
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      return await this.approachesService.getAll(dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleGetById(req: Request, res: Response): Promise<IApproachDoc | null> | never {
    const validatedReq = matchedData(req) as { id: string };
    try {
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      return await this.approachesService.getById(validatedReq.id, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handlePost(req: Request, res: Response): Promise<IApproachDoc> | never {
    const dataSource = (req as any).institutionDataSource;
    if (!dataSource) throw new Error("Institution DataSource not resolved");
    const validatedReq = matchedData(req) as IApproachInput;
    return await this.approachesService.create(validatedReq, dataSource);
  }

  public async handlePut(req: Request, res: Response): Promise<IApproachDoc | null> | never {
    const dataSource = (req as any).institutionDataSource;
    if (!dataSource) throw new Error("Institution DataSource not resolved");
    const id = req.params.id;
    const validatedReq = matchedData(req) as Partial<IApproachInput>;
    return await this.approachesService.update(id, validatedReq, dataSource);
  }

  public async handleDelete(req: Request, res: Response): Promise<{ message: string }> | never {
    const dataSource = (req as any).institutionDataSource;
    if (!dataSource) throw new Error("Institution DataSource not resolved");
    const { id } = matchedData(req) as { id: string };
    const deleted = await this.approachesService.delete(id, dataSource);
    if (!deleted) throw new Error("Approach not found");
    return { message: "Approach deleted successfully" };
  }
}
