import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("regions")
export class RegionEntity {
  @PrimaryColumn({ type: "char", length: 36 })
  id!: string;

  @Column({ type: "varchar", length: 50 })
  region!: string;
}
