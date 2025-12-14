import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { UserRole } from "../types/role.types";

export interface JwtPayload {
  email: string;
  role: string;
  _id: string; // User's MongoDB ObjectId as string
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

