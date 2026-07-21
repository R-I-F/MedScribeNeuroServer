import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

export type TPendingSignupRole = "candidate" | "supervisor";

/**
 * Staging row for an OTP-verified signup (docs/OTP_SIGNUP_VERIFICATION_PLAN.md).
 * The REAL candidates/supervisors row is created ONLY when the emailed 6-digit
 * code is verified; expired/rejected rows are deleted and the user re-registers.
 * `id` doubles as the opaque `signupId` handle the client uses for verify/resend.
 */
@Entity("pending_signups")
@Index(["email", "role"])
@Index(["expiresAt"])
export class PendingSignupEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "enum", enum: ["candidate", "supervisor"] })
  role!: TPendingSignupRole;

  @Column({ type: "varchar", length: 255 })
  email!: string; // lowercased; one ACTIVE pending per (email, role), app-enforced

  /** Full validated registration payload with the password ALREADY bcrypt-hashed. */
  @Column({ type: "jsonb" })
  payload!: Record<string, unknown>;

  /** bcrypt hash of the current 6-digit code (replaced on resend). */
  @Column({ type: "varchar", length: 255 })
  otpHash!: string;

  @Column({ type: "int", default: 0 })
  attempts!: number; // rejected + deleted at 5 wrong entries

  @Column({ type: "int", default: 1 })
  sendCount!: number; // max 3 sends (initial + 2 resends)

  @Column({ type: "timestamp" })
  lastSentAt!: Date; // 60s resend cooldown

  @Column({ type: "timestamp" })
  expiresAt!: Date; // createdAt + 15 min; resend does NOT extend

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
