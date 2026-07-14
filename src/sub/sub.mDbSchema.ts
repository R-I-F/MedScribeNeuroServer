import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, ManyToMany, JoinTable } from "typeorm";
import { CandidateEntity } from "../cand/cand.mDbSchema";
import { CalSurgEntity } from "../calSurg/calSurg.mDbSchema";
import { SupervisorEntity } from "../supervisor/supervisor.mDbSchema";
import { MainDiagEntity } from "../mainDiag/mainDiag.mDbSchema";
import { ProcCptEntity } from "../procCpt/procCpt.mDbSchema";
import { DiagnosisEntity } from "../diagnosis/diagnosis.mDbSchema";

@Entity("submissions")
export class SubmissionEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "timestamp" })
  timeStamp!: Date;

  @Column({ type: "enum", enum: ["candidate", "supervisor"], default: "candidate" })
  submissionType!: "candidate" | "supervisor";

  @Column({ type: "uuid", nullable: true })
  candDocId!: string | null;

  @ManyToOne(() => CandidateEntity, { onDelete: "RESTRICT", nullable: true })
  @JoinColumn({ name: "candDocId" })
  candidate!: CandidateEntity | null;

  @Column({ type: "uuid" })
  procDocId!: string;

  @ManyToOne(() => CalSurgEntity, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "procDocId" })
  calSurg!: CalSurgEntity;

  @Column({ type: "uuid" })
  supervisorDocId!: string;

  @ManyToOne(() => SupervisorEntity, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "supervisorDocId" })
  supervisor!: SupervisorEntity;

  @Column({ type: "varchar", length: 100 })
  roleInSurg!: string;

  @Column({ type: "text", nullable: true })
  assRoleDesc?: string;

  @Column({ type: "varchar", length: 100 })
  otherSurgRank!: string;

  @Column({ type: "varchar", length: 255 })
  otherSurgName!: string;

  @Column({ type: "boolean" })
  isItRevSurg!: boolean;

  @Column({ type: "text", nullable: true })
  preOpClinCond?: string;

  @Column({ type: "varchar", length: 1000 })
  insUsed!: string;

  @Column({ type: "varchar", length: 1000 })
  consUsed!: string;

  @Column({ type: "text", nullable: true })
  consDetails?: string;

  @Column({ type: "uuid" })
  mainDiagDocId!: string;

  @ManyToOne(() => MainDiagEntity, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "mainDiagDocId" })
  mainDiag!: MainDiagEntity;

  @Column({ type: "varchar", length: 255, unique: true, nullable: true })
  subGoogleUid!: string | null;

  @Column({ type: "enum", enum: ["approved", "pending", "rejected"], default: "pending" })
  subStatus!: "approved" | "pending" | "rejected";

  @Column({ type: "text", nullable: true })
  review?: string | null;

  @Column({ type: "timestamp", nullable: true })
  reviewedAt?: Date | null;

  @Column({ type: "char", length: 36, nullable: true })
  reviewedBy?: string | null;

  @ManyToMany(() => ProcCptEntity)
  @JoinTable({
    name: "submission_proc_cpts",
    joinColumn: { name: "submissionId", referencedColumnName: "id" },
    inverseJoinColumn: { name: "procCptId", referencedColumnName: "id" },
  })
  procCpts!: ProcCptEntity[];

  @ManyToMany(() => DiagnosisEntity)
  @JoinTable({
    name: "submission_icds",
    joinColumn: { name: "submissionId", referencedColumnName: "id" },
    inverseJoinColumn: { name: "icdId", referencedColumnName: "id" },
  })
  icds!: DiagnosisEntity[];

  @Column({ type: "json" })
  diagnosisName!: string[];

  @Column({ type: "json" })
  procedureName!: string[];

  @Column({ type: "text", nullable: true })
  surgNotes?: string;

  // The 6 legacy additional-question answer columns (spOrCran/pos/approach/region/clinPres/
  // IntEvents) were removed — answers now live in `submission_question_answers` and are
  // resolved onto the doc at read time (SubService.attachAnswerFields).

  // Department this submission belongs to (FK → departments). Dept-scoped; nullable during rollout.
  // Backfilled from the candidate (or the supervisor for supervisor-type subs).
  @Column({ type: "uuid", nullable: true })
  departmentId?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
