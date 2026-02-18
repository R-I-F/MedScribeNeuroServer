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

  @Column({ type: "char", length: 36, charset: "utf8mb4", collation: "utf8mb4_unicode_ci" })
  candDocId!: string;

  @ManyToOne(() => CandidateEntity, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "candDocId" })
  candidate!: CandidateEntity;

  @Column({ type: "char", length: 36, charset: "utf8mb4", collation: "utf8mb4_unicode_ci" })
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

  @Column({ type: "datetime", nullable: true })
  reviewedAt?: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
