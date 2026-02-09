import { Request, Response } from "express";
import { inject, injectable } from "inversify";
import { CalSurgProvider } from "./calSurg.provider";
import { matchedData } from "express-validator";
import { ICalSurg, ICalSurgDoc } from "./calSurg.interface";

@injectable()
export class CalSurgController {
  constructor(
    @inject(CalSurgProvider) private calSurgProvider: CalSurgProvider
  ) {}

  public async handlePostCalSurgFromExternal(req: Request, res: Response): Promise<ICalSurgDoc[] | any> | never {
    try {
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      const validatedReq = matchedData(req) as Partial<any>;
      const newCalSurgs = await this.calSurgProvider.createCalSurgFromExternal(validatedReq, dataSource);
      return newCalSurgs;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handlePostCalSurg(req: Request, res: Response): Promise<ICalSurgDoc> | never {
    try {
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      const body = matchedData(req) as {
        hospital: string;
        patientName: string;
        gender: "male" | "female";
        procedure: string;
        surgeryDate: Date;
        patientDob?: Date;
      };
      const payload: ICalSurg = {
        timeStamp: new Date(),
        patientName: body.patientName,
        patientDob: body.patientDob ?? body.surgeryDate,
        gender: body.gender,
        hospital: body.hospital,
        arabProc: body.procedure,
        procDate: body.surgeryDate,
        google_uid: undefined,
        formLink: undefined,
      };
      const newCalSurg = await this.calSurgProvider.createCalSurg(payload, dataSource);
      return newCalSurg;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleGetCalSurgById(req: Request, res: Response): Promise<ICalSurgDoc> | never {
    try {
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      const validatedReq: { _id: string } = matchedData(req) as { _id: string };
      const calSurg = await this.calSurgProvider.getCalSurgById(validatedReq._id, dataSource);
      return calSurg;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleGetCalSurgDashboard(req: Request, res: Response): Promise<any[]> | never {
    try {
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      return await this.calSurgProvider.getCalSurgDashboard(dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleGetAllCalSurg(req: Request, res: Response): Promise<ICalSurgDoc[]> | never {
    try {
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
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
        const calSurgs = await this.calSurgProvider.getCalSurgWithFilters(filters, dataSource);
        return calSurgs;
      } else {
        const calSurgs = await this.calSurgProvider.getAllCalSurg(dataSource);
        return calSurgs;
      }
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleUpdateCalSurg(req: Request, res: Response): Promise<ICalSurgDoc> | never {
    try {
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      const id = req.params.id;
      const validatedReq = matchedData(req) as Partial<ICalSurg>;
      const updatedCalSurg = await this.calSurgProvider.updateCalSurg(id, validatedReq, dataSource);
      return updatedCalSurg;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleDeleteCalSurg(
    req: Request,
    res: Response
  ): Promise<{ message: string }> | never {
    const id = req.params.id;
    try {
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      const deleted = await this.calSurgProvider.deleteCalSurg(id, dataSource);
      if (!deleted) {
        throw new Error("CalSurg not found");
      }
      return { message: "CalSurg deleted successfully" };
    } catch (err: any) {
      throw new Error(err);
    }
  }
}
