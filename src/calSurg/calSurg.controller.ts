import { Request, Response } from "express";
import { inject, injectable } from "inversify";

injectable();
export class CalSurgController {
  constructor() // @inject()
  {}

  public async handlePostCalSurgFromExternal(req: Request, res: Response) {
    try {         
    } catch (err: any) {
      throw new Error(err);
    }
  }
}
