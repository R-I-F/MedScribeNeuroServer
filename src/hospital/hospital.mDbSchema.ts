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

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
