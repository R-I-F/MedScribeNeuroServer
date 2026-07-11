import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { TLectureLevel } from "./lecture.interface";

@Entity("lectures")
export class LectureEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "text" })
  lectureTitle!: string;

  // Nullable for hub-mirrored lectures: the reference lectures carry no google_uid,
  // and level is only set where an authoritative MSc/MD source exists.
  @Column({ type: "varchar", length: 255, unique: true, nullable: true })
  google_uid!: string | null;

  @Column({ type: "text" })
  mainTopic!: string;

  // Mirror of hub lectures→lecture_topics: a lecture belongs to a curriculum topic, and the
  // topic carries the department. topicId is nullable during rollout. `mainTopic` is kept
  // (populated from the topic title on sync) so the legacy read shape is unchanged.
  @Column({ type: "uuid", nullable: true })
  topicId!: string | null;

  @Column({ type: "varchar", length: 50, nullable: true })
  lectureNumber!: string | null;

  @Column({ type: "int", nullable: true })
  sortOrder!: number | null;

  @Column({ type: "text", nullable: true })
  arTitle!: string | null;

  @Column({ type: "enum", enum: ["msc", "md"], nullable: true })
  level!: TLectureLevel | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
