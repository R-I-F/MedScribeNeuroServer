import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { IDiagnosis } from "./diagnosis.interface";

@Entity("diagnoses")
export class DiagnosisEntity implements IDiagnosis {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255 })
  icdCode!: string;

  @Column({ type: "text" })
  icdName!: string;

  @Column({ type: "text", nullable: true })
  icdArName!: string | null;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({ type: "text", nullable: true })
  arDescription!: string | null;

  @Column({ type: "json", nullable: true })
  neuroLogName?: string[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
