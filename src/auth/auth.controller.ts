import bcryptjs from "bcryptjs";
import { inject, injectable } from "inversify";
import { CandService } from "../cand/cand.service";
import { SupervisorService } from "../supervisor/supervisor.service";
import { SuperAdminService } from "../superAdmin/superAdmin.service";
import { InstituteAdminService } from "../instituteAdmin/instituteAdmin.service";
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

      // Extract _id from user document (convert ObjectId to string)
      const userId = user._id ? user._id.toString() : null;
      if (!userId) {
        throw new Error("User ID not found");
      }

      const accessToken = await this.authTokenService.sign({ 
        email: user.email,
        role: userRole,
        _id: userId
      });

      const refreshToken = await this.authTokenService.signRefreshToken({
        email: user.email,
        role: userRole,
        _id: userId
      });

      return {
        token: accessToken,
        refreshToken: refreshToken,
        user: this.sanitizeUser(user, userRole),
        role: userRole
      };
    }
    catch (err: any) {
      throw new Error(err?.message ?? "Failed to login");
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
      // Extract user info from refresh token payload
      const { email, role, _id } = refreshTokenPayload;

      if (!email || !role || !_id) {
        throw new Error("Invalid refresh token payload");
      }

      // Generate new access token
      const newAccessToken = await this.authTokenService.sign({
        email,
        role: role as UserRole,
        _id,
      });

      // Optionally generate new refresh token (token rotation)
      const newRefreshToken = await this.authTokenService.signRefreshToken({
        email,
        role: role as UserRole,
        _id,
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
    return rest;
  }

  private sanitizeUser(user: any, role: UserRole) {
    const userObject = typeof user.toObject === "function" 
      ? user.toObject() 
      : user;
    const { password, __v, ...rest } = userObject;
    return rest;
  }
}

