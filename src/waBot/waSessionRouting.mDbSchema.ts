import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

/**
 * Maps WhatsApp sender id (messages[].from) to selected institution UUID.
 * Stored in defaultdb so inbound webhooks can resolve tenant DB before loading tenant whatsapp_sessions.
 */
@Entity("wa_session_routing")
export class WaSessionRoutingEntity {
  @PrimaryColumn({ name: "wa_from", type: "varchar", length: 32 })
  waFrom!: string;

  @Column({ name: "institution_id", type: "char", length: 36 })
  institutionId!: string;

  @CreateDateColumn({ name: "created_at", type: "datetime", precision: 3 })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "datetime", precision: 3 })
  updatedAt!: Date;
}
