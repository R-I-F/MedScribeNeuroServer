import { Request, Response } from "express";
import { inject, injectable } from "inversify";
import { CalSurgService } from "./calSurg.service";
import { matchedData } from "express-validator";

injectable();
export class CalSurgController {
  constructor(
    @inject(CalSurgService) private calSurgService: CalSurgService
  )
  {}

  public async handlePostCalSurgFromExternal(req: Request, res: Response) {
    try {    
      const newCalSurgs = await this.calSurgService.createCalSurgFromExternal(matchedData(req))
      return newCalSurgs;     
    } catch (err: any) {
      throw new Error(err);
    }
  }
}
