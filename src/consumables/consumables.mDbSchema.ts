import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("consumables")
export class ConsumableEntity {
  @PrimaryColumn({ type: "char", length: 36, charset: "utf8mb4", collation: "utf8mb4_unicode_ci" })
  id!: string;

  @Column({ type: "varchar", length: 100, charset: "utf8mb4", collation: "utf8mb4_unicode_ci" })
  consumables!: string;
}
