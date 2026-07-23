import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from "typeorm";

/**
 * Authentication-event log (docs/ACTIVE_USERS_ANALYTICS_PLAN.md).
 *
 * Logins are recorded NOWHERE else in the schema, so this table is their single
 * source of truth. It is deliberately NOT a copy of any operational table:
 * submissions/attendance/clinical/calSurg/events stay authoritative for their own
 * facts and are read live by the `activity_read_model` view. Append-only: one row
 * per successful login. Feeds the `login` signal of the Active-Users read model and
 * the rolling quarterly active-users signup cap.
 */
@Entity("login_events")
@Index(["loggedInAt"]) // period range scans
@Index(["departmentId", "loggedInAt"]) // dept-scoped time queries
@Index(["userId", "loggedInAt"]) // distinct-user counting
@Index(["userRole", "loggedInAt"]) // role breakdown
export class LoginEventEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  userId!: string;

  /** 'candidate' | 'supervisor' | 'clerk' | 'instituteAdmin' | 'superAdmin' */
  @Column({ type: "varchar", length: 32 })
  userRole!: string;

  /** From the user's dept claim/row at login time; NULL if the user has no department. */
  @Column({ type: "uuid", nullable: true })
  departmentId!: string | null;

  /** Client IP at login (trust proxy 1 → real client). For tracing suspicious logins. */
  @Column({ type: "varchar", length: 64, nullable: true })
  ip!: string | null;

  /** Client user-agent at login (device/browser fingerprint). */
  @Column({ type: "varchar", length: 512, nullable: true })
  userAgent!: string | null;

  @Column({ type: "timestamp", default: () => "now()" })
  loggedInAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;
}
