import { inject, injectable } from "inversify";
import bcryptjs from "bcryptjs";
import crypto from "crypto";
// Removed: import { Types } from "mongoose"; - Now using UUIDs directly for MariaDB
import { PasswordResetService } from "./passwordReset.service";
import { CandService } from "../cand/cand.service";
import { SupervisorService } from "../supervisor/supervisor.service";
import { SuperAdminService } from "../superAdmin/superAdmin.service";
import { InstituteAdminService } from "../instituteAdmin/instituteAdmin.service";
import { ClerkService } from "../clerk/clerk.service";
import { MailerService } from "../mailer/mailer.service";
import { TUserRole } from "../types/role.types";
import { IPasswordResetTokenDoc } from "./passwordReset.interface";
import { AppDataSource } from "../config/database.config";
import { CandidateEntity } from "../cand/cand.mDbSchema";
import { DataSource } from "typeorm";

@injectable()
export class PasswordResetProvider {
  constructor(
    @inject(PasswordResetService) private passwordResetService: PasswordResetService,
    @inject(CandService) private candService: CandService,
    @inject(SupervisorService) private supervisorService: SupervisorService,
    @inject(SuperAdminService) private superAdminService: SuperAdminService,
    @inject(InstituteAdminService) private instituteAdminService: InstituteAdminService,
    @inject(ClerkService) private clerkService: ClerkService,
    @inject(MailerService) private mailerService: MailerService
  ) {}

  /**
   * Generate a secure random token for password reset
   */
  private generateResetToken(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  /**
   * Find user by email for forgot-password. Includes candidate, supervisor, instituteAdmin, clerk.
   * SuperAdmin is intentionally excluded: forgot/reset password is not offered for superAdmins.
   */
  public async findUserByEmail(email: string, dataSource?: DataSource): Promise<{
    user: any;
    role: TUserRole;
  } | null> | never {
    try {
      if (!dataSource) {
        throw new Error("DataSource is required for password reset operations");
      }
      // Try candidate first
      const candidate = await this.candService.getCandByEmail(email, dataSource);
      if (candidate) {
        return { user: candidate, role: "candidate" as TUserRole };
      }

      // Try supervisor
      const supervisor = await this.supervisorService.getSupervisorByEmail(email, dataSource);
      if (supervisor) {
        return { user: supervisor, role: "supervisor" as TUserRole };
      }

      // Try instituteAdmin
      const instituteAdmin = await this.instituteAdminService.getInstituteAdminByEmail(email, dataSource);
      if (instituteAdmin) {
        return { user: instituteAdmin, role: "instituteAdmin" as TUserRole };
      }

      // Try clerk (superAdmin intentionally not included)
      const clerk = await this.clerkService.getClerkByEmail(email, dataSource);
      if (clerk) {
        return { user: clerk, role: "clerk" as TUserRole };
      }

      return null;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  /**
   * Find user by ID and role
   */
  public async findUserByIdAndRole(
    userId: string,
    role: TUserRole,
    dataSource?: DataSource
  ): Promise<any | null> | never {
    try {
      if (!dataSource) {
        throw new Error("DataSource is required for password reset operations");
      }
      // Validate UUID format (support both UUID and ObjectId for backward compatibility)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const objectIdRegex = /^[0-9a-f]{24}$/i;
      
      if (!uuidRegex.test(userId) && !objectIdRegex.test(userId)) {
        throw new Error("Invalid user ID format");
      }

      switch (role) {
        case "candidate":
          const cand = await this.candService.getCandById(userId, dataSource);
          return cand;
        case "supervisor":
          const supervisor = await this.supervisorService.getSupervisorById({ id: userId }, dataSource);
          return supervisor;
        case "superAdmin":
          const superAdmin = await this.superAdminService.getSuperAdminById({ id: userId }, dataSource);
          return superAdmin;
        case "instituteAdmin":
          const instituteAdmin = await this.instituteAdminService.getInstituteAdminById({ id: userId }, dataSource);
          return instituteAdmin;
        case "clerk":
          const clerk = await this.clerkService.getClerkById({ id: userId }, dataSource);
          return clerk;
        default:
          throw new Error("Invalid role");
      }
    } catch (err: any) {
      throw new Error(err);
    }
  }

  /**
   * Max password reset tokens per user per hour. From env FORGOT_PASSWORD_RATE_LIMIT_PER_HOUR (default 3).
   */
  private getForgotPasswordRateLimitPerHour(): number {
    const raw = process.env.FORGOT_PASSWORD_RATE_LIMIT_PER_HOUR;
    if (raw == null || raw === "") return 3;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) && n > 0 ? n : 3;
  }

  /**
   * Check rate limiting for password reset requests
   */
  public async checkRateLimit(email: string, dataSource?: DataSource): Promise<boolean> | never {
    try {
      if (!dataSource) {
        throw new Error("DataSource is required for password reset operations");
      }
      const limit = this.getForgotPasswordRateLimitPerHour();
      // Find user first so we can count tokens by userId
      const userData = await this.findUserByEmail(email, dataSource);
      if (!userData) {
        return true; // Allow if user doesn't exist (security: don't reveal)
      }

      // Count tokens for this user in the last hour
      const userId = userData.user.id || (userData.user._id ? userData.user._id.toString() : null);
      if (!userId) {
        return true; // Allow if user ID not found
      }

      const oneHourMs = 60 * 60 * 1000;
      const tokenCount = await this.passwordResetService.countTokensByUserId(userId, oneHourMs, dataSource);
      // Allow if under the configured limit
      return tokenCount < limit;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  /**
   * Create password reset token and send email.
   * @param institutionId - If provided, included in the reset link so the frontend reset page can skip the institution selector.
   */
  public async createPasswordResetToken(email: string, dataSource?: DataSource, institutionId?: string): Promise<void> | never {
    try {
      if (!dataSource) {
        throw new Error("DataSource is required for password reset operations");
      }
      // Find user by email
      const userData = await this.findUserByEmail(email, dataSource);
      if (!userData) {
        console.log("[ForgotPassword] No user found for email in this institution", { email, institutionId: institutionId ?? "missing" });
        // Don't reveal if user exists (security best practice)
        return;
      }

      // Check application-level rate limit (configurable via FORGOT_PASSWORD_RATE_LIMIT_PER_HOUR)
      const isWithinRateLimit = await this.checkRateLimit(email, dataSource);
      if (!isWithinRateLimit) {
        const limit = this.getForgotPasswordRateLimitPerHour();
        console.log("[ForgotPassword] Rate limit exceeded (" + limit + "/hour per user)", { email, institutionId: institutionId ?? "missing" });
        // Don't reveal rate limit exceeded (security: don't reveal user exists)
        // Return silently to prevent email enumeration
        return;
      }

      const { user, role } = userData;
      // Support both 'id' (UUID) and '_id' (ObjectId) for backward compatibility
      const userId = user.id || (user._id ? user._id.toString() : null);
      if (!userId) {
        console.log("[ForgotPassword] User has no id", { email, role, institutionId: institutionId ?? "missing" });
        return;
      }

      // Generate secure token
      const token = this.generateResetToken();

      // Set expiration to 1 hour from now
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      // Create token record
      await this.passwordResetService.createPasswordResetToken({
        userId,
        userRole: role,
        token,
        expiresAt,
        used: false,
      }, dataSource);

      // Generate reset link (include institutionId so ResetPasswordPage does not need to show institution selector)
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      const resetLink = institutionId
        ? `${frontendUrl}/reset-password?token=${encodeURIComponent(token)}&institutionId=${encodeURIComponent(institutionId)}`
        : `${frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;

      // Send email to the stored address from the DB (not the request email), so the exact address we have on file is used
      const toAddress = (user as any).email ?? email;
      const emailHtml = this.getPasswordResetEmailHtml(user.fullName || "User", resetLink);
      const emailText = this.getPasswordResetEmailText(user.fullName || "User", resetLink);

      await this.mailerService.sendMail({
        to: toAddress,
        subject: "Password Reset Request - LibelusPro",
        html: emailHtml,
        text: emailText,
      });
      console.log("[ForgotPassword] Email sent successfully", { to: toAddress });
    } catch (err: any) {
      console.error("[ForgotPassword] Provider error:", err?.message ?? err);
      throw new Error(err);
    }
  }

  /**
   * Validate and use password reset token
   */
  public async validateAndUseToken(token: string, dataSource?: DataSource): Promise<{
    userId: string;
    userRole: TUserRole;
  }> | never {
    try {
      if (!dataSource) {
        throw new Error("DataSource is required for password reset operations");
      }
      const tokenDoc = await this.passwordResetService.findTokenByValue(token, dataSource);
      if (!tokenDoc) {
        throw new Error("Invalid or expired reset token");
      }

      // Check if token is expired
      if (tokenDoc.expiresAt < new Date()) {
        throw new Error("Invalid or expired reset token");
      }

      // Check if token is already used
      if (tokenDoc.used) {
        throw new Error("This reset token has already been used");
      }

      // Mark token as used
      await this.passwordResetService.markTokenAsUsed(token, dataSource);

      return {
        userId: tokenDoc.userId,
        userRole: tokenDoc.userRole,
      };
    } catch (err: any) {
      throw new Error(err);
    }
  }

  /**
   * Update user password by ID and role
   */
  public async updateUserPassword(
    userId: string,
    userRole: TUserRole,
    newPassword: string,
    dataSource?: DataSource
  ): Promise<void> | never {
    try {
      if (!dataSource) {
        throw new Error("DataSource is required for password reset operations");
      }
      // Validate UUID format (support both UUID and ObjectId for backward compatibility)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const objectIdRegex = /^[0-9a-f]{24}$/i;
      
      if (!uuidRegex.test(userId) && !objectIdRegex.test(userId)) {
        throw new Error("Invalid user ID format");
      }

      const hashedPassword = await bcryptjs.hash(newPassword, 10);

      switch (userRole) {
        case "candidate":
          // Update candidate password using repository directly
          // Note: CandService doesn't have a generic update method, so we use the repository pattern
          const cand = await this.candService.getCandById(userId, dataSource);
          if (!cand) {
            throw new Error("Candidate not found");
          }
          // Use the repository update pattern similar to resetCandidatePassword
          const candRepository = dataSource.getRepository(CandidateEntity);
          await candRepository.update(userId, { password: hashedPassword });
          break;
        case "supervisor":
          await this.supervisorService.updateSupervisor({
            id: userId,
            password: hashedPassword,
          }, dataSource);
          break;
        case "superAdmin":
          await this.superAdminService.updateSuperAdmin({
            id: userId,
            password: hashedPassword,
          }, dataSource);
          break;
        case "instituteAdmin":
          await this.instituteAdminService.updateInstituteAdmin({
            id: userId,
            password: hashedPassword,
          }, dataSource);
          break;
        case "clerk":
          await this.clerkService.updateClerk({
            id: userId,
            password: hashedPassword,
          }, dataSource);
          break;
        default:
          throw new Error("Invalid role");
      }
    } catch (err: any) {
      throw new Error(err);
    }
  }

  /**
   * Create password change token and send email for authenticated user
   */
  public async createPasswordChangeToken(
    userId: string,
    userRole: TUserRole,
    userEmail: string,
    userName: string,
    dataSource?: DataSource
  ): Promise<void> | never {
    try {
      if (!dataSource) {
        throw new Error("DataSource is required for password reset operations");
      }
      // Validate UUID format (support both UUID and ObjectId for backward compatibility)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const objectIdRegex = /^[0-9a-f]{24}$/i;
      
      if (!uuidRegex.test(userId) && !objectIdRegex.test(userId)) {
        throw new Error("Invalid user ID format");
      }

      // Generate secure token
      const token = this.generateResetToken();

      // Set expiration to 1 hour from now
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      // Create token record
      await this.passwordResetService.createPasswordResetToken({
        userId,
        userRole,
        token,
        expiresAt,
        used: false,
      }, dataSource);

      // Generate password change link with role-specific path
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      const resetLink = `${frontendUrl}/dashboard/${userRole}/profile/manage-profile-information/change-password?token=${token}`;

      // Send email
      const emailHtml = this.getPasswordChangeEmailHtml(userName, resetLink);
      const emailText = this.getPasswordChangeEmailText(userName, resetLink);

      await this.mailerService.sendMail({
        to: userEmail,
        subject: "Password Change Request - LibelusPro",
        html: emailHtml,
        text: emailText,
      });
    } catch (err: any) {
      throw new Error(err);
    }
  }

  /**
   * Change password for authenticated user (supports both currentPassword and token flows)
   */
  public async changePassword(
    userId: string,
    userRole: TUserRole,
    newPassword: string,
    currentPassword?: string,
    token?: string,
    dataSource?: DataSource
  ): Promise<void> | never {
    try {
      if (!dataSource) {
        throw new Error("DataSource is required for password reset operations");
      }
      // Validate UUID format (support both UUID and ObjectId for backward compatibility)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const objectIdRegex = /^[0-9a-f]{24}$/i;
      
      if (!uuidRegex.test(userId) && !objectIdRegex.test(userId)) {
        throw new Error("Invalid user ID format");
      }

      // If token is provided, validate and use it
      if (token) {
        const tokenData = await this.validateAndUseToken(token, dataSource);
        
        // Verify the token belongs to the authenticated user
        if (tokenData.userId !== userId || tokenData.userRole !== userRole) {
          throw new Error("Token does not belong to this user");
        }
      } else if (currentPassword) {
        // Find user
        let user: any = null;
        switch (userRole) {
          case "candidate":
            user = await this.candService.getCandById(userId, dataSource);
            break;
          case "supervisor":
            user = await this.supervisorService.getSupervisorById({ id: userId }, dataSource);
            break;
          case "superAdmin":
            user = await this.superAdminService.getSuperAdminById({ id: userId }, dataSource);
            break;
          case "instituteAdmin":
            user = await this.instituteAdminService.getInstituteAdminById({ id: userId }, dataSource);
            break;
          default:
            throw new Error("Invalid role");
        }

        if (!user) {
          throw new Error("User not found");
        }

        // Verify current password
        const isMatch = await bcryptjs.compare(currentPassword, user.password);
        if (!isMatch) {
          throw new Error("Current password is incorrect");
        }

        // Check if new password is same as current
        const isSame = await bcryptjs.compare(newPassword, user.password);
        if (isSame) {
          throw new Error("New password must be different from current password");
        }
      } else {
        throw new Error("Either currentPassword or token must be provided");
      }

      // Update password
      await this.updateUserPassword(userId, userRole, newPassword, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  /**
   * Get HTML email template for password reset (styled per EMAIL_STYLE_GUIDE.md)
   */
  private getPasswordResetEmailHtml(userName: string, resetLink: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset Request</title>
</head>
<body style="margin: 0; padding: 24px 16px; background-color: #eff6ff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 480px; margin: 0 auto;">
    <tr>
      <td style="padding: 24px 0 8px; text-align: center;">
        <span style="display: inline-block; padding: 8px 16px; background-color: #dbeafe; color: #1d4ed8; font-size: 14px; font-weight: 600; border-radius: 9999px;">LibelusPro</span>
      </td>
    </tr>
    <tr>
      <td style="padding: 16px 0; font-size: 24px; font-weight: 700; color: #111827; text-align: center;">Password reset request</td>
    </tr>
    <tr>
      <td style="padding: 24px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px;">
        <p style="margin: 0 0 16px; font-size: 16px; color: #4b5563; line-height: 1.5;">Hello ${userName},</p>
        <p style="margin: 0 0 16px; font-size: 16px; color: #4b5563; line-height: 1.5;">We received a request to reset your password. Click the button below to choose a new password.</p>
        <p style="margin: 0 0 20px; text-align: center;">
          <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(to right, #2563eb, #0d9488); color: #ffffff; font-weight: 600; font-size: 16px; text-decoration: none; border-radius: 8px;">Reset password</a>
        </p>
        <p style="margin: 0 0 16px; font-size: 14px; color: #6b7280; line-height: 1.5;">Or copy this link into your browser:</p>
        <p style="margin: 0 0 16px; font-size: 14px; word-break: break-all;"><a href="${resetLink}" style="color: #2563eb;">${resetLink}</a></p>
        <p style="margin: 0; font-size: 14px; color: #6b7280;">This link expires in 1 hour.</p>
      </td>
    </tr>
    <tr>
      <td style="padding-top: 16px; padding-bottom: 8px; padding-left: 0; padding-right: 0;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #dbeafe; border: 1px solid #bfdbfe; border-radius: 8px;"><tr><td style="padding: 16px; font-size: 14px; color: #1d4ed8; line-height: 1.5;"><strong>Security:</strong> If you did not request this, ignore this email. Your password will not change.</td></tr></table>
      </td>
    </tr>
    <tr>
      <td style="padding: 16px 0 0; font-size: 12px; color: #6b7280; text-align: center;">LibelusPro — The intelligent logbook for medical training and practice.</td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  /**
   * Get plain text email template for password reset
   */
  private getPasswordResetEmailText(userName: string, resetLink: string): string {
    return `
Password reset request — LibelusPro

Hello ${userName},

We received a request to reset your password. Click the link below to choose a new password:

${resetLink}

This link expires in 1 hour.

Security: If you did not request this, ignore this email. Your password will not change.

—
LibelusPro — The intelligent logbook for medical training and practice.
    `.trim();
  }

  /**
   * Get HTML email template for password change
   */
  private getPasswordChangeEmailHtml(userName: string, changeLink: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Change Request</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
    <h2 style="color: #2c3e50;">Password Change Request</h2>
    <p>Hello ${userName},</p>
    <p>You requested to change your password for your LibelusPro account.</p>
    <p>Click the button below to change your password:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${changeLink}" style="background-color: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Change Password</a>
    </div>
    <p>Or copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #3498db;">${changeLink}</p>
    <p><strong>This link will expire in 1 hour.</strong></p>
    <p style="color: #e74c3c; font-size: 14px;"><strong>Security Notice:</strong> If you did not request this password change, please ignore this email and contact support immediately. Your password will remain unchanged.</p>
    <p style="margin-top: 30px; font-size: 12px; color: #7f8c8d;">This is an automated message. Please do not reply to this email.</p>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Get plain text email template for password change
   */
  private getPasswordChangeEmailText(userName: string, changeLink: string): string {
    return `
Password Change Request - LibelusPro

Hello ${userName},

You requested to change your password for your LibelusPro account.

Click the link below to change your password:
${changeLink}

This link will expire in 1 hour.

Security Notice: If you did not request this password change, please ignore this email and contact support immediately. Your password will remain unchanged.

This is an automated message. Please do not reply to this email.
    `.trim();
  }
}

