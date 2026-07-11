import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("equipment")
export class EquipmentEntity {
  @PrimaryColumn({ type: "char", length: 36 })
  id!: string;

  @Column({ type: "varchar", length: 100 })
  equipment!: string;
}
