import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

/**
 * A lecture "eliminator" campaign: a public, no-login booking round where
 * supervisors of one department claim open academic lectures against a fixed
 * pool of dates. Once a lecture is reserved it is removed from the pool; once
 * a date reaches `slotsPerDay` reservations it is removed from the pool too.
 *
 * `onsiteTime`/`onlineTime` are "HH:mm" (24h) wall-clock times applied to every
 * reservation on a date, chosen by that date's `eliminator_slots.isOnline` flag
 * (all lectures on the same date therefore share one time - intentional, per
 * the user: supervisors coordinate the running order among themselves).
 */
@Entity("eliminator_campaigns")
export class EliminatorCampaignEntity {
  @PrimaryColumn({ type: "uuid" })
  id!: string;

  @Column({ type: "varchar", length: 120 })
  label!: string;

  @Column({ type: "uuid" })
  departmentId!: string;

  @Column({ type: "int", default: 3 })
  slotsPerDay!: number;

  @Column({ type: "int", default: 2 })
  minPerSupervisor!: number;

  @Column({ type: "int", default: 5 })
  maxPerSupervisor!: number;

  @Column({ type: "varchar", length: 5, default: "10:00" })
  onsiteTime!: string;

  @Column({ type: "varchar", length: 5, default: "22:00" })
  onlineTime!: string;

  @Column({ type: "boolean", default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
