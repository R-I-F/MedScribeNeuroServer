import { Request, Response } from "express";
import { inject, injectable } from "inversify";
import { PasswordResetProvider } from "./passwordReset.provider";
import { matchedData } from "express-validator";

@injectable()
export class PasswordResetController {
  constructor(
    @inject(PasswordResetProvider) private passwordResetProvider: PasswordResetProvider
  ) {}

  public async handleChangePassword(req: Request, res: Response) {
    try {
      const jwtPayload = res.locals.jwt as { id?: string; _id?: string; email: string; role: string } | undefined;
      
      // Support both 'id' (UUID) and '_id' (ObjectId) for backward compatibility
      const userId = jwtPayload?.id || jwtPayload?._id;
      
      if (!jwtPayload || !userId || !jwtPayload.role) {
        throw new Error("Unauthorized: No user ID found in token");
      }

      const validatedData = matchedData(req) as {
        currentPassword?: string;
        token?: string;
        newPassword: string;
      };

      await this.passwordResetProvider.changePassword(
        userId,
        jwtPayload.role as any,
        validatedData.newPassword,
        validatedData.currentPassword,
        validatedData.token
      );

      return {
        message: "Password changed successfully",
      };
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleRequestPasswordChangeEmail(req: Request, res: Response) {
    try {
      const jwtPayload = res.locals.jwt as { id?: string; _id?: string; email: string; role: string } | undefined;
      
      // Support both 'id' (UUID) and '_id' (ObjectId) for backward compatibility
      const userId = jwtPayload?.id || jwtPayload?._id;
      
      if (!jwtPayload || !userId || !jwtPayload.role || !jwtPayload.email) {
        throw new Error("Unauthorized: No user information found in token");
      }

      // Get user details to get fullName
      const userData = await this.passwordResetProvider.findUserByIdAndRole(
        userId,
        jwtPayload.role as any
      );

      if (!userData) {
        throw new Error("User not found");
      }

      const userName = (userData as any).fullName || "User";

      await this.passwordResetProvider.createPasswordChangeToken(
        userId,
        jwtPayload.role as any,
        jwtPayload.email,
        userName
      );

      return {
        message: "Password change email sent successfully",
      };
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleForgotPassword(req: Request, res: Response) {
    try {
      const validatedData = matchedData(req) as { email: string };
      
      // Always return success message (security best practice)
      await this.passwordResetProvider.createPasswordResetToken(validatedData.email);

      return {
        message: "If an account with that email exists, a password reset link has been sent",
      };
    } catch (err: any) {
      // Even on error, return success message to prevent email enumeration
      return {
        message: "If an account with that email exists, a password reset link has been sent",
      };
    }
  }

  public async handleResetPassword(req: Request, res: Response) {
    try {
      const validatedData = matchedData(req) as {
        token: string;
        newPassword: string;
      };

      // Validate and use token
      const { userId, userRole } = await this.passwordResetProvider.validateAndUseToken(
        validatedData.token
      );

      // Update password
      await this.passwordResetProvider.updateUserPassword(
        userId,
        userRole,
        validatedData.newPassword
      );

      return {
        message: "Password reset successfully",
      };
    } catch (err: any) {
      throw new Error(err);
    }
  }
}

