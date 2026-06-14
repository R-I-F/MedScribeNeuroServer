import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("departments")
export class DepartmentEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 100, unique: true })
  name!: string;

  @Column({ type: "varchar", length: 100, unique: true })
  arName!: string;

  @Column({ type: "varchar", length: 10, unique: true })
  code!: string;

  @Column({ type: "boolean", default: true })
  isAcademic!: boolean;

  @Column({ type: "boolean", default: true })
  isPractical!: boolean;

  @Column({ type: "boolean", default: true })
  isActive!: boolean;

  @Column({ type: "int", default: 0 })
  nActiveUsers!: number;

  @Column({ type: "int", default: 0 })
  nTotalUsers!: number;

  @Column({ type: "int", default: 0 })
  nAllowedActiveUsers!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
