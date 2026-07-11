import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { IProcCpt } from "./procCpt.interface";

@Entity("proc_cpts")
export class ProcCptEntity implements IProcCpt {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 100 })
  title!: string;

  @Column({ type: "varchar", length: 10 })
  alphaCode!: string;

  @Column({ type: "varchar", length: 10 })
  numCode!: string;

  @Column({ type: "varchar", length: 500 })
  description!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
