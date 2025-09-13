import { Request, Response } from "express";
import { inject, injectable } from "inversify";
import { CalSurgProvider } from "./calSurg.provider";
import { matchedData } from "express-validator";

@injectable()
export class CalSurgController {
  constructor(
    @inject(CalSurgProvider) private calSurgProvider: CalSurgProvider
  )
  {}

  public async handlePostCalSurgFromExternal(req: Request, res: Response) {
    try {    
      const newCalSurgs = await this.calSurgProvider.createCalSurgFromExternal(matchedData(req))
      return newCalSurgs;     
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleGetCalSurgById(req: Request, res: Response) {
    try {
      const validatedReq: { _id: string } = matchedData(req);
      const calSurg = await this.calSurgProvider.getCalSurgById(validatedReq._id);
      return calSurg;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleGetAllCalSurg(req: Request, res: Response) {
    try {
      // Extract query parameters for filtering
      const filters = {
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        month: req.query.month as string,
        year: req.query.year as string,
        day: req.query.day as string,
      };

      // Check if any filters are provided
      const hasFilters = Object.values(filters).some(value => value !== undefined);
      
      if (hasFilters) {
        const calSurgs = await this.calSurgProvider.getCalSurgWithFilters(filters);
        return calSurgs;
      } else {
        const calSurgs = await this.calSurgProvider.getAllCalSurg();
        return calSurgs;
      }
    } catch (err: any) {
      throw new Error(err);
    }
  }
}
