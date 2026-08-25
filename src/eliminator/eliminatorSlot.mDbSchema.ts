import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  Index,
} from "typeorm";

/**
 * One bookable date within an eliminator campaign. `reservedCount` is an
 * atomic counter (claimed via a conditional `UPDATE ... WHERE "reservedCount" <
 * capacity`, see eliminator.service.ts) so concurrent submissions can never
 * push a date past its cap without extra locking.
 */
@Entity("eliminator_slots")
@Index(["campaignId", "date"], { unique: true })
export class EliminatorSlotEntity {
  @PrimaryColumn({ type: "uuid" })
  id!: string;

  @Column({ type: "uuid" })
  campaignId!: string;

  @Column({ type: "date" })
  date!: string;

  @Column({ type: "boolean" })
  isOnline!: boolean;

  @Column({ type: "int", default: 3 })
  capacity!: number;

  @Column({ type: "int", default: 0 })
  reservedCount!: number;

  @CreateDateColumn()
  createdAt!: Date;
}
