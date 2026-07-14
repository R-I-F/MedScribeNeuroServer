import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("journals")
export class JournalEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255 })
  journalTitle!: string;

  @Column({ type: "text" })
  pdfLink!: string;

  @Column({ type: "varchar", length: 255, unique: true })
  google_uid!: string;

  // Department this journal-club entry belongs to (FK → departments). Dept-scoped; nullable during rollout (backfill → NS).
  @Column({ type: "uuid", nullable: true })
  departmentId?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
