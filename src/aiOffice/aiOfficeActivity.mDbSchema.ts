import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";
import { AiOfficeActivityType } from "./aiOffice.types";

/**
 * One activity an AI Office member registered (docs/AI_OFFICE_PLAN.md).
 *
 * Exactly one of `candidateId` / `supervisorId` is set (DB CHECK), because a member can be
 * either. Columns every form section shares are real columns; each section's own extra answers
 * live in `details`, validated against AI_OFFICE_ACTIVITY_DEFS.
 *
 * `activityDate` is a DATE: read it through `to_char` or toDateOnlyString, never as a JS Date,
 * or the server timezone shifts the day.
 */
@Entity("ai_office_activities")
@Index(["candidateId", "createdAt"])
@Index(["supervisorId", "createdAt"])
@Index(["activityType"])
export class AiOfficeActivityEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid", nullable: true })
  candidateId!: string | null;

  @Column({ type: "uuid", nullable: true })
  supervisorId!: string | null;

  @Column({ type: "varchar", length: 32 })
  activityType!: AiOfficeActivityType;

  @Column({ type: "text", nullable: true })
  title!: string | null;

  @Column({ type: "varchar", length: 32, nullable: true })
  status!: string | null;

  @Column({ type: "date", nullable: true })
  activityDate!: string | null;

  @Column({ type: "text", nullable: true })
  notes!: string | null;

  @Column({ type: "jsonb", default: () => "'{}'::jsonb" })
  details!: Record<string, unknown>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
