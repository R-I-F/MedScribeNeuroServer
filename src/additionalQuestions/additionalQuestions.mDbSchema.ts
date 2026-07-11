import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("additional_questions")
export class AdditionalQuestionEntity {
  @PrimaryColumn({ type: "char", length: 36 })
  mainDiagDocId!: string;

  @Column({ type: "smallint", default: 0 })
  spOrCran!: number;

  @Column({ type: "smallint", default: 0 })
  pos!: number;

  @Column({ type: "smallint", default: 0 })
  approach!: number;

  @Column({ type: "smallint", default: 0 })
  region!: number;

  @Column({ type: "smallint", default: 0 })
  clinPres!: number;

  @Column({ type: "smallint", default: 0 })
  intEvents!: number;
}
