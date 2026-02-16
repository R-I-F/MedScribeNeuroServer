import bcryptjs from "bcryptjs";
import { inject, injectable } from "inversify";
import { DataSource } from "typeorm";
import { CandService } from "../cand/cand.service";
import { SupervisorService } from "../supervisor/supervisor.service";
import { SuperAdminService } from "../superAdmin/superAdmin.service";
import { InstituteAdminService } from "../instituteAdmin/instituteAdmin.service";
import { ClerkService } from "../clerk/clerk.service";
import { AuthTokenService } from "./authToken.service";
import { ICandDoc } from "../cand/cand.interface";
import { JwtPayload } from "../middleware/authorize.middleware";
import IAuth, { IRegisterCandPayload, IRegisterSupervisorPayload } from "./auth.interface";
import { UserRole } from "../types/role.types";
import { DataSourceManager } from "../config/datasource.manager";
import { getInstitutionById } from "../institution/institution.service";
import { CandidateEntity } from "../cand/cand.mDbSchema";
import { SupervisorEntity } from "../supervisor/supervisor.mDbSchema";
import { ISupervisorDoc } from "../supervisor/supervisor.interface";
import { SuperAdminEntity } from "../superAdmin/superAdmin.mDbSchema";
import { InstituteAdminEntity } from "../instituteAdmin/instituteAdmin.mDbSchema";
import { ClerkEntity } from "../clerk/clerk.mDbSchema";

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

  public async registerCand(payload: IRegisterCandPayload, dataSource: DataSource) {
    const {
      email,
      password,
      fullName,
      phoneNum,
      regNum,
      nationality,
      rank,
      regDeg,
      institutionId,
    } = payload;

    try {
      // Institution ID is required; default DB is for other configurations only
      if (!institutionId) {
        throw new Error("institutionId is required for candidate registration");
      }
      const institution = await getInstitutionById(institutionId);
      if (!institution || !institution.isActive) {
        throw new Error(`Invalid or inactive institution: ${institutionId}`);
      }

      const encPass = await bcryptjs.hash(password, 10);

      // Use institution DataSource only (never fall back to default DB)
      const candRepository = dataSource.getRepository(CandidateEntity);
      const newCand = candRepository.create({
        email,
        password: encPass,
        fullName,
        phoneNum,
        approved: false, // Default: unapproved until institution approves
        role: UserRole.CANDIDATE, // Default role for registration
        regNum,
        nationality,
        rank,
        regDeg: regDeg != null && String(regDeg).trim() !== "" ? regDeg : null, // Optional for non-academic institutions
      });
      newCand.termsAcceptedAt = new Date(); // Terms accepted at signup via frontend
      const savedCand = await candRepository.save(newCand);

      return this.sanitizeCandidate(savedCand as unknown as ICandDoc);
    } catch (err: any) {
      throw new Error(err?.message ?? "Failed to register candidate");
    }
  }

  /**
   * Register a new supervisor in the institution's database.
   * Supervisor is created with approved: false. Institution ID is required.
   */
  public async registerSupervisor(payload: IRegisterSupervisorPayload, dataSource: DataSource) {
    const { email, password, fullName, phoneNum, institutionId, position } = payload;

    try {
      if (!institutionId) {
        throw new Error("institutionId is required for supervisor registration");
      }
      const institution = await getInstitutionById(institutionId);
      if (!institution || !institution.isActive) {
        throw new Error(`Invalid or inactive institution: ${institutionId}`);
      }

      const encPass = await bcryptjs.hash(password, 10);

      const supervisorRepository = dataSource.getRepository(SupervisorEntity);
      const newSupervisor = supervisorRepository.create({
        email,
        password: encPass,
        fullName,
        phoneNum,
        approved: false, // Default: unapproved until institution approves
        role: UserRole.SUPERVISOR, // Default role for registration
        canValidate: false, // Default: no validation rights until granted by admin
        ...(position != null && String(position).trim() !== "" && { position: position as any }),
      });
      newSupervisor.termsAcceptedAt = new Date(); // Terms accepted at signup via frontend
      const savedSupervisor = await supervisorRepository.save(newSupervisor);

      return this.sanitizeSupervisor(savedSupervisor as unknown as ISupervisorDoc);
    } catch (err: any) {
      throw new Error(err?.message ?? "Failed to register supervisor");
    }
  }
  
  /**
   * Candidate and Supervisor login - shared endpoint
   * REQUIRES institutionId since each institution has its own candidates and supervisors
   */
  public async candidateSupervisorLogin(payload: IAuth, dataSource: DataSource) {
    const { email, password, institutionId } = payload;
    try {
      // institutionId is REQUIRED
      if (!institutionId) {
        throw new Error("institutionId is required for login");
      }

      // DataSource is REQUIRED (must be provided from router)
      if (!dataSource) {
        throw new Error("Institution DataSource is required for login");
      }

      // Validate institution
      const institution = await getInstitutionById(institutionId);
      if (!institution || !institution.isActive) {
        throw new Error(`Invalid or inactive institution: ${institutionId}`);
      }

      // Use the provided DataSource (institution-specific)
      const targetDataSource = dataSource;

      // Helper function to query user by email from DataSource
      const findUserByEmail = async (entityClass: any, email: string): Promise<any> => {
        const repository = targetDataSource.getRepository(entityClass);
        return await repository.findOne({ where: { email } });
      };

      // Try candidate first, then supervisor
      let user: any = null;
      let userRole: UserRole | undefined;

      user = await findUserByEmail(CandidateEntity, email);
      if (user) {
        userRole = UserRole.CANDIDATE;
      } else {
        user = await findUserByEmail(SupervisorEntity, email);
        if (user) {
          userRole = UserRole.SUPERVISOR;
        }
      }

      if (!user || !userRole) {
        throw new Error("Unauthorized: Candidate or Supervisor account not found");
      }

      const isMatch = await bcryptjs.compare(password, user.password);
      if (!isMatch) {
        throw new Error("Unauthorized: Invalid credentials");
      }

      // Extract id from user document (support both UUID 'id' and ObjectId '_id' for backward compatibility)
      const userId = user.id || (user._id ? user._id.toString() : null);
      if (!userId) {
        throw new Error("User ID not found");
      }

      // Include institutionId in token (required - always included)
      const tokenPayload: any = {
        email: user.email,
        role: userRole,
        id: userId,  // Use 'id' for new tokens (UUID)
        _id: userId,  // Keep '_id' for backward compatibility with existing tokens
        institutionId: institutionId  // Always included (required)
      };

      const accessToken = await this.authTokenService.sign(tokenPayload);
      const refreshToken = await this.authTokenService.signRefreshToken(tokenPayload);

      return {
        token: accessToken,
        refreshToken: refreshToken,
        user: this.sanitizeUser(user, userRole),
        role: userRole
      };
    } catch (err: any) {
      const errorMessage = err?.message ?? "Failed to login";
      throw new Error(errorMessage);
    }
  }

  /**
   * Super Admin login - isolated endpoint
   * REQUIRES institutionId since each institution has its own super admins
   */
  public async superAdminLogin(payload: IAuth, dataSource: DataSource) {
    const { email, password, institutionId } = payload;
    try {
      // institutionId is REQUIRED
      if (!institutionId) {
        throw new Error("institutionId is required for super admin login");
      }

      // DataSource is REQUIRED (must be provided from router)
      if (!dataSource) {
        throw new Error("Institution DataSource is required for super admin login");
      }

      // Validate institution
      const institution = await getInstitutionById(institutionId);
      if (!institution || !institution.isActive) {
        throw new Error(`Invalid or inactive institution: ${institutionId}`);
      }

      // Use the provided DataSource (institution-specific)
      const targetDataSource = dataSource;

      // Helper function to query user by email from DataSource
      const findUserByEmail = async (entityClass: any, email: string): Promise<any> => {
        const repository = targetDataSource.getRepository(entityClass);
        return await repository.findOne({ where: { email } });
      };

      // Query super admin from institution-specific database
      const user = await findUserByEmail(SuperAdminEntity, email);

      if (!user) {
        throw new Error("Unauthorized: Super Admin account not found");
      }

      const isMatch = await bcryptjs.compare(password, user.password);
      if (!isMatch) {
        throw new Error("Unauthorized: Invalid credentials");
      }

      // Extract id from user document (support both UUID 'id' and ObjectId '_id' for backward compatibility)
      const userId = user.id || (user._id ? user._id.toString() : null);
      if (!userId) {
        throw new Error("User ID not found");
      }

      // Include institutionId in token (required - always included)
      const tokenPayload: any = {
        email: user.email,
        role: UserRole.SUPER_ADMIN,
        id: userId,  // Use 'id' for new tokens (UUID)
        _id: userId,  // Keep '_id' for backward compatibility with existing tokens
        institutionId: institutionId  // Always included (required)
      };

      const accessToken = await this.authTokenService.sign(tokenPayload);
      const refreshToken = await this.authTokenService.signRefreshToken(tokenPayload);

      return {
        token: accessToken,
        refreshToken: refreshToken,
        user: this.sanitizeUser(user, UserRole.SUPER_ADMIN),
        role: UserRole.SUPER_ADMIN
      };
    } catch (err: any) {
      const errorMessage = err?.message ?? "Failed to login";
      throw new Error(errorMessage);
    }
  }

  /**
   * Institute Admin login - isolated endpoint
   * REQUIRES institutionId since each institution has its own institute admins
   */
  public async instituteAdminLogin(payload: IAuth, dataSource: DataSource) {
    const { email, password, institutionId } = payload;
    try {
      // institutionId is REQUIRED
      if (!institutionId) {
        throw new Error("institutionId is required for institute admin login");
      }

      // DataSource is REQUIRED (must be provided from router)
      if (!dataSource) {
        throw new Error("Institution DataSource is required for institute admin login");
      }

      // Validate institution
      const institution = await getInstitutionById(institutionId);
      if (!institution || !institution.isActive) {
        throw new Error(`Invalid or inactive institution: ${institutionId}`);
      }

      // Use the provided DataSource (institution-specific)
      const targetDataSource = dataSource;

      // Helper function to query user by email from DataSource
      const findUserByEmail = async (entityClass: any, email: string): Promise<any> => {
        const repository = targetDataSource.getRepository(entityClass);
        return await repository.findOne({ where: { email } });
      };

      // Query institute admin from institution-specific database
      const user = await findUserByEmail(InstituteAdminEntity, email);

      if (!user) {
        throw new Error("Unauthorized: Institute Admin account not found");
      }

      const isMatch = await bcryptjs.compare(password, user.password);
      if (!isMatch) {
        throw new Error("Unauthorized: Invalid credentials");
      }

      // Extract id from user document (support both UUID 'id' and ObjectId '_id' for backward compatibility)
      const userId = user.id || (user._id ? user._id.toString() : null);
      if (!userId) {
        throw new Error("User ID not found");
      }

      // Include institutionId in token (required - always included)
      const tokenPayload: any = {
        email: user.email,
        role: UserRole.INSTITUTE_ADMIN,
        id: userId,  // Use 'id' for new tokens (UUID)
        _id: userId,  // Keep '_id' for backward compatibility with existing tokens
        institutionId: institutionId  // Always included (required)
      };

      const accessToken = await this.authTokenService.sign(tokenPayload);
      const refreshToken = await this.authTokenService.signRefreshToken(tokenPayload);

      return {
        token: accessToken,
        refreshToken: refreshToken,
        user: this.sanitizeUser(user, UserRole.INSTITUTE_ADMIN),
        role: UserRole.INSTITUTE_ADMIN
      };
    } catch (err: any) {
      const errorMessage = err?.message ?? "Failed to login";
      throw new Error(errorMessage);
    }
  }

  /**
   * Admin login - handles only superAdmin and instituteAdmin
   * This is a separate endpoint from regular user login for security purposes
   * REQUIRES institutionId since each institution has its own admins
   * @deprecated Use superAdminLogin or instituteAdminLogin instead
   */
  public async adminLogin(payload: IAuth, dataSource: DataSource) {
    const { email, password, institutionId } = payload;
    try {
      // institutionId is REQUIRED for admin login (each institution has its own admins)
      if (!institutionId) {
        throw new Error("institutionId is required for admin login");
      }

      // DataSource is REQUIRED (must be provided from router)
      if (!dataSource) {
        throw new Error("Institution DataSource is required for admin login");
      }

      // Validate institution
      const institution = await getInstitutionById(institutionId);
      if (!institution || !institution.isActive) {
        throw new Error(`Invalid or inactive institution: ${institutionId}`);
      }

      // Use the provided DataSource (institution-specific)
      const targetDataSource = dataSource;

      // Helper function to query user by email from DataSource
      const findUserByEmail = async (entityClass: any, email: string): Promise<any> => {
        const repository = targetDataSource.getRepository(entityClass);
        return await repository.findOne({ where: { email } });
      };

      // Try superAdmin first, then instituteAdmin
      let user: any = null;
      let userRole: UserRole | undefined;

      user = await findUserByEmail(SuperAdminEntity, email);
      if (user) {
        userRole = UserRole.SUPER_ADMIN;
      } else {
        user = await findUserByEmail(InstituteAdminEntity, email);
        if (user) {
          userRole = UserRole.INSTITUTE_ADMIN;
        }
      }

      if (!user || !userRole) {
        throw new Error("Unauthorized: Admin account not found");
      }

      const isMatch = await bcryptjs.compare(password, user.password);
      if (!isMatch) {
        throw new Error("Unauthorized: Invalid credentials");
      }

      // Extract id from user document (support both UUID 'id' and ObjectId '_id' for backward compatibility)
      const userId = user.id || (user._id ? user._id.toString() : null);
      if (!userId) {
        throw new Error("User ID not found");
      }

      // Include institutionId in token (required for admin login - always included)
      const tokenPayload: any = {
        email: user.email,
        role: userRole,
        id: userId,  // Use 'id' for new tokens (UUID)
        _id: userId,  // Keep '_id' for backward compatibility with existing tokens
        institutionId: institutionId  // Always included for admin login (required)
      };

      const accessToken = await this.authTokenService.sign(tokenPayload);
      const refreshToken = await this.authTokenService.signRefreshToken(tokenPayload);

      return {
        token: accessToken,
        refreshToken: refreshToken,
        user: this.sanitizeUser(user, userRole),
        role: userRole
      };
    } catch (err: any) {
      const errorMessage = err?.message ?? "Failed to login";
      throw new Error(errorMessage);
    }
  }

  /**
   * Clerk login - handles only clerks
   * This is a separate endpoint from regular user login for security purposes
   * REQUIRES institutionId since each institution has its own clerks
   */
  public async clerkLogin(payload: IAuth, dataSource: DataSource) {
    const { email, password, institutionId } = payload;
    try {
      // institutionId is REQUIRED for clerk login (each institution has its own clerks)
      if (!institutionId) {
        throw new Error("institutionId is required for clerk login");
      }

      // DataSource is REQUIRED (must be provided from router)
      if (!dataSource) {
        throw new Error("Institution DataSource is required for clerk login");
      }

      // Validate institution
      const institution = await getInstitutionById(institutionId);
      if (!institution || !institution.isActive) {
        throw new Error(`Invalid or inactive institution: ${institutionId}`);
      }

      // Use the provided DataSource (institution-specific)
      const targetDataSource = dataSource;

      // Helper function to query user by email from DataSource
      const findUserByEmail = async (entityClass: any, email: string): Promise<any> => {
        const repository = targetDataSource.getRepository(entityClass);
        return await repository.findOne({ where: { email } });
      };

      // Query clerk from institution-specific database
      const user = await findUserByEmail(ClerkEntity, email);

      if (!user) {
        throw new Error("Unauthorized: Clerk account not found");
      }

      const isMatch = await bcryptjs.compare(password, user.password);
      if (!isMatch) {
        throw new Error("Unauthorized: Invalid credentials");
      }

      // Extract id from user document (support both UUID 'id' and ObjectId '_id' for backward compatibility)
      const userId = user.id || (user._id ? user._id.toString() : null);
      if (!userId) {
        throw new Error("User ID not found");
      }

      // Include institutionId in token (required for clerk login - always included)
      const tokenPayload: any = {
        email: user.email,
        role: UserRole.CLERK,
        id: userId,  // Use 'id' for new tokens (UUID)
        _id: userId,  // Keep '_id' for backward compatibility with existing tokens
        institutionId: institutionId  // Always included for clerk login (required)
      };

      const accessToken = await this.authTokenService.sign(tokenPayload);
      const refreshToken = await this.authTokenService.signRefreshToken(tokenPayload);

      return {
        token: accessToken,
        refreshToken: refreshToken,
        user: this.sanitizeUser(user, UserRole.CLERK),
        role: UserRole.CLERK
      };
    } catch (err: any) {
      const errorMessage = err?.message ?? "Failed to login";
      throw new Error(errorMessage);
    }
  }
  
  public async getAllUsers(){};

  public async resetCandidatePasswords(req: any, res: any) {
    const defaultPassword = process.env.BASE_CAND_PASSWORD;
    if (!defaultPassword) {
      throw new Error("BASE_CAND_PASSWORD environment variable is not set");
    }
    try {
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      const hashedPassword = await bcryptjs.hash(defaultPassword, 10);
      const modifiedCount = await this.candService.resetAllCandidatePasswords(
        hashedPassword,
        dataSource
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
      const { email, role, id, _id, institutionId } = refreshTokenPayload;
      const userId = id || _id;

      if (!email || !role || !userId) {
        throw new Error("Invalid refresh token payload");
      }

      const tokenPayload: any = {
        email,
        role: role as UserRole,
        id: userId,  // Use 'id' for new tokens (UUID)
        _id: userId  // Keep '_id' for backward compatibility
      };

      // Preserve institutionId if present
      if (institutionId) {
        tokenPayload.institutionId = institutionId;
      }

      // Generate new access token
      const newAccessToken = await this.authTokenService.sign(tokenPayload);

      // Optionally generate new refresh token (token rotation)
      const newRefreshToken = await this.authTokenService.signRefreshToken(tokenPayload);

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

  private sanitizeSupervisor(supervisor: ISupervisorDoc) {
    const supervisorObject =
      typeof (supervisor as any).toObject === "function"
        ? (supervisor as any).toObject()
        : supervisor;

    const { password, __v, ...rest } = supervisorObject;
    if (rest._id && !rest.id) {
      rest.id = typeof rest._id === "string" ? rest._id : rest._id.toString();
    }
    return rest;
  }

  private sanitizeUser(user: any, role: UserRole) {
    const userObject = typeof user.toObject === "function"
      ? user.toObject()
      : user;
    const { password, __v, google_uid, createdAt, updatedAt, ...rest } = userObject;
    // Ensure 'id' is present (convert _id to id if needed for backward compatibility)
    if (rest._id && !rest.id) {
      rest.id = typeof rest._id === "string" ? rest._id : rest._id.toString();
    }
    return rest;
  }
}

