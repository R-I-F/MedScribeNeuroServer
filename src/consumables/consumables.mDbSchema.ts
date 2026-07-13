import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("consumables")
export class ConsumableEntity {
  @PrimaryColumn({ type: "char", length: 36 })
  id!: string;

  @Column({ type: "varchar", length: 100 })
  consumables!: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  arName!: string | null;

  @Column({ type: "timestamp", default: () => "now()" })
  createdAt!: Date;

  @Column({ type: "timestamp", default: () => "now()" })
  updatedAt!: Date;
}
