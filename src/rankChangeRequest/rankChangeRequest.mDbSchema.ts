import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

export type RankChangeStatus = "pending" | "approved" | "rejected" | "canceled";

/**
 * A candidate's request to change their own rank (docs/RANK_CHANGE_REQUEST_PLAN.md).
 *
 * The candidate asks from their profile; `candidates.rank` is changed ONLY when an institute
 * admin of the candidate's department (or the super admin) approves. At most one `pending`
 * request per candidate, enforced by the partial unique index "UQ_rcr_one_pending".
 * Ranks are stored as text and validated in the app against the `Rank` enum.
 * Indexes live in migration 1783782610340 (one-pending partial unique + two lookups).
 */
@Entity("rank_change_requests")
export class RankChangeRequestEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  candidateId!: string;

  /** The candidate's rank when they asked, kept so the history reads correctly later. */
  @Column({ type: "varchar", length: 32 })
  fromRank!: string;

  @Column({ type: "varchar", length: 32 })
  requestedRank!: string;

  @Column({ type: "varchar", length: 16, default: "pending" })
  status!: RankChangeStatus;

  /** institute_admins.id, or super_admins.id. No FK: two possible tables. */
  @Column({ type: "uuid", nullable: true })
  reviewedById!: string | null;

  @Column({ type: "varchar", length: 16, nullable: true })
  reviewedByRole!: string | null;

  @Column({ type: "varchar", length: 500, nullable: true })
  reviewNote!: string | null;

  @Column({ type: "timestamp", nullable: true })
  reviewedAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
