import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { UserRole } from "../types/role.types";
import { SupervisorService } from "../supervisor/supervisor.service";
import { container } from "../config/container.config";

export interface JwtPayload {
  email: string;
  role: string;
  id?: string;  // User's UUID (new format)
  _id?: string; // User's MongoDB ObjectId as string (backward compatibility)
}

// Middleware to check if user has required role or higher
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const jwtPayload = res.locals.jwt as JwtPayload | undefined;
    
    if (!jwtPayload || !jwtPayload.role) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ 
        error: "Unauthorized: No role found in token" 
      });
    }

    const userRole = jwtPayload.role as UserRole;
    
    // Check if user's role is in the allowed roles list
    // For hierarchical access (where higher roles can access lower role endpoints),
    // we use a role hierarchy to determine access
    const roleHierarchy = {
      [UserRole.SUPER_ADMIN]: 1,
      [UserRole.INSTITUTE_ADMIN]: 2,
      [UserRole.SUPERVISOR]: 3,
      [UserRole.CANDIDATE]: 4,
    };

    const userRoleLevel = roleHierarchy[userRole];
    
    // For hierarchical access: users with higher privileges (lower numbers) can access lower privilege endpoints
    // Example: requireCandidate allows CANDIDATE(4), SUPERVISOR(3), INSTITUTE_ADMIN(2), SUPER_ADMIN(1)
    // We check if userRoleLevel <= max(allowedRoles) to allow all roles at or above the minimum required level
    const allowedRoleLevels = allowedRoles.map(role => roleHierarchy[role]);
    const maxAllowedLevel = Math.max(...allowedRoleLevels);

    // User's role level must be <= max allowed level (lower number = higher privilege)
    // This allows higher privilege roles to access lower privilege endpoints
    if (userRoleLevel <= maxAllowedLevel) {
      return next();
    }

    return res.status(StatusCodes.FORBIDDEN).json({
      error: "Forbidden: Insufficient permissions"
    });
  };
};

// Convenience middleware for each role level
export const requireSuperAdmin = authorize(UserRole.SUPER_ADMIN);
export const requireInstituteAdmin = authorize(UserRole.INSTITUTE_ADMIN, UserRole.SUPER_ADMIN);
export const requireSupervisor = authorize(UserRole.SUPERVISOR, UserRole.INSTITUTE_ADMIN, UserRole.SUPER_ADMIN);
export const requireCandidate = authorize(UserRole.CANDIDATE, UserRole.SUPERVISOR, UserRole.INSTITUTE_ADMIN, UserRole.SUPER_ADMIN);

// Middleware to require supervisor with validation permissions (canValidate = true)
// This is used for submission review endpoints
// Both validator and academic supervisors can access events, but only validators can review submissions
export const requireValidatorSupervisor = async (req: Request, res: Response, next: NextFunction) => {
  // First check if user is a supervisor (or higher role)
  const jwtPayload = res.locals.jwt as JwtPayload | undefined;
  
  if (!jwtPayload || !jwtPayload.role) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ 
      error: "Unauthorized: No role found in token" 
    });
  }

  const userRole = jwtPayload.role as UserRole;
  
  // Allow Super Admin and Institute Admin to bypass this check (they can always validate)
  if (userRole === UserRole.SUPER_ADMIN || userRole === UserRole.INSTITUTE_ADMIN) {
    return next();
  }

  // For supervisors, check if they have canValidate permission
  if (userRole === UserRole.SUPERVISOR) {
    try {
      // Support both 'id' (UUID) and '_id' (ObjectId) for backward compatibility
      const supervisorId = jwtPayload.id || jwtPayload._id;
      
      if (!supervisorId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          error: "Supervisor ID not found in token"
        });
      }

      const supervisorService = container.get<SupervisorService>(SupervisorService);
      const supervisor = await supervisorService.getSupervisorById({ id: supervisorId });
      
      if (!supervisor) {
        return res.status(StatusCodes.NOT_FOUND).json({
          error: "Supervisor not found"
        });
      }

      // Check canValidate field (defaults to true if not set for backward compatibility)
      const canValidate = supervisor.canValidate !== undefined ? supervisor.canValidate : true;
      
      if (!canValidate) {
        return res.status(StatusCodes.FORBIDDEN).json({
          error: "Forbidden: This supervisor does not have validation permissions. Only validator supervisors can review submissions."
        });
      }

      return next();
    } catch (err: any) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: "Error checking supervisor validation permissions"
      });
    }
  }

  // If not supervisor, admin, or super admin, deny access
  return res.status(StatusCodes.FORBIDDEN).json({
    error: "Forbidden: Insufficient permissions"
  });
};

