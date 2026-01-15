import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from "typeorm";
import { EventEntity } from "./event.mDbSchema";
import { CandidateEntity } from "../cand/cand.mDbSchema";
import { TAttendanceAddedByRole } from "./event.interface";

@Entity("event_attendance")
@Index(["eventId", "candidateId"], { unique: true }) // Ensure one attendance record per candidate per event
export class EventAttendanceEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "char", length: 36 })
  eventId!: string;

  @ManyToOne(() => EventEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "eventId" })
  event!: EventEntity;

  @Column({ type: "char", length: 36 })
  candidateId!: string;

  @ManyToOne(() => CandidateEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "candidateId" })
  candidate!: CandidateEntity;

  // addedBy: UUID of who added this attendance record
  // Can be instituteAdmin, supervisor, or candidate (self-reference)
  // No FK constraint - enforced in application logic
  @Column({ type: "char", length: 36 })
  addedBy!: string;

  @Column({ type: "enum", enum: ["instituteAdmin", "supervisor", "candidate"] })
  addedByRole!: TAttendanceAddedByRole;

  @Column({ type: "boolean", default: false })
  flagged!: boolean;

  // flaggedBy: UUID of who flagged this attendance record
  // No FK constraint - enforced in application logic
  @Column({ type: "char", length: 36, nullable: true })
  flaggedBy?: string;

  @Column({ type: "datetime", nullable: true })
  flaggedAt?: Date;

  @Column({ type: "int", default: 1 })
  points!: number;

  @CreateDateColumn()
  createdAt!: Date;
}
