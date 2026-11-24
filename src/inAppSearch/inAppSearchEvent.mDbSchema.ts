import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from "typeorm";

/**
 * One row per authenticated in-form semantic search (docs/IN_FORM_SEMANTIC_SEARCH_PLAN.md).
 * The per-user daily quota (default 5/UTC-day) is enforced by counting this user's rows since
 * the UTC-day boundary. Doubles as a lightweight usage audit.
 */
@Entity("in_app_search_events")
@Index(["userId", "createdAt"]) // per-user/day quota count
export class InAppSearchEventEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  userId!: string;

  /** 'candidate' | 'supervisor' | 'instituteAdmin' | 'superAdmin' */
  @Column({ type: "varchar", length: 32 })
  userRole!: string;

  @Column({ type: "uuid", nullable: true })
  departmentId!: string | null;

  /** 'procedure' | 'diagnosis' */
  @Column({ type: "varchar", length: 16 })
  type!: string;

  /** 'assist' (AI assist above Main Diagnosis, 5/day) | 'missing' ("Not listed?" search, 20/day). */
  @Column({ type: "varchar", length: 16, default: "assist" })
  purpose!: string;

  /** Exactly what the user typed (NULL on rows recorded before 2026-11). */
  @Column({ type: "text", nullable: true })
  query!: string | null;

  /** The category the user was in ('missing' searches). */
  @Column({ type: "uuid", nullable: true })
  mainDiagId!: string | null;

  /** What came back, in order: [{kind, code, title, mainDiagTitle, inCurrentMainDiag, similarity}]. */
  @Column({ type: "jsonb", nullable: true })
  results!: unknown[] | null;

  /** 'picked' | 'none' | NULL (left without choosing). */
  @Column({ type: "varchar", length: 16, nullable: true })
  outcome!: string | null;

  @Column({ type: "varchar", length: 32, nullable: true })
  pickedCode!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
