import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { UserRole } from "../types/role.types";

@Entity("super_admins")
export class SuperAdminEntity {
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

  @Column({ type: "boolean", default: true })
  approved!: boolean;

  @Column({ 
    type: "enum", 
    enum: Object.values(UserRole),
    default: UserRole.SUPER_ADMIN
  })
  role!: UserRole;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
