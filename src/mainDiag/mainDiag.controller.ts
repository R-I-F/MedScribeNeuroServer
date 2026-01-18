import { Request, Response } from "express";
import { matchedData } from "express-validator";
import { inject, injectable } from "inversify";
import { MainDiagService } from "./mainDiag.service";
import { IMainDiagInput, IMainDiag, IMainDiagUpdateInput, IMainDiagDoc } from "./mainDiag.interface";

@injectable()
export class MainDiagController {
  constructor(
    @inject(MainDiagService) private mainDiagService: MainDiagService
  ) {}

  public async handlePostMainDiag(
    req: Request, 
    res: Response
  ): Promise<IMainDiagDoc> | never {
    const validatedReq = matchedData(req) as IMainDiagInput;
    try {
      return await this.mainDiagService.createMainDiag(validatedReq);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleGetAllMainDiags(
    req: Request, 
    res: Response
  ): Promise<IMainDiagDoc[]> | never {
    try {
      return await this.mainDiagService.getAllMainDiags();
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleGetMainDiagById(
    req: Request, 
    res: Response
  ): Promise<IMainDiagDoc | null> | never {
    const validatedReq = matchedData(req) as { id: string };
    try {
      return await this.mainDiagService.getMainDiagById(validatedReq);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleUpdateMainDiag(
    req: Request, 
    res: Response
  ): Promise<IMainDiagDoc | null> | never {
    const validatedReq = matchedData(req) as IMainDiagUpdateInput;
    // Merge id from params into validatedReq
    validatedReq.id = req.params.id;
    try {
      return await this.mainDiagService.updateMainDiag(validatedReq);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleDeleteMainDiag(
    req: Request, 
    res: Response
  ): Promise<boolean> | never {
    const validatedReq = matchedData(req) as { id: string };
    try {
      return await this.mainDiagService.deleteMainDiag(validatedReq);
    } catch (err: any) {
      throw new Error(err);
    }
  }
}