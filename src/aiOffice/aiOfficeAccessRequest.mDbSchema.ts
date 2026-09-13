import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from "typeorm";
import { AiOfficeMemberRole } from "./aiOffice.types";

/**
 * An AI Office signup attempt whose email already belongs to a candidate or supervisor
 * (docs/AI_OFFICE_PLAN.md). Such a person cannot create a second account; instead the admins
 * are emailed so the super-admin can grant the AI Office role to the existing account.
 *
 * Kept as an audit trail (shown in the super-admin console) and used to rate-limit the
 * notification: one email per address per 24 h, plus a daily budget. `emailedAt` NULL means
 * the email was skipped by those limits or failed; the row itself is never lost.
 */
@Entity("ai_office_access_requests")
@Index(["email", "createdAt"])
@Index(["emailedAt"])
export class AiOfficeAccessRequestEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255 })
  email!: string; // lowercased

  @Column({ type: "varchar", length: 16 })
  requestedRole!: AiOfficeMemberRole;

  @Column({ type: "varchar", length: 16 })
  existingRole!: AiOfficeMemberRole;

  @Column({ type: "uuid" })
  existingUserId!: string;

  @Column({ type: "varchar", length: 120 })
  fullName!: string;

  /** The department they picked (mirrored name) or typed. */
  @Column({ type: "varchar", length: 160, nullable: true })
  departmentLabel!: string | null;

  @Column({ type: "varchar", length: 64 })
  ip!: string;

  @Column({ type: "varchar", length: 512, nullable: true })
  userAgent!: string | null;

  @Column({ type: "timestamp", nullable: true })
  emailedAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;
}
