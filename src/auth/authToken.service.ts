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
    const timeSinceEpoch = Date.now();
    const expirationTime =
      timeSinceEpoch + Number(config.server.token.expireTime) * 100000;
    const expirationTimeInSeconds = Math.floor(expirationTime / 1000);

    this.signOptions = {
      issuer: config.server.token.issuer,
      algorithm: "HS256",
      expiresIn: expirationTimeInSeconds,
    };

    // Refresh token options - longer expiration
    // Convert expireTime to number (it's in seconds)
    const refreshExpireTimeInSeconds = Number(config.server.refreshToken.expireTime);
    
    this.refreshSignOptions = {
      issuer: config.server.token.issuer,
      algorithm: "HS256",
      expiresIn: refreshExpireTimeInSeconds,
    };
  }

  public async sign(user: Pick<IAuth, "email"> & { role: TUserRole; _id: string }): Promise<string> {
    console.log(NAMESPACE, `Attempting to sign token for ${user.email} with role ${user.role} and _id ${user._id}`);

    try {
      return await new Promise<string>((resolve, reject) => {
        jwt.sign(
          {
            email: user.email,
            role: user.role,
            _id: user._id,
          },
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
  public async signRefreshToken(user: Pick<IAuth, "email"> & { role: TUserRole; _id: string }): Promise<string> {
    console.log(NAMESPACE, `Attempting to sign refresh token for ${user.email} with role ${user.role} and _id ${user._id}`);

    try {
      return await new Promise<string>((resolve, reject) => {
        jwt.sign(
          {
            email: user.email,
            role: user.role,
            _id: user._id,
            type: "refresh",
          },
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