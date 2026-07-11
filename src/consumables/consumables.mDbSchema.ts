import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("consumables")
export class ConsumableEntity {
  @PrimaryColumn({ type: "char", length: 36 })
  id!: string;

  @Column({ type: "varchar", length: 100 })
  consumables!: string;
}
