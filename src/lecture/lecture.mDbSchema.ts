import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { TLectureLevel } from "./lecture.interface";

/**
 * Lectures mirror (KA spoke) — conforms to the hub's scaled lectures framework
 * (LibelusRefApi migration 188): `departments → lecture_topics → lectures`.
 * Hub-owned reference data, READ-ONLY in the spoke: PK is the hub UUID (preserved on sync),
 * and there is no local CRUD. The legacy `google_uid`/`mainTopic`/`lectureTitle` columns were
 * dropped (migration 1783782610090); `mainTopic` is now derived from the topic via `topicId`.
 */
@Entity("lectures")
export class LectureEntity {
  @PrimaryColumn({ type: "uuid" })
  id!: string;

  @Column({ type: "text" })
  title!: string;

  @Column({ type: "text", nullable: true })
  arTitle!: string | null;

  // A lecture belongs to a curriculum topic (hub `lecture_topics`); the topic carries the department.
  @Column({ type: "uuid" })
  topicId!: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  lectureNumber!: string | null;

  @Column({ type: "int", nullable: true })
  sortOrder!: number | null;

  @Column({ type: "enum", enum: ["msc", "md"], nullable: true })
  level!: TLectureLevel | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
