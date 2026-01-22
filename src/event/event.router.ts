import { inject, injectable } from "inversify";
import express, { Request, Response, Router, NextFunction } from "express";
import { EventController } from "./event.controller";
import { createEventValidator } from "../validators/createEvent.validator";
import { getEventByIdValidator } from "../validators/getEventById.validator";
import { updateEventValidator } from "../validators/updateEvent.validator";
import { deleteEventValidator } from "../validators/deleteEvent.validator";
import { addAttendanceValidator } from "../validators/addAttendance.validator";
import { removeAttendanceValidator } from "../validators/removeAttendance.validator";
import { flagAttendanceValidator } from "../validators/flagAttendance.validator";
import { unflagAttendanceValidator } from "../validators/unflagAttendance.validator";
import { getCandidateTotalPointsValidator } from "../validators/getCandidateTotalPoints.validator";
import { validationResult } from "express-validator";
import { StatusCodes } from "http-status-codes";
import extractJWT from "../middleware/extractJWT";
import { requireInstituteAdmin, requireSupervisor, requireCandidate, authorize } from "../middleware/authorize.middleware";
import { UserRole } from "../types/role.types";
import { userBasedRateLimiter, userBasedStrictRateLimiter } from "../middleware/rateLimiter.middleware";

// Middleware for clerk or institute admin or super admin
const requireClerkOrInstituteAdmin = authorize(UserRole.CLERK, UserRole.INSTITUTE_ADMIN, UserRole.SUPER_ADMIN);
// Middleware for candidate, supervisor, clerk, institute admin, or super admin
const requireCandidateOrSupervisorOrClerkOrInstituteAdmin = authorize(UserRole.CANDIDATE, UserRole.SUPERVISOR, UserRole.CLERK, UserRole.INSTITUTE_ADMIN, UserRole.SUPER_ADMIN);
import { EventService } from "./event.service";

@injectable()
export class EventRouter {
  public router: Router;
  constructor(
    @inject(EventController) private eventController: EventController,
    @inject(EventService) private eventService: EventService
  ) {
    this.router = express.Router();
    this.initRoutes();
  }

  public initRoutes() {
    // Create event
    this.router.post(
      "/",
      userBasedStrictRateLimiter,
      extractJWT,
      requireClerkOrInstituteAdmin,
      createEventValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const resp = await this.eventController.handlePostEvent(req, res);
            res.status(StatusCodes.CREATED).json(resp);
          } catch (err: any) {
            res
              .status(StatusCodes.INTERNAL_SERVER_ERROR)
              .json({ error: err.message });
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );

    // Get all events
    this.router.get(
      "/",
      userBasedRateLimiter,
      extractJWT,
      requireCandidateOrSupervisorOrClerkOrInstituteAdmin,
      async (req: Request, res: Response) => {
        try {
          const resp = await this.eventController.handleGetAllEvents(req, res);
          res.status(StatusCodes.OK).json(resp);
        } catch (err: any) {
          res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ error: err.message });
        }
      }
    );

    // Bulk import attendance from external spreadsheet
    // Must be defined BEFORE parameterized routes to avoid route conflicts
    // Institute Admin only
    this.router.post(
      "/bulk-import-attendance",
      userBasedStrictRateLimiter,
      extractJWT,
      requireInstituteAdmin,
      async (req: Request, res: Response) => {
        try {
          const resp = await this.eventController.handleBulkImportAttendance(req, res);
          res.status(StatusCodes.OK).json(resp);
        } catch (err: any) {
          res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
        }
      }
    );

    // Get candidate's own total points (from JWT token)
    // Must be defined BEFORE parameterized routes
    // Candidate only - uses their own ID from JWT token
    this.router.get(
      "/candidate/points",
      userBasedRateLimiter,
      extractJWT,
      requireCandidate,
      async (req: Request, res: Response) => {
        try {
          const resp = await this.eventController.handleGetMyPoints(req, res);
          res.status(StatusCodes.OK).json(resp);
        } catch (err: any) {
          if (err.message.includes("Unauthorized")) {
            res.status(StatusCodes.UNAUTHORIZED).json({ error: err.message });
          } else {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
          }
        }
      }
    );

    // Get candidate total points by ID
    // Must be defined BEFORE parameterized routes
    // Anyone authenticated can view points (for transparency)
    this.router.get(
      "/candidate/:candidateId/points",
      userBasedRateLimiter,
      extractJWT,
      requireCandidate,
      getCandidateTotalPointsValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const resp = await this.eventController.handleGetCandidateTotalPoints(req, res);
            res.status(StatusCodes.OK).json(resp);
          } catch (err: any) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );

    // Get event by ID
    this.router.get(
      "/:id",
      userBasedRateLimiter,
      extractJWT,
      requireCandidateOrSupervisorOrClerkOrInstituteAdmin,
      getEventByIdValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const resp = await this.eventController.handleGetEventById(req, res);
            if (resp) {
              res.status(StatusCodes.OK).json(resp);
            } else {
              res
                .status(StatusCodes.NOT_FOUND)
                .json({ error: "Event not found" });
            }
          } catch (err: any) {
            res
              .status(StatusCodes.INTERNAL_SERVER_ERROR)
              .json({ error: err.message });
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );

    // Update event
    this.router.patch(
      "/:id",
      userBasedStrictRateLimiter,
      extractJWT,
      requireClerkOrInstituteAdmin,
      updateEventValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const resp = await this.eventController.handleUpdateEvent(req, res);
            if (resp) {
              res.status(StatusCodes.OK).json(resp);
            } else {
              res
                .status(StatusCodes.NOT_FOUND)
                .json({ error: "Event not found" });
            }
          } catch (err: any) {
            res
              .status(StatusCodes.INTERNAL_SERVER_ERROR)
              .json({ error: err.message });
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );

    // Delete event
    this.router.delete(
      "/:id",
      userBasedStrictRateLimiter,
      extractJWT,
      requireClerkOrInstituteAdmin,
      deleteEventValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const resp = await this.eventController.handleDeleteEvent(req, res);
            if (resp) {
              res
                .status(StatusCodes.OK)
                .json({ message: "Event deleted successfully" });
            } else {
              res
                .status(StatusCodes.NOT_FOUND)
                .json({ error: "Event not found" });
            }
          } catch (err: any) {
            res
              .status(StatusCodes.INTERNAL_SERVER_ERROR)
              .json({ error: err.message });
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );

    // Add candidate to attendance
    // Institute Admin: can add to any event
    // Supervisor: can add to events where they are the presenter
    // Candidate: can add themselves to any event
    this.router.post(
      "/:eventId/attendance/:candidateId",
      userBasedStrictRateLimiter,
      extractJWT,
      addAttendanceValidator,
      async (req: Request, res: Response, next: NextFunction) => {
        const result = validationResult(req);
        if (!result.isEmpty()) {
          return res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }

        const jwt = res.locals.jwt;
        const userRole = jwt.role;
        const userId = jwt.id || jwt._id; // Support both UUID (id) and ObjectId (_id) for backward compatibility

        // Allow candidates to add themselves
        if (userRole === "candidate" && req.params.candidateId === userId) {
          return next();
        }

        // Allow institute admins
        if (userRole === "instituteAdmin" || userRole === "superAdmin") {
          return next();
        }

        // For supervisors, check if they are the presenter
        if (userRole === "supervisor") {
          try {
            const eventService = this.eventService;
            const event = await eventService.getEventById(req.params.eventId);
            if (!event) {
              return res.status(StatusCodes.NOT_FOUND).json({ error: "Event not found" });
            }
            // Check if supervisor is the presenter (for lecture/conf events)
            // Handle both UUID (id) and ObjectId (_id) formats
            const presenterId = event.presenterId || (event.presenter as any)?.id || (event.presenter as any)?._id?.toString() || event.presenter?.toString();
            if ((event.type === "lecture" || event.type === "conf") && 
                presenterId === userId) {
              return next();
            }
            return res.status(StatusCodes.FORBIDDEN).json({ 
              error: "Only the event presenter can manage attendance for this event" 
            });
          } catch (err: any) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
          }
        }

        return res.status(StatusCodes.FORBIDDEN).json({ 
          error: "Insufficient permissions" 
        });
      },
      async (req: Request, res: Response) => {
        try {
          const resp = await this.eventController.handleAddAttendance(req, res);
          res.status(StatusCodes.OK).json(resp);
        } catch (err: any) {
          res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
        }
      }
    );

    // Remove candidate from attendance
    // Institute Admin: can remove from any event
    // Supervisor: can remove from events where they are the presenter
    this.router.delete(
      "/:eventId/attendance/:candidateId",
      userBasedStrictRateLimiter,
      extractJWT,
      removeAttendanceValidator,
      async (req: Request, res: Response, next: NextFunction) => {
        const result = validationResult(req);
        if (!result.isEmpty()) {
          return res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }

        const jwt = res.locals.jwt;
        const userRole = jwt.role;
        const userId = jwt.id || jwt._id; // Support both UUID (id) and ObjectId (_id) for backward compatibility

        // Allow institute admins
        if (userRole === "instituteAdmin" || userRole === "superAdmin") {
          return next();
        }

        // For supervisors, check if they are the presenter
        if (userRole === "supervisor") {
          try {
            const eventService = this.eventService;
            const event = await eventService.getEventById(req.params.eventId);
            if (!event) {
              return res.status(StatusCodes.NOT_FOUND).json({ error: "Event not found" });
            }
            if ((event.type === "lecture" || event.type === "conf") && 
                event.presenter.toString() === userId) {
              return next();
            }
            return res.status(StatusCodes.FORBIDDEN).json({ 
              error: "Only the event presenter can manage attendance for this event" 
            });
          } catch (err: any) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
          }
        }

        return res.status(StatusCodes.FORBIDDEN).json({ 
          error: "Insufficient permissions" 
        });
      },
      async (req: Request, res: Response) => {
        try {
          const resp = await this.eventController.handleRemoveAttendance(req, res);
          res.status(StatusCodes.OK).json(resp);
        } catch (err: any) {
          res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
        }
      }
    );

    // Flag candidate attendance
    // Institute Admin: can flag in any event
    // Supervisor: can flag in events where they are the presenter
    this.router.patch(
      "/:eventId/attendance/:candidateId/flag",
      userBasedStrictRateLimiter,
      extractJWT,
      flagAttendanceValidator,
      async (req: Request, res: Response, next: NextFunction) => {
        const result = validationResult(req);
        if (!result.isEmpty()) {
          return res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }

        const jwt = res.locals.jwt;
        const userRole = jwt.role;
        const userId = jwt.id || jwt._id; // Support both UUID (id) and ObjectId (_id) for backward compatibility

        // Allow institute admins
        if (userRole === "instituteAdmin" || userRole === "superAdmin") {
          return next();
        }

        // For supervisors, check if they are the presenter
        if (userRole === "supervisor") {
          try {
            const eventService = this.eventService;
            const event = await eventService.getEventById(req.params.eventId);
            if (!event) {
              return res.status(StatusCodes.NOT_FOUND).json({ error: "Event not found" });
            }
            if ((event.type === "lecture" || event.type === "conf") && 
                event.presenter.toString() === userId) {
              return next();
            }
            return res.status(StatusCodes.FORBIDDEN).json({ 
              error: "Only the event presenter can manage attendance for this event" 
            });
          } catch (err: any) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
          }
        }

        return res.status(StatusCodes.FORBIDDEN).json({ 
          error: "Insufficient permissions" 
        });
      },
      async (req: Request, res: Response) => {
        try {
          const resp = await this.eventController.handleFlagAttendance(req, res);
          res.status(StatusCodes.OK).json(resp);
        } catch (err: any) {
          res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
        }
      }
    );

    // Unflag candidate attendance
    // Institute Admin: can unflag in any event
    // Supervisor: can unflag in events where they are the presenter
    this.router.patch(
      "/:eventId/attendance/:candidateId/unflag",
      userBasedStrictRateLimiter,
      extractJWT,
      unflagAttendanceValidator,
      async (req: Request, res: Response, next: NextFunction) => {
        const result = validationResult(req);
        if (!result.isEmpty()) {
          return res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }

        const jwt = res.locals.jwt;
        const userRole = jwt.role;
        const userId = jwt.id || jwt._id; // Support both UUID (id) and ObjectId (_id) for backward compatibility

        // Allow institute admins
        if (userRole === "instituteAdmin" || userRole === "superAdmin") {
          return next();
        }

        // For supervisors, check if they are the presenter
        if (userRole === "supervisor") {
          try {
            const eventService = this.eventService;
            const event = await eventService.getEventById(req.params.eventId);
            if (!event) {
              return res.status(StatusCodes.NOT_FOUND).json({ error: "Event not found" });
            }
            if ((event.type === "lecture" || event.type === "conf") && 
                event.presenter.toString() === userId) {
              return next();
            }
            return res.status(StatusCodes.FORBIDDEN).json({ 
              error: "Only the event presenter can manage attendance for this event" 
            });
          } catch (err: any) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
          }
        }

        return res.status(StatusCodes.FORBIDDEN).json({ 
          error: "Insufficient permissions" 
        });
      },
      async (req: Request, res: Response) => {
        try {
          const resp = await this.eventController.handleUnflagAttendance(req, res);
          res.status(StatusCodes.OK).json(resp);
        } catch (err: any) {
          res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
        }
      }
    );

  }
}


