import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { IProcCpt } from "./procCpt.interface";

@Entity("proc_cpts")
export class ProcCptEntity implements IProcCpt {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "text" })
  title!: string;

  @Column({ type: "varchar", length: 20 })
  alphaCode!: string;

  @Column({ type: "varchar", length: 20 })
  numCode!: string;

  @Column({ type: "text" })
  description!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
