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

  @CreateDateColumn()
  createdAt!: Date;
}
