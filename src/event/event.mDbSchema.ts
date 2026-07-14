import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from "typeorm";
import { LectureEntity } from "../lecture/lecture.mDbSchema";
import { JournalEntity } from "../journal/journal.mDbSchema";
import { ConfEntity } from "../conf/conf.mDbSchema";
import { EventAttendanceEntity } from "./eventAttendance.mDbSchema";
import { TEventType, TEventStatus } from "./event.interface";

@Entity("events")
export class EventEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "enum", enum: ["lecture", "journal", "conf"] })
  type!: TEventType;

  @Column({ type: "uuid", nullable: true })
  lectureId?: string;

  @ManyToOne(() => LectureEntity, { onDelete: "RESTRICT", nullable: true })
  @JoinColumn({ name: "lectureId" })
  lecture?: LectureEntity;

  @Column({ type: "uuid", nullable: true })
  journalId?: string;

  @ManyToOne(() => JournalEntity, { onDelete: "RESTRICT", nullable: true })
  @JoinColumn({ name: "journalId" })
  journal?: JournalEntity;

  @Column({ type: "uuid", nullable: true })
  confId?: string;

  @ManyToOne(() => ConfEntity, { onDelete: "RESTRICT", nullable: true })
  @JoinColumn({ name: "confId" })
  conf?: ConfEntity;

  @Column({ type: "timestamp" })
  dateTime!: Date;

  @Column({ type: "varchar", length: 255 })
  location!: string;

  // Presenter: Polymorphic relationship
  // - For "journal" type: points to candidates table
  // - For "lecture" and "conf" types: points to supervisors table
  // No FK constraint - enforced in application logic
  @Column({ type: "char", length: 36 })
  presenterId!: string;

  @Column({ type: "enum", enum: ["booked", "held", "canceled"], default: "booked" })
  status!: TEventStatus;

  @OneToMany(() => EventAttendanceEntity, (attendance) => attendance.event)
  attendance!: EventAttendanceEntity[];

  // Department this event belongs to (FK → departments). Dept-scoped; nullable during rollout (backfill → NS).
  @Column({ type: "uuid", nullable: true })
  departmentId?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
