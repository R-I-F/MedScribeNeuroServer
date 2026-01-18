import { Request, Response } from "express";
import { matchedData } from "express-validator";
import { inject, injectable } from "inversify";
import { EventProvider } from "./event.provider";
import {
  IEventInput,
  IEventUpdateInput,
  IAddAttendanceInput,
  IRemoveAttendanceInput,
  IFlagAttendanceInput,
  IUnflagAttendanceInput,
} from "./event.interface";

@injectable()
export class EventController {
  constructor(@inject(EventProvider) private eventProvider: EventProvider) {}

  public async handlePostEvent(req: Request, res: Response) {
    const validatedReq = matchedData(req) as IEventInput;
    try {
      return await this.eventProvider.createEvent(validatedReq);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleGetAllEvents(req: Request, res: Response) {
    try {
      return await this.eventProvider.getAllEvents();
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleGetEventById(req: Request, res: Response) {
    const validatedReq = matchedData(req) as { id: string };
    validatedReq.id = req.params.id;
    try {
      return await this.eventProvider.getEventById(validatedReq.id);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleUpdateEvent(req: Request, res: Response) {
    const validatedReq = matchedData(req) as IEventUpdateInput;
    validatedReq.id = req.params.id;
    try {
      return await this.eventProvider.updateEvent(validatedReq);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleDeleteEvent(req: Request, res: Response) {
    const validatedReq = matchedData(req) as { id: string };
    validatedReq.id = req.params.id;
    try {
      return await this.eventProvider.deleteEvent(validatedReq.id);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleAddAttendance(req: Request, res: Response) {
    const validatedReq = matchedData(req) as IAddAttendanceInput;
    validatedReq.eventId = req.params.eventId;
    validatedReq.candidateId = req.params.candidateId;
    // Get user info from JWT (use id if available, fallback to _id for backward compatibility)
    validatedReq.addedBy = res.locals.jwt.id || res.locals.jwt._id;
    validatedReq.addedByRole = res.locals.jwt.role === "candidate" ? "candidate" : 
                               res.locals.jwt.role === "supervisor" ? "supervisor" : 
                               "instituteAdmin";
    try {
      return await this.eventProvider.addAttendance(validatedReq);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleRemoveAttendance(req: Request, res: Response) {
    const validatedReq = matchedData(req) as IRemoveAttendanceInput;
    validatedReq.eventId = req.params.eventId;
    validatedReq.candidateId = req.params.candidateId;
    try {
      return await this.eventProvider.removeAttendance(validatedReq);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleFlagAttendance(req: Request, res: Response) {
    const validatedReq = matchedData(req) as IFlagAttendanceInput;
    validatedReq.eventId = req.params.eventId;
    validatedReq.candidateId = req.params.candidateId;
    validatedReq.flaggedBy = res.locals.jwt.id || res.locals.jwt._id;
    try {
      return await this.eventProvider.flagAttendance(validatedReq);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleUnflagAttendance(req: Request, res: Response) {
    const validatedReq = matchedData(req) as IUnflagAttendanceInput;
    validatedReq.eventId = req.params.eventId;
    validatedReq.candidateId = req.params.candidateId;
    try {
      return await this.eventProvider.unflagAttendance(validatedReq);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleGetCandidateTotalPoints(req: Request, res: Response) {
    const validatedReq = matchedData(req) as { candidateId: string };
    validatedReq.candidateId = req.params.candidateId;
    try {
      const totalPoints = await this.eventProvider.getCandidateTotalPoints(validatedReq.candidateId);
      return { totalPoints };
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleGetMyPoints(req: Request, res: Response) {
    try {
      // Get candidate ID from JWT token (use id if available, fallback to _id for backward compatibility)
      const candidateId = res.locals.jwt.id || res.locals.jwt._id;
      if (!candidateId) {
        throw new Error("Unauthorized: No candidate ID found in token");
      }
      const totalPoints = await this.eventProvider.getCandidateTotalPoints(candidateId);
      return { totalPoints };
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleBulkImportAttendance(req: Request, res: Response) {
    try {
      // Get user info from JWT
      const addedBy = res.locals.jwt._id;
      const addedByRole = res.locals.jwt.role === "candidate" ? "candidate" : 
                         res.locals.jwt.role === "supervisor" ? "supervisor" : 
                         "instituteAdmin";
      
      return await this.eventProvider.bulkImportAttendanceFromExternal(addedBy, addedByRole);
    } catch (err: any) {
      throw new Error(err);
    }
  }
}


