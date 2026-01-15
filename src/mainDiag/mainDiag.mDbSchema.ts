import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable } from "typeorm";
import { DiagnosisEntity } from "../diagnosis/diagnosis.mDbSchema";
import { ProcCptEntity } from "../procCpt/procCpt.mDbSchema";

@Entity("main_diags")
export class MainDiagEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 200, charset: "utf8mb4", collation: "utf8mb4_unicode_ci" })
  title!: string;

  @ManyToMany(() => DiagnosisEntity)
  @JoinTable({
    name: "main_diag_diagnoses",
    joinColumn: { name: "mainDiagId", referencedColumnName: "id" },
    inverseJoinColumn: { name: "diagnosisId", referencedColumnName: "id" },
  })
  diagnosis!: DiagnosisEntity[];

  @ManyToMany(() => ProcCptEntity)
  @JoinTable({
    name: "main_diag_procs",
    joinColumn: { name: "mainDiagId", referencedColumnName: "id" },
    inverseJoinColumn: { name: "procCptId", referencedColumnName: "id" },
  })
  procs!: ProcCptEntity[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
