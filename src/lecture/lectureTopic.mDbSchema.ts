import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

/**
 * Lecture topics mirror (KA spoke). Replicates the hub's `lecture_topics`: a curriculum topic
 * belongs to one department (`departmentId`), and lectures point to a topic (`lectures.topicId`).
 * Keeps the hub UUID as local PK. Synced from `GET /v1/refLectures/department/:deptCode`.
 */
@Entity("lecture_topics")
export class LectureTopicEntity {
  @PrimaryColumn({ type: "uuid" })
  id!: string;

  @Column({ type: "text" })
  title!: string;

  @Column({ type: "text", nullable: true })
  arTitle!: string | null;

  @Column({ type: "int", default: 0 })
  sortOrder!: number;

  @Column({ type: "uuid" })
  departmentId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
