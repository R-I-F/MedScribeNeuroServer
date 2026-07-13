import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { IArabProc } from "./arabProc.interface";

@Entity("arab_procs")
export class ArabProcEntity implements IArabProc {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 100 })
  title!: string;

  @Column({ type: "varchar", length: 10 })
  alphaCode!: string;

  @Column({ type: "varchar", length: 255 })
  numCode!: string;

  @Column({ type: "text" })
  description!: string;

  // Department this procedure belongs to (FK → departments). Dept-scoped by default; NULLABLE so
  // the bulk external-import path and cross-department procedures aren't blocked. Same title may
  // repeat across departments (no name-unique).
  @Column({ type: "uuid", nullable: true })
  departmentId!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
