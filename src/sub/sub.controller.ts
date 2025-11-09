import { Request, Response } from "express";
import { injectable, inject } from "inversify";
import { SubProvider } from "./sub.provider";
import { matchedData } from "express-validator";


@injectable()
export class SubController {
  constructor(
    @inject(SubProvider) private subProvider: SubProvider
  ){}

  public async handlePostSubFromExternal(req: Request, res: Response) {
    console.log("handling post from external")
    try {
      const matched = matchedData(req)
      const newSubs = await this.subProvider.createSubFromExternal(matched)
      return newSubs;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleUpdateStatusFromExternal(req: Request, res: Response) {
    console.log("handling update status from external")
    try {
      const matched = matchedData(req)
      const updatedSubs = await this.subProvider.updateStatusFromExternal(matched)
      return updatedSubs;
    } catch (err: any) {
      throw new Error(err);
    }
  }
}