import { Request, Response } from "express";
import { matchedData } from "express-validator";
import { inject, injectable } from "inversify";
import { ClerkService } from "./clerk.service";
import { IClerk } from "./clerk.interface";
import bcryptjs from "bcryptjs";

@injectable()
export class ClerkController {
  constructor(
    @inject(ClerkService) private clerkService: ClerkService
  ) {}

  public async handlePostClerk(
    req: Request, 
    res: Response
  ) {
    const validatedReq = matchedData(req) as Partial<IClerk>;
    try {
      // Hash password before saving
      if (validatedReq.password) {
        validatedReq.password = await bcryptjs.hash(validatedReq.password, 10);
      }
      return await this.clerkService.createClerk(validatedReq);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleGetAllClerks(
    req: Request, 
    res: Response
  ) {
    try {
      return await this.clerkService.getAllClerks();
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleGetClerkById(
    req: Request, 
    res: Response
  ) {
    const validatedReq = matchedData(req) as { id: string };
    try {
      return await this.clerkService.getClerkById(validatedReq);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleUpdateClerk(
    req: Request, 
    res: Response
  ) {
    const validatedReq = matchedData(req) as Partial<IClerk> & { id: string };
    try {
      // Hash password if it's being updated
      if (validatedReq.password) {
        validatedReq.password = await bcryptjs.hash(validatedReq.password, 10);
      }
      return await this.clerkService.updateClerk(validatedReq);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleDeleteClerk(
    req: Request, 
    res: Response
  ) {
    const validatedReq = matchedData(req) as { id: string };
    try {
      const deleted = await this.clerkService.deleteClerk(validatedReq);
      return { message: "Clerk deleted successfully" };
    } catch (err: any) {
      throw new Error(err);
    }
  }
}
