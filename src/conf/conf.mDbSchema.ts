import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { SupervisorEntity } from "../supervisor/supervisor.mDbSchema";

@Entity("confs")
export class ConfEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255, charset: "utf8mb4", collation: "utf8mb4_unicode_ci" })
  confTitle!: string;

  @Column({ type: "varchar", length: 255, unique: true })
  google_uid!: string;

  @Column({ type: "char", length: 36 })
  presenterId!: string;

  @ManyToOne(() => SupervisorEntity, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "presenterId" })
  presenter!: SupervisorEntity;

  @Column({ type: "date" })
  date!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
