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
        procedureText: string;
        surgeryDate: Date;
        patientDob?: Date;
        departmentId?: string;
      };
      // Only a clerk "teaches" the system (plan §8 Q4): other roles create with clerkId NULL.
      const jwt = (res as any).locals?.jwt;
      const clerkId: string | null = jwt?.role === "clerk" ? (jwt.id ?? jwt._id ?? null) : null;

      // Department that scopes the semantic-search narrowing. Resolution order:
      //   explicit body field (form's department picker for un-scoped clerks)
      //   → the clerk's own assigned department (JWT claim)
      //   → the REF_DEPT_CODE default (NS), applied in the provider.
      // So a department-assigned clerk narrows to their department automatically; a clerk with
      // no department must supply one via the form (see the frontend picker).
      const departmentId: string | undefined = body.departmentId ?? jwt?.departmentId ?? undefined;

      const newCalSurg = await this.calSurgProvider.createCalSurgFromClerkInput(
        {
          hospital: body.hospital,
          patientName: body.patientName,
          gender: body.gender,
          procedureText: body.procedureText,
          surgeryDate: body.surgeryDate,
          patientDob: body.patientDob,
          departmentId,
          clerkId,
        },
        dataSource
      );
      return newCalSurg;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleGetClerkProcs(req: Request, res: Response): Promise<any[]> | never {
    try {
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      // Typeahead follows the same department resolution as create: the caller's assigned
      // department (JWT claim) → an explicit ?deptCode → the REF_DEPT_CODE default (NS).
      const jwt = (res as any).locals?.jwt;
      const deptCode = typeof req.query.deptCode === "string" ? req.query.deptCode : undefined;
      return await this.calSurgProvider.getClerkProcs(dataSource, jwt?.departmentId, deptCode);
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
