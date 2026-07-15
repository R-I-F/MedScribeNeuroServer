import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { HospitalEntity } from "../hospital/hospital.mDbSchema";
import { ProcCptEntity } from "../procCpt/procCpt.mDbSchema";
import { ClerkProcEntity } from "../clerkProc/clerkProc.mDbSchema";

@Entity("cal_surgs")
export class CalSurgEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "timestamp" })
  timeStamp!: Date;

  // As-typed original (audit + display default); the bilingual pair below is pipeline-filled.
  @Column({ type: "varchar", length: 255 })
  patientName!: string;

  @Column({ type: "text", nullable: true })
  patientNameAr?: string | null;

  @Column({ type: "text", nullable: true })
  patientNameEn?: string | null;

  @Column({ type: "date" })
  patientDob!: Date;

  @Column({ type: "enum", enum: ["male", "female"] })
  gender!: "male" | "female";

  @Column({ type: "uuid" })
  hospitalId!: string;

  @ManyToOne(() => HospitalEntity, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "hospitalId" })
  hospital!: HospitalEntity;

  // Department this surgery belongs to (FK → departments). Dept-scoped; nullable during rollout
  // (an active bulk external-import path would break under NOT NULL). Existing rows backfilled NS.
  @Column({ type: "uuid", nullable: true })
  departmentId?: string;

  // Procedure link (FK → proc_cpts, hub-mirrored with EN + AR titles). Nullable: many surgeries
  // have no procedure recorded. Denormalized copy stamped from the clerk_procs row at creation
  // so downstream consumers (dashboard/subs/PDF/analytics) read one stable relation.
  @Column({ type: "uuid", nullable: true })
  procCptId?: string;

  // What the clerk actually entered (learning pipeline). NULL = surgery logged no procedure.
  @Column({ type: "uuid", nullable: true })
  clerkProcId?: string | null;

  @ManyToOne(() => ClerkProcEntity, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "clerkProcId" })
  clerkProc?: ClerkProcEntity;

  @ManyToOne(() => ProcCptEntity, { onDelete: "RESTRICT", nullable: true })
  @JoinColumn({ name: "procCptId" })
  procCpt?: ProcCptEntity;

  @Column({ type: "date" })
  procDate!: Date;

  @Column({ type: "varchar", length: 255, nullable: true })
  google_uid?: string;

  @Column({ type: "text", nullable: true })
  formLink?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
