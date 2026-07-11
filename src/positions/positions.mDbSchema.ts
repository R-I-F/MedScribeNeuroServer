import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("positions")
export class PositionEntity {
  @PrimaryColumn({ type: "char", length: 36 })
  id!: string;

  @Column({ type: "varchar", length: 50 })
  position!: string;
}
