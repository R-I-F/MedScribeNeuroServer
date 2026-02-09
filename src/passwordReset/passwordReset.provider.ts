import { inject, injectable } from "inversify";
import bcryptjs from "bcryptjs";
import crypto from "crypto";
// Removed: import { Types } from "mongoose"; - Now using UUIDs directly for MariaDB
import { PasswordResetService } from "./passwordReset.service";
import { CandService } from "../cand/cand.service";
import { SupervisorService } from "../supervisor/supervisor.service";
import { SuperAdminService } from "../superAdmin/superAdmin.service";
import { InstituteAdminService } from "../instituteAdmin/instituteAdmin.service";
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
    @inject(MailerService) private mailerService: MailerService
  ) {}

  /**
   * Generate a secure random token for password reset
   */
  private generateResetToken(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  /**
   * Find user by email across all user collections
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

      // Try superAdmin
      const superAdmin = await this.superAdminService.getSuperAdminByEmail(email, dataSource);
      if (superAdmin) {
        return { user: superAdmin, role: "superAdmin" as TUserRole };
      }

      // Try instituteAdmin
      const instituteAdmin = await this.instituteAdminService.getInstituteAdminByEmail(email, dataSource);
      if (instituteAdmin) {
        return { user: instituteAdmin, role: "instituteAdmin" as TUserRole };
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
        default:
          throw new Error("Invalid role");
      }
    } catch (err: any) {
      throw new Error(err);
    }
  }

  /**
   * Check rate limiting for password reset requests
   */
  public async checkRateLimit(email: string, dataSource?: DataSource): Promise<boolean> | never {
    try {
      if (!dataSource) {
        throw new Error("DataSource is required for password reset operations");
      }
      // Check if there are more than 3 tokens created in the last hour for this email
      // We'll need to find tokens by userId, but we need to find user first
      const userData = await this.findUserByEmail(email, dataSource);
      if (!userData) {
        return true; // Allow if user doesn't exist (security: don't reveal)
      }

      // Count tokens for this user in the last hour
      const userId = userData.user.id || (userData.user._id ? userData.user._id.toString() : null);
      if (!userId) {
        return true; // Allow if user ID not found
      }

      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      const tokenCount = await this.passwordResetService.countTokensByUserId(userId, oneHourAgo, dataSource);
      
      // Allow if less than 3 tokens in the last hour
      return tokenCount < 3;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  /**
   * Create password reset token and send email
   */
  public async createPasswordResetToken(email: string, dataSource?: DataSource): Promise<void> | never {
    try {
      if (!dataSource) {
        throw new Error("DataSource is required for password reset operations");
      }
      // Find user by email
      const userData = await this.findUserByEmail(email, dataSource);
      if (!userData) {
        // Don't reveal if user exists (security best practice)
        return;
      }

      // Check application-level rate limit (3 tokens per hour per user)
      // This provides defense in depth beyond router-level rate limiting
      const isWithinRateLimit = await this.checkRateLimit(email, dataSource);
      if (!isWithinRateLimit) {
        // Don't reveal rate limit exceeded (security: don't reveal user exists)
        // Return silently to prevent email enumeration
        return;
      }

      const { user, role } = userData;
      // Support both 'id' (UUID) and '_id' (ObjectId) for backward compatibility
      const userId = user.id || (user._id ? user._id.toString() : null);
      if (!userId) {
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

      // Generate reset link
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      const resetLink = `${frontendUrl}/reset-password?token=${token}`;

      // Send email
      const emailHtml = this.getPasswordResetEmailHtml(user.fullName || "User", resetLink);
      const emailText = this.getPasswordResetEmailText(user.fullName || "User", resetLink);

      await this.mailerService.sendMail({
        to: email,
        subject: "Password Reset Request - MedScribe Neuro",
        html: emailHtml,
        text: emailText,
      });
    } catch (err: any) {
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
        subject: "Password Change Request - MedScribe Neuro",
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
   * Get HTML email template for password reset
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
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
    <h2 style="color: #2c3e50;">Password Reset Request</h2>
    <p>Hello ${userName},</p>
    <p>We received a request to reset your password for your MedScribe Neuro account.</p>
    <p>Click the button below to reset your password:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetLink}" style="background-color: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
    </div>
    <p>Or copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #3498db;">${resetLink}</p>
    <p><strong>This link will expire in 1 hour.</strong></p>
    <p style="color: #e74c3c; font-size: 14px;"><strong>Security Notice:</strong> If you did not request this password reset, please ignore this email. Your password will remain unchanged.</p>
    <p style="margin-top: 30px; font-size: 12px; color: #7f8c8d;">This is an automated message. Please do not reply to this email.</p>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Get plain text email template for password reset
   */
  private getPasswordResetEmailText(userName: string, resetLink: string): string {
    return `
Password Reset Request - MedScribe Neuro

Hello ${userName},

We received a request to reset your password for your MedScribe Neuro account.

Click the link below to reset your password:
${resetLink}

This link will expire in 1 hour.

Security Notice: If you did not request this password reset, please ignore this email. Your password will remain unchanged.

This is an automated message. Please do not reply to this email.
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
    <p>You requested to change your password for your MedScribe Neuro account.</p>
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
Password Change Request - MedScribe Neuro

Hello ${userName},

You requested to change your password for your MedScribe Neuro account.

Click the link below to change your password:
${changeLink}

This link will expire in 1 hour.

Security Notice: If you did not request this password change, please ignore this email and contact support immediately. Your password will remain unchanged.

This is an automated message. Please do not reply to this email.
    `.trim();
  }
}

