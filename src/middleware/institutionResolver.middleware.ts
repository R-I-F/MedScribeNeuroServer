import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { AppDataSource, initializeDatabase } from "../config/database.config";
import { getInstitution } from "../institution/institution.service";

const NAMESPACE = "InstitutionContext";

/**
 * Institution context middleware (single-institution KA spoke).
 *
 * Multi-tenancy is gone — there is nothing to "resolve". This simply attaches the one
 * institution (loaded once from the DB and cached) and the single `AppDataSource` to the
 * request, so the controller call sites that read `req.institutionDataSource` / `req.institution`
 * keep working unchanged.
 *
 * `req.institutionId` / `req.institutionDepartment` are still populated (from the DB row) for
 * backward compatibility, but they are now derived CONSTANTS — not a per-request routing key.
 *
 * (Formerly this extracted an institutionId from JWT/header/query, validated it, and picked a
 * per-tenant DataSource via `DataSourceManager` — all deleted. The export name is kept so the
 * ~30 routers that mount it need no change.)
 */
export async function institutionResolver(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!AppDataSource.isInitialized) {
      await initializeDatabase();
    }

    const institution = await getInstitution();

    (req as any).institution = institution;
    (req as any).institutionDataSource = AppDataSource;
    (req as any).institutionId = institution.id;
    (req as any).institutionDepartment = institution.department;

    next();
  } catch (error: any) {
    console.error(`[${NAMESPACE}] Failed to attach institution context:`, error?.message ?? error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      message: "Internal Server Error",
      error: "Failed to load institution context",
    });
  }
}

export default institutionResolver;
