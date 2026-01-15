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

  @Column({ type: "varchar", length: 255, charset: "utf8mb4", collation: "utf8mb4_unicode_ci" })
  journalTitle!: string;

  @Column({ type: "text" })
  pdfLink!: string;

  @Column({ type: "varchar", length: 255, unique: true })
  google_uid!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
