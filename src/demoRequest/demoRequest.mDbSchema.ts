import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from "typeorm";

/**
 * Landing-page "Book a demo" request (docs/BOOK_A_DEMO_PLAN.md).
 * Rows are sales leads and are kept forever (no purge sweep). `emailedAt` NULL
 * means the notification email was skipped (global daily budget) or failed;
 * the lead itself is never lost.
 */
@Entity("demo_requests")
@Index(["email", "createdAt"]) // per-email 24h cap
@Index(["ip", "createdAt"]) // per-IP 24h cap
@Index(["emailedAt"]) // global daily email budget count
export class DemoRequestEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 120 })
  fullName!: string;

  @Column({ type: "varchar", length: 255 })
  email!: string; // lowercased

  @Column({ type: "varchar", length: 160, nullable: true })
  organization!: string | null;

  @Column({ type: "varchar", length: 32, nullable: true })
  phoneNum!: string | null;

  @Column({ type: "varchar", length: 2000, nullable: true })
  message!: string | null;

  @Column({ type: "varchar", length: 64 })
  ip!: string;

  @Column({ type: "varchar", length: 512, nullable: true })
  userAgent!: string | null;

  /** Set when the notification email was handed to Mailgun; NULL = skipped/failed. */
  @Column({ type: "timestamp", nullable: true })
  emailedAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;
}
