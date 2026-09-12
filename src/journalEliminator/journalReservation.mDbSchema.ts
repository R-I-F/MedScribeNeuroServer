import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from "typeorm";

/**
 * A candidate's confirmed journal-club claim inside an eliminator campaign.
 *
 * The two unique indexes are the feature's rules, pushed down to the database so
 * concurrent submissions cannot both win:
 *  - UNIQUE(campaignId, journalId)   - a journal, once taken, leaves everyone's list
 *  - UNIQUE(campaignId, candidateId) - one journal per candidate, no more
 *
 * The date's own "one journal per Thursday" limit is NOT here: it lives on
 * `eliminator_slots.journalCapacity`, claimed atomically (see the service), so a
 * single date can be raised without a schema change.
 *
 * `@PrimaryGeneratedColumn` is load-bearing for the same reason it is on
 * EliminatorReservationEntity: only it makes TypeORM read the generated id back
 * after insert, and the id is needed to attach the event.
 */
@Entity("journal_reservations")
@Index(["campaignId", "journalId"], { unique: true })
@Index(["campaignId", "candidateId"], { unique: true })
export class JournalReservationEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  campaignId!: string;

  @Column({ type: "uuid" })
  slotId!: string;

  @Column({ type: "uuid" })
  journalId!: string;

  @Column({ type: "uuid" })
  candidateId!: string;

  @Column({ type: "uuid", nullable: true })
  eventId!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
