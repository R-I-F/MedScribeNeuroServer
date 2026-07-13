import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { IHospital } from "./hospital.interface";

@Entity("hospitals")
export class HospitalEntity implements IHospital {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 100 })
  arabName!: string;

  @Column({ type: "varchar", length: 100 })
  engName!: string;

  @Column({ type: "json", nullable: true })
  location?: {
    long: number;
    lat: number;
  };

  // Department this hospital/unit belongs to (FK → departments). NOT NULL: every hospital is
  // scoped to exactly one department; the same name may repeat across departments.
  @Column({ type: "uuid" })
  departmentId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
