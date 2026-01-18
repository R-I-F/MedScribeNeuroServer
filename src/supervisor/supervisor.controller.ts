import { Request, Response } from "express";
import { matchedData } from "express-validator";
import { inject, injectable } from "inversify";
import { SupervisorService } from "./supervisor.service";
import { ISupervisor } from "./supervisor.interface";
import bcryptjs from "bcryptjs";

@injectable()
export class SupervisorController {
  constructor(
    @inject(SupervisorService) private supervisorService: SupervisorService
  ) {}

  public async handlePostSupervisor(
    req: Request, 
    res: Response
  ) {
    const validatedReq = matchedData(req) as Partial<ISupervisor>;
    try {
      // Hash password before saving
      if (validatedReq.password) {
        validatedReq.password = await bcryptjs.hash(validatedReq.password, 10);
      }
      return await this.supervisorService.createSupervisor(validatedReq);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleGetAllSupervisors(
    req: Request, 
    res: Response
  ) {
    try {
      return await this.supervisorService.getAllSupervisors();
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleGetSupervisorById(
    req: Request, 
    res: Response
  ) {
    const validatedReq = matchedData(req) as { id: string };
    try {
      return await this.supervisorService.getSupervisorById(validatedReq);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleUpdateSupervisor(
    req: Request, 
    res: Response
  ) {
    const validatedReq = matchedData(req) as Partial<ISupervisor> & { id: string };
    try {
      // Hash password if it's being updated
      if (validatedReq.password) {
        validatedReq.password = await bcryptjs.hash(validatedReq.password, 10);
      }
      return await this.supervisorService.updateSupervisor(validatedReq);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleDeleteSupervisor(
    req: Request, 
    res: Response
  ) {
    const validatedReq = matchedData(req) as { id: string };
    try {
      return await this.supervisorService.deleteSupervisor(validatedReq);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleResetAllSupervisorPasswords(
    req: Request,
    res: Response
  ) {
    const defaultPassword = "MEDsuper01$";
    try {
      const hashedPassword = await bcryptjs.hash(defaultPassword, 10);
      const modifiedCount = await this.supervisorService.resetAllSupervisorPasswords(
        hashedPassword
      );
      return {
        modifiedCount,
        defaultPassword,
      };
    } catch (err: any) {
      throw new Error(err?.message ?? "Failed to reset supervisor passwords");
    }
  }

  public async handleGetSupervisedCandidates(
    req: Request,
    res: Response
  ): Promise<Array<any>> | never {
    try {
      const jwtPayload = res.locals.jwt as { _id: string; id?: string; email: string; role: string } | undefined;

      if (!jwtPayload || (!jwtPayload._id && !jwtPayload.id)) {
        throw new Error("Unauthorized: No supervisor ID found in token");
      }

      // Use id (MariaDB UUID) if available, otherwise fall back to _id (MongoDB ObjectId)
      const supervisorId = jwtPayload.id || jwtPayload._id;
      const candidates = await this.supervisorService.getSupervisedCandidates(supervisorId);

      return candidates;
    } catch (err: any) {
      throw new Error(err);
    }
  }

}
