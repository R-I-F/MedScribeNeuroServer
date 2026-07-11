import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable } from "typeorm";
import { DiagnosisEntity } from "../diagnosis/diagnosis.mDbSchema";
import { ProcCptEntity } from "../procCpt/procCpt.mDbSchema";

@Entity("main_diags")
export class MainDiagEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "text" })
  title!: string;

  // Department this main-diag belongs to (mirror of hub main_diags.departmentId). Nullable
  // during the multi-department rollout; the mirror stamps it from the per-dept sync.
  @Column({ type: "uuid", nullable: true })
  departmentId!: string | null;

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
