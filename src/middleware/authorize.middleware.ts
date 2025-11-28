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
    const roleHierarchy = {
      [UserRole.SUPER_ADMIN]: 1,
      [UserRole.INSTITUTE_ADMIN]: 2,
      [UserRole.SUPERVISOR]: 3,
      [UserRole.CANDIDATE]: 4,
    };

    const userRoleLevel = roleHierarchy[userRole];
    const requiredMinLevel = Math.min(
      ...allowedRoles.map(role => roleHierarchy[role])
    );

    if (userRoleLevel <= requiredMinLevel) {
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

