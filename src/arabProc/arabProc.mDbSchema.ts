import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { IArabProc } from "./arabProc.interface";

@Entity("arab_procs")
export class ArabProcEntity implements IArabProc {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 100, charset: "utf8mb4", collation: "utf8mb4_unicode_ci" })
  title!: string;

  @Column({ type: "varchar", length: 10, charset: "utf8mb4", collation: "utf8mb4_unicode_ci" })
  alphaCode!: string;

  @Column({ type: "varchar", length: 255, charset: "utf8mb4", collation: "utf8mb4_unicode_ci" })
  numCode!: string;

  @Column({ type: "text", charset: "utf8mb4", collation: "utf8mb4_unicode_ci" })
  description!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
