import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { HospitalEntity } from "../hospital/hospital.mDbSchema";
import { ArabProcEntity } from "../arabProc/arabProc.mDbSchema";

@Entity("cal_surgs")
export class CalSurgEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "timestamp" })
  timeStamp!: Date;

  @Column({ type: "varchar", length: 255 })
  patientName!: string;

  @Column({ type: "date" })
  patientDob!: Date;

  @Column({ type: "enum", enum: ["male", "female"] })
  gender!: "male" | "female";

  @Column({ type: "uuid" })
  hospitalId!: string;

  @ManyToOne(() => HospitalEntity, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "hospitalId" })
  hospital!: HospitalEntity;

  @Column({ type: "uuid", nullable: true })
  arabProcId?: string;

  @ManyToOne(() => ArabProcEntity, { onDelete: "RESTRICT", nullable: true })
  @JoinColumn({ name: "arabProcId" })
  arabProc?: ArabProcEntity;

  // Department this surgery belongs to (FK → departments). Dept-scoped; nullable during rollout
  // (an active bulk external-import path would break under NOT NULL). Existing rows backfilled NS.
  @Column({ type: "uuid", nullable: true })
  departmentId?: string;

  // Modern procedure link (FK → proc_cpts). Nullable: many surgeries have no procedure, and
  // existing rows are backfilled from arab_procs via the reviewed semantic mapping. Transitional
  // alongside the legacy `arabProcId` until arab_procs is retired.
  @Column({ type: "uuid", nullable: true })
  procCptId?: string;

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
