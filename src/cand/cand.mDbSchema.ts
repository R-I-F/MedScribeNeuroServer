import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Rank, RegDegree } from "./cand.interface";
import { UserRole } from "../types/role.types";

@Entity("candidates")
export class CandidateEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "datetime", nullable: true })
  timeStamp?: Date;

  @Column({ type: "varchar", length: 255, unique: true, charset: "utf8mb4", collation: "utf8mb4_unicode_ci" })
  email!: string;

  @Column({ type: "varchar", length: 255, charset: "utf8mb4", collation: "utf8mb4_unicode_ci" })
  password!: string;

  @Column({ type: "varchar", length: 255, charset: "utf8mb4", collation: "utf8mb4_unicode_ci" })
  fullName!: string;

  @Column({ type: "varchar", length: 50, charset: "utf8mb4", collation: "utf8mb4_unicode_ci" })
  regNum!: string;

  @Column({ type: "varchar", length: 50, charset: "utf8mb4", collation: "utf8mb4_unicode_ci" })
  phoneNum!: string;

  @Column({ type: "varchar", length: 100, charset: "utf8mb4", collation: "utf8mb4_unicode_ci" })
  nationality!: string;

  @Column({ 
    type: "enum", 
    enum: Object.values(Rank)
  })
  rank!: Rank;

  @Column({ 
    type: "enum", 
    enum: Object.values(RegDegree)
  })
  regDeg!: RegDegree;

  @Column({ type: "varchar", length: 255, nullable: true })
  google_uid?: string;

  @Column({ type: "boolean", default: false })
  approved!: boolean;

  @Column({ 
    type: "enum", 
    enum: Object.values(UserRole),
    default: UserRole.CANDIDATE
  })
  role!: UserRole;

  @Column({ type: "datetime", nullable: true, comment: "Timestamp when user accepted Terms of Service" })
  termsAcceptedAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
