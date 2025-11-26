import bcryptjs from "bcryptjs";
import { inject, injectable } from "inversify";
import { CandService } from "../cand/cand.service";
import { AuthTokenService } from "./authToken.service";
import { ICandDoc } from "../cand/cand.interface";
import { JwtPayload } from "jsonwebtoken";
import IAuth, { IRegisterCandPayload } from "./auth.interface";

@injectable()
export class AuthController {
  constructor(
    @inject(CandService) private candService: CandService,
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
  
  public async login(payload: IAuth){
    const { email, password } = payload;
    try {
      const cand = await this.candService.getCandByEmail(email);
      if(!cand){
        throw new Error("UnAuthorized");
      }
      const isMatch = await bcryptjs.compare(password, cand.password);

      if (!isMatch) {
        throw new Error("UnAuthorized: wrong password");
      }

      const token = await this.authTokenService.sign({ email: cand.email });
      console.log("[AuthController] Generated token for", cand.email, token);
      return {
        token,
        candidate: this.sanitizeCandidate(cand),
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

  private sanitizeCandidate(candidate: ICandDoc) {
    const candidateObject =
      typeof (candidate as any).toObject === "function"
        ? (candidate as any).toObject()
        : candidate;

    const { password, __v, ...rest } = candidateObject;
    return rest;
  }
}

