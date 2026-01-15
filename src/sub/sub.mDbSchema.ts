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

  @Column({ type: "datetime" })
  timeStamp!: Date;

  @Column({ type: "char", length: 36 })
  candDocId!: string;

  @ManyToOne(() => CandidateEntity, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "candDocId" })
  candidate!: CandidateEntity;

  @Column({ type: "char", length: 36 })
  procDocId!: string;

  @ManyToOne(() => CalSurgEntity, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "procDocId" })
  calSurg!: CalSurgEntity;

  @Column({ type: "char", length: 36 })
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

  @Column({ type: "varchar", length: 100 })
  insUsed!: string;

  @Column({ type: "varchar", length: 100 })
  consUsed!: string;

  @Column({ type: "text", nullable: true })
  consDetails?: string;

  @Column({ type: "char", length: 36 })
  mainDiagDocId!: string;

  @ManyToOne(() => MainDiagEntity, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "mainDiagDocId" })
  mainDiag!: MainDiagEntity;

  @Column({ type: "varchar", length: 255, unique: true })
  subGoogleUid!: string;

  @Column({ type: "enum", enum: ["approved", "pending", "rejected"], default: "pending" })
  subStatus!: "approved" | "pending" | "rejected";

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

  @Column({ type: "text", nullable: true })
  IntEvents?: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  spOrCran?: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  pos?: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  approach?: string;

  @Column({ type: "text", nullable: true })
  clinPres?: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  region?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
