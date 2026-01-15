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

  @Column({ type: "varchar", length: 255, charset: "utf8mb4", collation: "utf8mb4_unicode_ci" })
  lectureTitle!: string;

  @Column({ type: "varchar", length: 255, unique: true })
  google_uid!: string;

  @Column({ type: "varchar", length: 255, charset: "utf8mb4", collation: "utf8mb4_unicode_ci" })
  mainTopic!: string;

  @Column({ type: "enum", enum: ["msc", "md"] })
  level!: TLectureLevel;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
