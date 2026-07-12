import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Rank, RegDegree } from "./cand.interface";
import { UserRole } from "../types/role.types";

@Entity("candidates")
export class CandidateEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "timestamp", nullable: true })
  timeStamp?: Date;

  @Column({ type: "varchar", length: 255, unique: true })
  email!: string;

  @Column({ type: "varchar", length: 255 })
  password!: string;

  @Column({ type: "varchar", length: 255 })
  fullName!: string;

  @Column({ type: "varchar", length: 50 })
  regNum!: string;

  @Column({ type: "varchar", length: 50, unique: true })
  phoneNum!: string;

  @Column({ type: "varchar", length: 100 })
  nationality!: string;

  @Column({ 
    type: "enum", 
    enum: Object.values(Rank)
  })
  rank!: Rank;

  @Column({ 
    type: "enum", 
    enum: Object.values(RegDegree),
    nullable: true,
  })
  regDeg!: RegDegree | null;

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

  @Column({ type: "timestamp", nullable: true, comment: "Timestamp when user accepted Terms of Service" })
  termsAcceptedAt?: Date;

  // Department this user belongs to (FK → departments). NOT NULL: every candidate must belong
  // to a department (enforced after the prod backfill stamped all rows → NS).
  @Column({ type: "uuid" })
  departmentId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
