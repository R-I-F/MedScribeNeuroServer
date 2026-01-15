import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { IProcCpt } from "./procCpt.interface";

@Entity("proc_cpts")
export class ProcCptEntity implements IProcCpt {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 100, charset: "utf8mb4", collation: "utf8mb4_unicode_ci" })
  title!: string;

  @Column({ type: "varchar", length: 10, charset: "utf8mb4", collation: "utf8mb4_unicode_ci" })
  alphaCode!: string;

  @Column({ type: "varchar", length: 10, charset: "utf8mb4", collation: "utf8mb4_unicode_ci" })
  numCode!: string;

  @Column({ type: "varchar", length: 500, charset: "utf8mb4", collation: "utf8mb4_unicode_ci" })
  description!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
