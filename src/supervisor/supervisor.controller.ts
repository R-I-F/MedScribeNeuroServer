import { Request, Response } from "express";
import { matchedData } from "express-validator";
import { inject, injectable } from "inversify";
import { SupervisorService } from "./supervisor.service";
import { ISupervisor } from "./supervisor.interface";

@injectable()
export class SupervisorController {
  constructor(
    @inject(SupervisorService) private supervisorService: SupervisorService
  ) {}

  public async handlePostSupervisor(
    req: Request, 
    res: Response
  ) {
    const validatedReq = matchedData(req);
    try {
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
}
