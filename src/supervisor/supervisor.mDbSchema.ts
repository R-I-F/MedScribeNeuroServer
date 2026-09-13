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

  // Department this user belongs to (FK → departments). Required for everyone EXCEPT an AI Office
  // member who signed up from a department we do not mirror: then it is NULL and the typed name is
  // in `departmentOther` (DB CHECK "CHK_supervisors_dept_or_ai_office", docs/AI_OFFICE_PLAN.md).
  @Column({ type: "uuid", nullable: true })
  departmentId!: string | null;

  // AI Office member role, granted by the super-admin (or pre-set by the AI Office signup).
  @Column({ type: "boolean", default: false })
  aiOfficeMember!: boolean;

  // University department typed at the AI Office signup when it is not in `departments`.
  @Column({ type: "varchar", length: 160, nullable: true })
  departmentOther!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
