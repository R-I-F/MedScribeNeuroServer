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
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      return await this.mainDiagService.createMainDiag(validatedReq, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleGetAllMainDiags(
    req: Request, 
    res: Response
  ): Promise<IMainDiagDoc[]> | never {
    try {
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      return await this.mainDiagService.getAllMainDiags(dataSource);
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
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      return await this.mainDiagService.getMainDiagById(validatedReq, dataSource);
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
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      return await this.mainDiagService.updateMainDiag(validatedReq, dataSource);
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
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      return await this.mainDiagService.deleteMainDiag(validatedReq, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleRemoveProcsFromMainDiag(
    req: Request,
    res: Response
  ): Promise<IMainDiagDoc | null> | never {
    const validatedReq = matchedData(req) as { id: string; numCodes: string[] };
    try {
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      return await this.mainDiagService.removeProcsFromMainDiag(
        validatedReq.id ?? req.params.id,
        validatedReq.numCodes,
        dataSource
      );
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleRemoveDiagnosisFromMainDiag(
    req: Request,
    res: Response
  ): Promise<IMainDiagDoc | null> | never {
    const validatedReq = matchedData(req) as { id: string; icdCodes: string[] };
    try {
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      return await this.mainDiagService.removeDiagnosisFromMainDiag(
        validatedReq.id ?? req.params.id,
        validatedReq.icdCodes,
        dataSource
      );
    } catch (err: any) {
      throw new Error(err);
    }
  }
}