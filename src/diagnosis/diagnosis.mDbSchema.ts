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

  @Column({ type: "json", nullable: true })
  neuroLogName?: string[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
