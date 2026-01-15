import { Request, Response } from "express";
import { matchedData } from "express-validator";
import { inject, injectable } from "inversify";
import { ConfProvider } from "./conf.provider";
import { IConfInput, IConfUpdateInput } from "./conf.interface";

@injectable()
export class ConfController {
  constructor(
    @inject(ConfProvider) private confProvider: ConfProvider
  ) {}

  public async handlePostConf(
    req: Request,
    res: Response
  ) {
    const validatedReq = matchedData(req) as IConfInput;
    try {
      return await this.confProvider.createConf(validatedReq);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleGetAllConfs(
    req: Request,
    res: Response
  ) {
    try {
      return await this.confProvider.getAllConfs();
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleGetConfById(
    req: Request,
    res: Response
  ) {
    const validatedReq = matchedData(req) as { id: string };
    // Ensure id is extracted from params
    validatedReq.id = req.params.id;
    try {
      return await this.confProvider.getConfById(validatedReq.id);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleUpdateConf(
    req: Request,
    res: Response
  ) {
    const validatedReq = matchedData(req) as IConfUpdateInput;
    // Merge id from params into validatedReq
    validatedReq.id = req.params.id;
    try {
      return await this.confProvider.updateConf(validatedReq);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleDeleteConf(
    req: Request,
    res: Response
  ) {
    const validatedReq = matchedData(req) as { id: string };
    // Ensure id is extracted from params
    validatedReq.id = req.params.id;
    try {
      return await this.confProvider.deleteConf(validatedReq.id);
    } catch (err: any) {
      throw new Error(err);
    }
  }
}

