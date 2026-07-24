import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from "typeorm";

/**
 * Soft-registration session for the PUBLIC semantic-search tool
 * (docs/PUBLIC_SEMANTIC_SEARCH_TOOL_PLAN.md).
 *
 * Append-only: each accepted session-request inserts one row (with an OTP). The free-query
 * quota is enforced PER EMAIL by summing `queryCount` across all of that email's rows, so a
 * user cannot reset the quota by re-registering the same email. The `id` doubles as the
 * opaque `sessionId` bearer returned to the client.
 */
@Entity("public_search_sessions")
@Index(["email", "createdAt"]) // per-email/day request cap + quota sum
@Index(["ip", "createdAt"]) // per-ip/day request cap
@Index(["createdAt"]) // global daily OTP-email budget
@Index(["sessionExpiresAt"]) // purge verified-expired
@Index(["otpExpiresAt"]) // purge unverified-expired
export class PublicSearchSessionEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255 })
  email!: string; // lowercased

  @Column({ type: "varchar", length: 255 })
  otpHash!: string;

  @Column({ type: "boolean", default: false })
  verified!: boolean;

  @Column({ type: "timestamp", nullable: true })
  verifiedAt!: Date | null;

  @Column({ type: "int", default: 0 })
  queryCount!: number;

  @Column({ type: "int", default: 5 })
  maxQueries!: number;

  @Column({ type: "varchar", length: 64 })
  ip!: string;

  @Column({ type: "varchar", length: 512, nullable: true })
  userAgent!: string | null;

  @Column({ type: "int", default: 0 })
  attempts!: number;

  @Column({ type: "int", default: 1 })
  sendCount!: number;

  @Column({ type: "timestamp" })
  lastSentAt!: Date;

  @Column({ type: "timestamp" })
  otpExpiresAt!: Date;

  /** Set on OTP verify; the verified session is valid for reads until this time. */
  @Column({ type: "timestamp", nullable: true })
  sessionExpiresAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;
}
