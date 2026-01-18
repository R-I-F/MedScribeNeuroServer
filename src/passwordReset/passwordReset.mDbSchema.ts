import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";
import { TUserRole } from "../types/role.types";

@Entity("password_reset_tokens")
@Index(["token"], { unique: true })
@Index(["userId"])
@Index(["expiresAt"])
export class PasswordResetTokenEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "char", length: 36 })
  userId!: string; // UUID reference to user (candidate, supervisor, superAdmin, or instituteAdmin)

  @Column({ 
    type: "enum", 
    enum: ["candidate", "supervisor", "superAdmin", "instituteAdmin"] 
  })
  userRole!: TUserRole;

  @Column({ type: "varchar", length: 255, unique: true })
  token!: string;

  @Column({ type: "datetime" })
  expiresAt!: Date;

  @Column({ type: "boolean", default: false })
  used!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
