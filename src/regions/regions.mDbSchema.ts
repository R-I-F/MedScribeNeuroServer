import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("regions")
export class RegionEntity {
  @PrimaryColumn({ type: "char", length: 36, charset: "utf8mb4", collation: "utf8mb4_unicode_ci" })
  id!: string;

  @Column({ type: "varchar", length: 50, charset: "utf8mb4", collation: "utf8mb4_unicode_ci" })
  region!: string;
}
