import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { SupervisorPosition } from "../types/supervisorPosition.types";
import { UserRole } from "../types/role.types";

@Entity("supervisors")
export class SupervisorEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255, unique: true, charset: "utf8mb4", collation: "utf8mb4_unicode_ci" })
  email!: string;

  @Column({ type: "varchar", length: 255, charset: "utf8mb4", collation: "utf8mb4_unicode_ci" })
  password!: string;

  @Column({ type: "varchar", length: 255, charset: "utf8mb4", collation: "utf8mb4_unicode_ci" })
  fullName!: string;

  @Column({ type: "varchar", length: 50, charset: "utf8mb4", collation: "utf8mb4_unicode_ci" })
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

  @Column({ 
    type: "enum", 
    enum: Object.values(SupervisorPosition),
    default: SupervisorPosition.UNKNOWN,
    nullable: true
  })
  position?: SupervisorPosition;

  @Column({ type: "datetime", nullable: true, comment: "Timestamp when user accepted Terms of Service" })
  termsAcceptedAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
