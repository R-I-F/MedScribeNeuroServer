import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Unique } from "typeorm";
import { DepartmentEntity } from "../departments/department.mDbSchema";
import { ClerkEntity } from "../clerk/clerk.mDbSchema";
import { ProcCptEntity } from "../procCpt/procCpt.mDbSchema";
import { MainDiagEntity } from "../mainDiag/mainDiag.mDbSchema";

/**
 * A clerk's raw procedure phrase, learned once per (department, title): on first sight it is
 * semantically resolved against proc_cpts via the hub's /v1/procedure-search — the best match
 * (procCptId), its probable main diagnosis (mainDiagId) and the cosine score are stored here.
 * Every later use of the same phrase reuses this row (no re-search, no token spend).
 * cal_surgs.clerkProcId points at what the clerk actually entered.
 */
@Entity("clerk_procs")
@Unique("UQ_clerk_procs_dept_title", ["departmentId", "title"])
export class ClerkProcEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  // Clerk's input, normalized (trimmed, single-spaced), original script/casing kept.
  @Column({ type: "text" })
  title!: string;

  @Column({ type: "uuid" })
  departmentId!: string;

  @ManyToOne(() => DepartmentEntity, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "departmentId" })
  department!: DepartmentEntity;

  // Who taught the system this phrase. NULL = legacy import / non-clerk creator.
  @Column({ type: "uuid", nullable: true })
  clerkId?: string | null;

  @ManyToOne(() => ClerkEntity, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "clerkId" })
  clerk?: ClerkEntity;

  // Best semantic match; NULL until resolved (or resolution failed — retryable).
  @Column({ type: "uuid", nullable: true })
  procCptId?: string | null;

  @ManyToOne(() => ProcCptEntity, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "procCptId" })
  procCpt?: ProcCptEntity;

  // Probable main diagnosis the phrase belongs to (derived from the match).
  @Column({ type: "uuid", nullable: true })
  mainDiagId?: string | null;

  @ManyToOne(() => MainDiagEntity, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "mainDiagId" })
  mainDiag?: MainDiagEntity;

  // Cosine similarity of the best hit (audit / threshold tuning).
  @Column({ type: "real", nullable: true })
  matchScore?: number | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
