import { Request, Response } from "express";
import { matchedData } from "express-validator";
import { inject, injectable } from "inversify";
import { ConfProvider } from "./conf.provider";
import { IConfInput, IConfUpdateInput } from "./conf.interface";
import { toCensoredSupervisor } from "../utils/censored.mapper";
import { ISupervisorDoc } from "../supervisor/supervisor.interface";

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
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      return await this.confProvider.createConf(validatedReq, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleGetAllConfs(
    req: Request,
    res: Response
  ) {
    try {
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      const list = await this.confProvider.getAllConfs(dataSource);
      return list.map(({ createdAt, updatedAt, google_uid, ...rest }) => {
        const out = { ...rest };
        if (out.presenter && typeof out.presenter === "object") {
          out.presenter = toCensoredSupervisor(out.presenter as ISupervisorDoc);
        }
        return out;
      });
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
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      const conf = await this.confProvider.getConfById(validatedReq.id, dataSource);
      if (!conf) return null;
      if (conf.presenter && typeof conf.presenter === "object") {
        conf.presenter = toCensoredSupervisor(conf.presenter as ISupervisorDoc);
      }
      return conf;
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
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      return await this.confProvider.updateConf(validatedReq, dataSource);
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
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      return await this.confProvider.deleteConf(validatedReq.id, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }
}

