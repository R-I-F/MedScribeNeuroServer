import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { DataSourceManager } from "../config/datasource.manager";
import { getInstitutionById } from "../institution/institution.service";

const NAMESPACE = "InstitutionResolver";

/**
 * Institution Resolver Middleware
 * 
 * Resolves the institution context for each request:
 * 1. Extracts institutionId from JWT (primary) or header/query (fallback)
 * 2. Validates institution exists and is active
 * 3. Gets DataSource from connection pool
 * 4. Attaches to request for use in controllers/services
 * 
 * Middleware order: extractJWT → institutionResolver → authorize → rateLimit → handler
 */
export async function institutionResolver(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Allow bypass for institution selection endpoint (public)
    if (req.path === "/institutions" || req.path.startsWith("/institutions/")) {
      return next();
    }

    // Allow bypass for auth endpoints that handle institution selection during request
    if (req.path.startsWith("/auth/")) {
      const authEndpoints = ["/auth/login", "/auth/loginCand", "/auth/registerCand"];
      if (authEndpoints.some(endpoint => req.path === endpoint || req.path.startsWith(endpoint + "/"))) {
        // Institution will be resolved during login/register
        return next();
      }
    }

    // Extract institutionId from multiple sources (priority order)
    let institutionId: string | undefined;

    // 1. Primary: From JWT token (after extractJWT middleware)
    if (res.locals.jwt?.institutionId) {
      institutionId = res.locals.jwt.institutionId;
    }

    // 2. Fallback: From header (for pre-login requests or API clients)
    if (!institutionId) {
      institutionId = req.get("X-Institution-Id") || undefined;
    }

    // 3. Fallback: From query parameter (for initial requests)
    if (!institutionId && req.query.institutionId) {
      institutionId = req.query.institutionId as string;
    }

    // If no institutionId found, return error (except for public endpoints already handled above)
    if (!institutionId) {
      res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        statusCode: StatusCodes.BAD_REQUEST,
        message: "Bad Request",
        error: "Institution ID is required. Include X-Institution-Id header, select institution via GET /institutions, or login to get institutionId in JWT token."
      });
      return;
    }

    // Validate institution exists
    const institution = await getInstitutionById(institutionId);
    if (!institution) {
      res.status(StatusCodes.NOT_FOUND).json({
        status: "error",
        statusCode: StatusCodes.NOT_FOUND,
        message: "Not Found",
        error: `Institution with ID ${institutionId} not found`
      });
      return;
    }

    // Validate institution is active
    if (!institution.isActive) {
      res.status(StatusCodes.FORBIDDEN).json({
        status: "error",
        statusCode: StatusCodes.FORBIDDEN,
        message: "Forbidden",
        error: `Institution ${institution.name} is not active`
      });
      return;
    }

    // Get or create DataSource for this institution (connection pooling)
    const dataSourceManager = DataSourceManager.getInstance();
    let dataSource: any;
    try {
      dataSource = await dataSourceManager.getDataSource(institutionId);
    } catch (error: any) {
      console.error(`[${NAMESPACE}] Failed to get DataSource for institution ${institutionId}:`, error.message);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: "error",
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        message: "Internal Server Error",
        error: "Failed to connect to institution database. Please try again later."
      });
      return;
    }

    // Attach to request context
    (req as any).institutionId = institutionId;
    (req as any).institutionDataSource = dataSource;

    next();
  } catch (error: any) {
    console.error(`[${NAMESPACE}] Unexpected error:`, error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      message: "Internal Server Error",
      error: "Failed to resolve institution database connection"
    });
  }
}

export default institutionResolver;
