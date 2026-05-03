import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

export type WaLinkedRole = "candidate" | "supervisor" | "unknown";

@Entity("whatsapp_sessions")
export class WhatsappSessionEntity {
  @PrimaryGeneratedColumn({ type: "bigint", unsigned: true })
  id!: string;

  @Column({ name: "wa_from", type: "varchar", length: 32, unique: true })
  waFrom!: string;

  @Column({ name: "linked_user_id", type: "char", length: 36, nullable: true })
  linkedUserId!: string | null;

  @Column({
    name: "linked_role",
    type: "enum",
    enum: ["candidate", "supervisor", "unknown"],
    default: "unknown",
  })
  linkedRole!: WaLinkedRole;

  @Column({
    name: "linked_candidate_id",
    type: "char",
    length: 36,
    nullable: true,
  })
  linkedCandidateId!: string | null;

  @Column({
    name: "linked_supervisor_id",
    type: "char",
    length: 36,
    nullable: true,
  })
  linkedSupervisorId!: string | null;

  @Column({ name: "conversation_state", type: "varchar", length: 64 })
  conversationState!: string;

  @Column({ name: "context_json", type: "longtext", nullable: true })
  contextJson!: string | null;

  @Column({
    name: "expires_at",
    type: "datetime",
    precision: 3,
    nullable: true,
  })
  expiresAt!: Date | null;

  @CreateDateColumn({ name: "created_at", type: "datetime", precision: 3 })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "datetime", precision: 3 })
  updatedAt!: Date;
}
