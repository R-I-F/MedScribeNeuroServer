import { Request, Response } from "express";
import { matchedData } from "express-validator";
import { inject, injectable } from "inversify";
import { DataSource } from "typeorm";
import { SupervisorService } from "./supervisor.service";
import { ISupervisor, ISupervisorDoc, ISupervisorCensoredDoc } from "./supervisor.interface";
import bcryptjs from "bcryptjs";
import { AppDataSource } from "../config/database.config";
import { toCensoredSupervisor } from "../utils/censored.mapper";
import { UserRole } from "../types/role.types";
import { JwtPayload } from "../middleware/authorize.middleware";

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
    const dataSource = (req as any).institutionDataSource || AppDataSource;
    try {
      // Hash password before saving
      if (validatedReq.password) {
        validatedReq.password = await bcryptjs.hash(validatedReq.password, 10);
      }
      return await this.supervisorService.createSupervisor(validatedReq, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleGetAllSupervisors(
    req: Request, 
    res: Response
  ): Promise<ISupervisorDoc[] | ISupervisorCensoredDoc[]> {
    const dataSource = (req as any).institutionDataSource || AppDataSource;
    const jwtPayload = res.locals.jwt as JwtPayload | undefined;
    const role = jwtPayload?.role;
    const censored = role === UserRole.CLERK || role === UserRole.SUPERVISOR || role === UserRole.CANDIDATE;
    try {
      const list = await this.supervisorService.getAllSupervisors(dataSource);
      if (censored) {
        return list.map(toCensoredSupervisor);
      }
      return list.map(({ createdAt, updatedAt, password, ...rest }) => rest);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleGetSupervisorById(
    req: Request, 
    res: Response
  ): Promise<ISupervisorDoc | ISupervisorCensoredDoc | null> {
    const validatedReq = matchedData(req) as { id: string };
    const dataSource = (req as any).institutionDataSource || AppDataSource;
    const jwtPayload = res.locals.jwt as JwtPayload | undefined;
    const role = jwtPayload?.role;
    const censored = role === UserRole.CLERK || role === UserRole.SUPERVISOR || role === UserRole.CANDIDATE;
    try {
      const supervisor = await this.supervisorService.getSupervisorById(validatedReq, dataSource);
      if (!supervisor) return null;
      if (censored) {
        return toCensoredSupervisor(supervisor);
      }
      const { password, ...rest } = supervisor;
      return rest as ISupervisorDoc;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleUpdateSupervisor(
    req: Request, 
    res: Response
  ) {
    const validatedReq = matchedData(req) as Partial<ISupervisor> & { id: string };
    const dataSource = (req as any).institutionDataSource || AppDataSource;
    try {
      // Hash password if it's being updated
      if (validatedReq.password) {
        validatedReq.password = await bcryptjs.hash(validatedReq.password, 10);
      }
      return await this.supervisorService.updateSupervisor(validatedReq, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleDeleteSupervisor(
    req: Request, 
    res: Response
  ) {
    const validatedReq = matchedData(req) as { id: string };
    const dataSource = (req as any).institutionDataSource || AppDataSource;
    try {
      return await this.supervisorService.deleteSupervisor(validatedReq, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleResetAllSupervisorPasswords(
    req: Request,
    res: Response
  ) {
    const defaultPassword = process.env.BASE_SUPER_PASSWORD;
    if (!defaultPassword) {
      throw new Error("BASE_SUPER_PASSWORD environment variable is not set");
    }
    const dataSource = (req as any).institutionDataSource || AppDataSource;
    try {
      const hashedPassword = await bcryptjs.hash(defaultPassword, 10);
      const modifiedCount = await this.supervisorService.resetAllSupervisorPasswords(
        hashedPassword,
        dataSource
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
    const dataSource = (req as any).institutionDataSource || AppDataSource;
    try {
      const jwtPayload = res.locals.jwt as { _id: string; id?: string; email: string; role: string } | undefined;

      if (!jwtPayload || (!jwtPayload._id && !jwtPayload.id)) {
        throw new Error("Unauthorized: No supervisor ID found in token");
      }

      // Use id (MariaDB UUID) if available, otherwise fall back to _id (MongoDB ObjectId)
      const supervisorId = jwtPayload.id || jwtPayload._id;
      const candidates = await this.supervisorService.getSupervisedCandidates(supervisorId, dataSource);

      return candidates;
    } catch (err: any) {
      throw new Error(err);
    }
  }

}
