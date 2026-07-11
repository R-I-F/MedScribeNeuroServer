import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("approaches")
export class ApproachEntity {
  @PrimaryColumn({ type: "char", length: 36 })
  id!: string;

  @Column({ type: "varchar", length: 50 })
  approach!: string;
}
