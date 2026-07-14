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

  @Column({ type: "varchar", length: 255 })
  confTitle!: string;

  @Column({ type: "varchar", length: 255, unique: true })
  google_uid!: string;

  @Column({ type: "uuid" })
  presenterId!: string;

  @ManyToOne(() => SupervisorEntity, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "presenterId" })
  presenter!: SupervisorEntity;

  @Column({ type: "date" })
  date!: Date;

  // Department this conference belongs to (FK → departments). Dept-scoped; nullable during rollout (backfill → NS).
  @Column({ type: "uuid", nullable: true })
  departmentId?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
