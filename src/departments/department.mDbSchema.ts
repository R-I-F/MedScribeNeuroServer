import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

/**
 * Departments mirror (KA spoke). Replica of the hub's `departments`, keeping the hub UUID
 * as the local PK so it can be the FK target for department-scoped reference rows
 * (main_diags.departmentId, lecture_topics.departmentId, department_diagnoses) and for the
 * per-user departmentId. Synced from the hub's `GET /v1/departments`.
 */
@Entity("departments")
export class DepartmentEntity {
  @PrimaryColumn({ type: "uuid" })
  id!: string;

  @Column({ type: "varchar", length: 50 })
  code!: string;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  arName!: string | null;

  @Column({ type: "boolean", default: true })
  isAcademic!: boolean;

  @Column({ type: "boolean", default: true })
  isPractical!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
