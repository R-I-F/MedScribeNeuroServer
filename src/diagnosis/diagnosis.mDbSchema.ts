import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { IDiagnosis } from "./diagnosis.interface";

@Entity("diagnoses")
export class DiagnosisEntity implements IDiagnosis {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255, charset: "utf8mb4", collation: "utf8mb4_unicode_ci" })
  icdCode!: string;

  @Column({ type: "varchar", length: 500, charset: "utf8mb4", collation: "utf8mb4_unicode_ci" })
  icdName!: string;

  @Column({ type: "json", nullable: true })
  neuroLogName?: string[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
