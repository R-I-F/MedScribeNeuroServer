import { injectable } from "inversify";
import jwt, { SignOptions } from "jsonwebtoken";
import config from "../config/server.config";
import IAuth from "./auth.interface";
const NAMESPACE = "AuthTokenService";

@injectable()
export class AuthTokenService {
  private readonly signOptions: SignOptions;

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
  }

  public async sign(user: Pick<IAuth, "email">): Promise<string> {
    console.log(NAMESPACE, `Attempting to sign token for ${user.email}`);

    try {
      return await new Promise<string>((resolve, reject) => {
        jwt.sign(
          {
            email: user.email,
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
}