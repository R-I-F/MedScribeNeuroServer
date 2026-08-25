import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from "typeorm";

/**
 * A confirmed lecture reservation within an eliminator campaign. One row per
 * (campaign, lecture) - the UNIQUE constraint is what "eliminates" a lecture
 * from the pool the instant it is taken, race-safe under concurrent submits.
 * `eventId` points at the real `events` row created in the same transaction
 * (the actual NS calendar booking); this table is the campaign's bookkeeping.
 *
 * `@PrimaryGeneratedColumn` (not `@PrimaryColumn`) is load-bearing: this is
 * the one eliminator entity actually `repo.save()`-created by app code (the
 * other two are migration-seeded only), and only `@PrimaryGeneratedColumn`
 * makes TypeORM read the DB-generated id back after insert - otherwise the
 * in-memory entity's `id` stays undefined even though the DB row got a real
 * uuid via its column default, silently breaking every later use of that id.
 */
@Entity("eliminator_reservations")
@Index(["campaignId", "lectureId"], { unique: true })
@Index(["campaignId", "supervisorId"])
export class EliminatorReservationEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  campaignId!: string;

  @Column({ type: "uuid" })
  slotId!: string;

  @Column({ type: "uuid" })
  lectureId!: string;

  @Column({ type: "uuid" })
  supervisorId!: string;

  @Column({ type: "uuid", nullable: true })
  eventId!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
