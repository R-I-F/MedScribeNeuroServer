import bcryptjs from "bcryptjs";
import { inject, injectable } from "inversify";
import { CandService } from "../cand/cand.service";
import { SupervisorService } from "../supervisor/supervisor.service";
import { SuperAdminService } from "../superAdmin/superAdmin.service";
import { InstituteAdminService } from "../instituteAdmin/instituteAdmin.service";
import { ClerkService } from "../clerk/clerk.service";
import { AuthTokenService } from "./authToken.service";
import { ICandDoc } from "../cand/cand.interface";
import { JwtPayload } from "../middleware/authorize.middleware";
import IAuth, { IRegisterCandPayload } from "./auth.interface";
import { UserRole } from "../types/role.types";

@injectable()
export class AuthController {
  constructor(
    @inject(CandService) private candService: CandService,
    @inject(SupervisorService) private supervisorService: SupervisorService,
    @inject(SuperAdminService) private superAdminService: SuperAdminService,
    @inject(InstituteAdminService) private instituteAdminService: InstituteAdminService,
    @inject(ClerkService) private clerkService: ClerkService,
    @inject(AuthTokenService) private authTokenService: AuthTokenService
  ){}

  public validationToken(tokenPayload: JwtPayload | string | undefined) {
    return {
      authorized: true,
      tokenPayload,
    };
  }

  public async registerCand(payload: IRegisterCandPayload) {
    const {
      email,
      password,
      fullName,
      phoneNum,
      regNum,
      nationality,
      rank,
      regDeg,
    } = payload;

    try {
      const encPass = await bcryptjs.hash(password, 10);

      const newCand = await this.candService.createCand({
        email,
        password: encPass,
        fullName,
        phoneNum,
        approved: false,
        regNum,
        nationality,
        rank,
        regDeg,
      });

      return this.sanitizeCandidate(newCand);
    } catch (err: any) {
      throw new Error(err?.message ?? "Failed to register candidate");
    }
    // TODO: Create user in database
  };
  
  public async login(payload: IAuth & { role?: UserRole }){
    const { email, password, role } = payload;
    try {
      let user: any = null;
      let userRole: UserRole | undefined;

      // Determine which service to use based on role or try all
      if (role) {
        switch(role) {
          case UserRole.CANDIDATE:
            user = await this.candService.getCandByEmail(email);
            userRole = UserRole.CANDIDATE;
            break;
          case UserRole.SUPERVISOR:
            user = await this.supervisorService.getSupervisorByEmail(email);
            userRole = UserRole.SUPERVISOR;
            break;
          case UserRole.SUPER_ADMIN:
            user = await this.superAdminService.getSuperAdminByEmail(email);
            userRole = UserRole.SUPER_ADMIN;
            break;
          case UserRole.INSTITUTE_ADMIN:
            user = await this.instituteAdminService.getInstituteAdminByEmail(email);
            userRole = UserRole.INSTITUTE_ADMIN;
            break;
          case UserRole.CLERK:
            user = await this.clerkService.getClerkByEmail(email);
            userRole = UserRole.CLERK;
            break;
          default:
            throw new Error("Invalid role specified");
        }
      } else {
        // Try all roles (backward compatibility - try candidate first)
        user = await this.candService.getCandByEmail(email);
        if (user) {
          userRole = UserRole.CANDIDATE;
        } else {
          user = await this.supervisorService.getSupervisorByEmail(email);
          if (user) {
            userRole = UserRole.SUPERVISOR;
          } else {
            user = await this.superAdminService.getSuperAdminByEmail(email);
            if (user) {
              userRole = UserRole.SUPER_ADMIN;
            } else {
            user = await this.instituteAdminService.getInstituteAdminByEmail(email);
            if (user) {
              userRole = UserRole.INSTITUTE_ADMIN;
            } else {
              user = await this.clerkService.getClerkByEmail(email);
              if (user) {
                userRole = UserRole.CLERK;
              }
            }
          }
        }
      }
      }

      if(!user || !userRole){
        throw new Error("UnAuthorized");
      }

      const isMatch = await bcryptjs.compare(password, user.password);
      if (!isMatch) {
        throw new Error("UnAuthorized: wrong password");
      }

      // Extract id from user document (support both UUID 'id' and ObjectId '_id' for backward compatibility)
      const userId = user.id || (user._id ? user._id.toString() : null);
      if (!userId) {
        throw new Error("User ID not found");
      }

      const accessToken = await this.authTokenService.sign({ 
        email: user.email,
        role: userRole,
        id: userId,  // Use 'id' for new tokens (UUID)
        _id: userId  // Keep '_id' for backward compatibility with existing tokens
      });

      const refreshToken = await this.authTokenService.signRefreshToken({
        email: user.email,
        role: userRole,
        id: userId,  // Use 'id' for new tokens (UUID)
        _id: userId  // Keep '_id' for backward compatibility with existing tokens
      });

      // Log successful login (logging happens in router to access request info)

      return {
        token: accessToken,
        refreshToken: refreshToken,
        user: this.sanitizeUser(user, userRole),
        role: userRole
      };
    }
    catch (err: any) {
      // Log failed login attempt (detailed logging happens in router)
      const errorMessage = err?.message ?? "Failed to login";
      throw new Error(errorMessage);
    }
  };
  
  public async getAllUsers(){};

  public async resetCandidatePasswords() {
    const defaultPassword = "MEDscrobe01$";
    try {
      const hashedPassword = await bcryptjs.hash(defaultPassword, 10);
      const modifiedCount = await this.candService.resetAllCandidatePasswords(
        hashedPassword
      );
      return {
        modifiedCount,
        defaultPassword,
      };
    } catch (err: any) {
      throw new Error(err?.message ?? "Failed to reset candidate passwords");
    }
  }

  /**
   * Refresh access token using refresh token
   */
  public async refreshToken(refreshTokenPayload: any) {
    try {
      // Extract user info from refresh token payload (support both 'id' and '_id')
      const { email, role, id, _id } = refreshTokenPayload;
      const userId = id || _id;

      if (!email || !role || !userId) {
        throw new Error("Invalid refresh token payload");
      }

      // Generate new access token
      const newAccessToken = await this.authTokenService.sign({
        email,
        role: role as UserRole,
        id: userId,  // Use 'id' for new tokens (UUID)
        _id: userId  // Keep '_id' for backward compatibility
      });

      // Optionally generate new refresh token (token rotation)
      const newRefreshToken = await this.authTokenService.signRefreshToken({
        email,
        role: role as UserRole,
        id: userId,  // Use 'id' for new tokens (UUID)
        _id: userId  // Keep '_id' for backward compatibility
      });

      return {
        token: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (err: any) {
      throw new Error(err?.message ?? "Failed to refresh token");
    }
  }


  private sanitizeCandidate(candidate: ICandDoc) {
    const candidateObject =
      typeof (candidate as any).toObject === "function"
        ? (candidate as any).toObject()
        : candidate;

    const { password, __v, ...rest } = candidateObject;
    // Ensure 'id' is present (convert _id to id if needed for backward compatibility)
    if (rest._id && !rest.id) {
      rest.id = typeof rest._id === "string" ? rest._id : rest._id.toString();
    }
    return rest;
  }

  private sanitizeUser(user: any, role: UserRole) {
    const userObject = typeof user.toObject === "function" 
      ? user.toObject() 
      : user;
    const { password, __v, ...rest } = userObject;
    // Ensure 'id' is present (convert _id to id if needed for backward compatibility)
    if (rest._id && !rest.id) {
      rest.id = typeof rest._id === "string" ? rest._id : rest._id.toString();
    }
    return rest;
  }
}

