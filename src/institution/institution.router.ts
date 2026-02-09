import express, { Request, Response, Router } from "express";
import { inject, injectable } from "inversify";
import { StatusCodes } from "http-status-codes";
import { InstitutionController } from "./institution.controller";
import { apiRateLimiter } from "../middleware/rateLimiter.middleware";

@injectable()
export class InstitutionRouter {
  public router: Router;

  constructor(
    @inject(InstitutionController) private institutionController: InstitutionController
  ) {
    this.router = express.Router();
    this.initRoutes();
  }

  private initRoutes() {
    /**
     * GET /institutions
     * Public endpoint - returns list of all active institutions
     * No authentication required
     * Rate limit: 200 requests per 15 minutes per IP
     */
    this.router.get(
      "/",
      apiRateLimiter,
      async (req: Request, res: Response) => {
        try {
          const institutions = await this.institutionController.handleGetAllInstitutions(req, res);
          res.status(StatusCodes.OK).json(institutions);
        } catch (err: any) {
          res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            status: "error",
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            message: "Internal Server Error",
            error: err.message,
          });
        }
      }
    );
  }
}
