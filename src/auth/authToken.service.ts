import { injectable } from "inversify";
import jwt, { SignOptions } from "jsonwebtoken";
import config from "../config/server.config";
import IAuth from "./auth.interface";
import { TUserRole } from "../types/role.types";

const NAMESPACE = "AuthTokenService";

@injectable()
export class AuthTokenService {
  private readonly signOptions: SignOptions;
  private readonly refreshSignOptions: SignOptions;

  constructor() {
    // Access token options
    // Convert expireTime to number (it's in seconds)
    const expireTimeInSeconds = Number(config.server.token.expireTime);

    this.signOptions = {
      issuer: config.server.token.issuer,
      algorithm: "HS256",
      expiresIn: expireTimeInSeconds,
    };

    // Refresh token options - longer expiration
    // Convert expireTime to number (it's in seconds)
    const refreshExpireTimeInSeconds = Number(config.server.refreshToken.expireTime);
    
    this.refreshSignOptions = {
      issuer: config.server.token.issuer,
      algorithm: "HS256",
      expiresIn: refreshExpireTimeInSeconds,
    };

    // Log token expiration times when AuthTokenService is initialized
    console.log(`[${NAMESPACE}] Token expiration configured:`);
    console.log(`  Access Token: ${expireTimeInSeconds} seconds`);
    console.log(`  Refresh Token: ${refreshExpireTimeInSeconds} seconds`);
  }

  public async sign(user: Pick<IAuth, "email"> & { role: TUserRole; id?: string; _id?: string; institutionId?: string }): Promise<string> {
    try {
      // Support both 'id' (UUID) and '_id' (ObjectId) for backward compatibility
      const userId = user.id || user._id || "";
      if (!userId) {
        throw new Error("User ID is required");
      }

      const payload: any = {
        email: user.email,
        role: user.role,
        id: userId,      // New format (UUID)
        _id: userId,     // Keep for backward compatibility
      };

      // Include institutionId if provided (for multi-tenant support)
      if (user.institutionId) {
        payload.institutionId = user.institutionId;
      }

      return await new Promise<string>((resolve, reject) => {
        jwt.sign(
          payload,
          config.server.token.secret,
          this.signOptions,
          (error, token) => {
            if (error || !token) {
              return reject(error ?? new Error("Failed to sign token"));
            }

            resolve(token);
          }
        );
      });
    } catch (error: any) {
      console.error(NAMESPACE, "Token signing failed", error);
      throw new Error(error?.message ?? "Failed to sign token");
    }
  }

  /**
   * Sign a refresh token with longer expiration
   */
  public async signRefreshToken(user: Pick<IAuth, "email"> & { role: TUserRole; id?: string; _id?: string; institutionId?: string }): Promise<string> {
    try {
      // Support both 'id' (UUID) and '_id' (ObjectId) for backward compatibility
      const userId = user.id || user._id || "";
      if (!userId) {
        throw new Error("User ID is required");
      }

      const payload: any = {
        email: user.email,
        role: user.role,
        id: userId,      // New format (UUID)
        _id: userId,     // Keep for backward compatibility
        type: "refresh",
      };

      // Include institutionId if provided (for multi-tenant support)
      if (user.institutionId) {
        payload.institutionId = user.institutionId;
      }

      return await new Promise<string>((resolve, reject) => {
        jwt.sign(
          payload,
          config.server.refreshToken.secret,
          this.refreshSignOptions,
          (error, token) => {
            if (error || !token) {
              return reject(error ?? new Error("Failed to sign refresh token"));
            }

            resolve(token);
          }
        );
      });
    } catch (error: any) {
      console.error(NAMESPACE, "Refresh token signing failed", error);
      throw new Error(error?.message ?? "Failed to sign refresh token");
    }
  }

  /**
   * Verify a refresh token
   */
  public async verifyRefreshToken(token: string): Promise<any> {
    try {
      return jwt.verify(token, config.server.refreshToken.secret, {
        issuer: config.server.token.issuer,
      });
    } catch (error: any) {
      throw new Error(error?.message ?? "Invalid refresh token");
    }
  }
}