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

  @Column({ type: "varchar", length: 255 })
  lectureTitle!: string;

  // Nullable for hub-mirrored lectures: the reference lectures carry no google_uid,
  // and level is only set where an authoritative MSc/MD source exists.
  @Column({ type: "varchar", length: 255, unique: true, nullable: true })
  google_uid!: string | null;

  @Column({ type: "varchar", length: 255 })
  mainTopic!: string;

  @Column({ type: "enum", enum: ["msc", "md"], nullable: true })
  level!: TLectureLevel | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
