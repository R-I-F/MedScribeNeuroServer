import { inject, injectable } from "inversify";
import express, { Request, Response, Router } from "express";
import { LectureController } from "./lecture.controller";
import { createLectureValidator } from "../validators/createLecture.validator";
import { getLectureByIdValidator } from "../validators/getLectureById.validator";
import { updateLectureValidator } from "../validators/updateLecture.validator";
import { deleteLectureValidator } from "../validators/deleteLecture.validator";
import { createBulkLecturesFromExternalValidator } from "../validators/createBulkLecturesFromExternal.validator";
import { validationResult } from "express-validator";
import { StatusCodes } from "http-status-codes";
import extractJWT from "../middleware/extractJWT";
import { requireSuperAdmin, requireInstituteAdmin } from "../middleware/authorize.middleware";

@injectable()
export class LectureRouter {
  public router: Router;
  constructor(
    @inject(LectureController) private lectureController: LectureController
  ) {
    this.router = express.Router();
    this.initRoutes();
  }

  public async initRoutes() {
    // Create lecture
    this.router.post(
      "/",
      extractJWT,
      requireSuperAdmin,
      createLectureValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const resp = await this.lectureController.handlePostLecture(req, res);
            res.status(StatusCodes.CREATED).json(resp);
          } catch (err: any) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );

    // Get all lectures
    this.router.get(
      "/",
      extractJWT,
      requireInstituteAdmin,
      async (req: Request, res: Response) => {
        try {
          const resp = await this.lectureController.handleGetAllLectures(req, res);
          res.status(StatusCodes.OK).json(resp);
        } catch (err: any) {
          res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
        }
      }
    );

    // Get lecture by ID
    this.router.get(
      "/:id",
      extractJWT,
      requireSuperAdmin,
      getLectureByIdValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const resp = await this.lectureController.handleGetLectureById(req, res);
            if (resp) {
              res.status(StatusCodes.OK).json(resp);
            } else {
              res.status(StatusCodes.NOT_FOUND).json({ error: "Lecture not found" });
            }
          } catch (err: any) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );

    // Update lecture
    this.router.patch(
      "/:id",
      extractJWT,
      requireSuperAdmin,
      updateLectureValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const resp = await this.lectureController.handleUpdateLecture(req, res);
            if (resp) {
              res.status(StatusCodes.OK).json(resp);
            } else {
              res.status(StatusCodes.NOT_FOUND).json({ error: "Lecture not found" });
            }
          } catch (err: any) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );

    // Delete lecture
    this.router.delete(
      "/:id",
      extractJWT,
      requireSuperAdmin,
      deleteLectureValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const resp = await this.lectureController.handleDeleteLecture(req, res);
            if (resp) {
              res.status(StatusCodes.OK).json({ message: "Lecture deleted successfully" });
            } else {
              res.status(StatusCodes.NOT_FOUND).json({ error: "Lecture not found" });
            }
          } catch (err: any) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );

    // Bulk create lectures from external (auto-detect level: msc/md)
    this.router.post(
      "/postBulk",
      extractJWT,
      requireSuperAdmin,
      createBulkLecturesFromExternalValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const resp = await this.lectureController.handlePostBulkLecturesFromExternal(req, res);
            res.status(StatusCodes.CREATED).json(resp);
          } catch (err: any) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );
  }
}

