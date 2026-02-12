import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("additional_questions")
export class AdditionalQuestionEntity {
  @PrimaryColumn({ type: "char", length: 36, charset: "utf8mb4", collation: "utf8mb4_unicode_ci" })
  mainDiagDocId!: string;

  @Column({ type: "tinyint", width: 1, default: 0 })
  spOrCran!: number;

  @Column({ type: "tinyint", width: 1, default: 0 })
  pos!: number;

  @Column({ type: "tinyint", width: 1, default: 0 })
  approach!: number;

  @Column({ type: "tinyint", width: 1, default: 0 })
  region!: number;

  @Column({ type: "tinyint", width: 1, default: 0 })
  clinPres!: number;

  @Column({ type: "tinyint", width: 1, default: 0 })
  intEvents!: number;
}
