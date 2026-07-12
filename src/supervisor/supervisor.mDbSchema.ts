import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { SupervisorPosition } from "../types/supervisorPosition.types";
import { UserRole } from "../types/role.types";

@Entity("supervisors")
export class SupervisorEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255, unique: true })
  email!: string;

  @Column({ type: "varchar", length: 255 })
  password!: string;

  @Column({ type: "varchar", length: 255 })
  fullName!: string;

  @Column({ type: "varchar", length: 50, unique: true })
  phoneNum!: string;

  @Column({ type: "boolean", default: false })
  approved!: boolean;

  @Column({ 
    type: "enum", 
    enum: Object.values(UserRole),
    default: UserRole.SUPERVISOR
  })
  role!: UserRole;

  @Column({ type: "boolean", default: true, nullable: true })
  canValidate?: boolean;

  @Column({ type: "boolean", default: false })
  canValClin!: boolean;

  @Column({ 
    type: "enum", 
    enum: Object.values(SupervisorPosition),
    default: SupervisorPosition.UNKNOWN,
    nullable: true
  })
  position?: SupervisorPosition;

  @Column({ type: "timestamp", nullable: true, comment: "Timestamp when user accepted Terms of Service" })
  termsAcceptedAt?: Date;

  // Department this user belongs to (FK → departments). NOT NULL: every supervisor must belong
  // to a department (enforced after the prod backfill stamped all rows → NS).
  @Column({ type: "uuid" })
  departmentId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
