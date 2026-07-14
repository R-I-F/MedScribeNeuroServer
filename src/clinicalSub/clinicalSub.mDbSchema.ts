import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { CandidateEntity } from "../cand/cand.mDbSchema";
import { SupervisorEntity } from "../supervisor/supervisor.mDbSchema";

export const ClinicalActivityType = {
  CLINICAL_ROUND: "clinical round",
  OUTPATIENT_CLINIC: "outpatient clinic",
  WORKSHOP: "workshop",
  OTHER: "other",
} as const;
export type TClinicalActivityType = (typeof ClinicalActivityType)[keyof typeof ClinicalActivityType];

export const ClinicalSubStatus = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const;
export type TClinicalSubStatus = (typeof ClinicalSubStatus)[keyof typeof ClinicalSubStatus];

@Entity("clinical_sub")
export class ClinicalSubEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  candDocId!: string;

  @ManyToOne(() => CandidateEntity, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "candDocId" })
  candidate!: CandidateEntity;

  @Column({ type: "uuid" })
  supervisorDocId!: string;

  @ManyToOne(() => SupervisorEntity, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "supervisorDocId" })
  supervisor!: SupervisorEntity;

  @Column({ type: "date", name: "dateCA" })
  dateCA!: Date;

  @Column({
    type: "enum",
    enum: Object.values(ClinicalActivityType),
    name: "typeCA",
  })
  typeCA!: TClinicalActivityType;

  @Column({ type: "varchar", length: 2000, default: "" })
  description!: string;

  @Column({
    type: "enum",
    enum: Object.values(ClinicalSubStatus),
    default: ClinicalSubStatus.PENDING,
  })
  subStatus!: TClinicalSubStatus;

  @Column({ type: "text", nullable: true })
  review?: string | null;

  @Column({ type: "timestamp", nullable: true })
  reviewedAt?: Date | null;

  // Department this clinical submission belongs to (FK → departments). Dept-scoped; nullable during rollout (backfill from candidate → NS).
  @Column({ type: "uuid", nullable: true })
  departmentId?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
