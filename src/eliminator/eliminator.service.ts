import { injectable } from "inversify";
import { DataSource, EntityManager } from "typeorm";
import { EliminatorCampaignEntity } from "./eliminatorCampaign.mDbSchema";
import { EliminatorSlotEntity } from "./eliminatorSlot.mDbSchema";
import { EliminatorReservationEntity } from "./eliminatorReservation.mDbSchema";
import {
  IEliminatorLectureOption,
  IEliminatorReservationSummary,
  IEliminatorSlotOption,
  IEliminatorSupervisorOption,
  IEliminatorTopicOption,
} from "./eliminator.interface";
import { toDateOnlyString } from "./dateOnly.util";

/**
 * Repository layer for the lecture-eliminator campaigns. Read methods take a
 * plain `DataSource`; the reservation-claiming methods take a transactional
 * `EntityManager` so callers (eliminator.provider.ts) can compose them inside
 * one atomic `dataSource.transaction(...)` block.
 */
@injectable()
export class EliminatorService {
  public async getCampaignById(
    id: string,
    dataSource: DataSource
  ): Promise<EliminatorCampaignEntity | null> {
    return dataSource.getRepository(EliminatorCampaignEntity).findOne({ where: { id } });
  }

  /** Open topics + lectures for a campaign's department, minus lectures already reserved. */
  public async getOpenTopicsAndLectures(
    campaignId: string,
    departmentId: string,
    dataSource: DataSource
  ): Promise<{ topics: IEliminatorTopicOption[]; lectures: IEliminatorLectureOption[] }> {
    const topics = await dataSource.query(
      `SELECT "id", "title", "sortOrder"
         FROM "lecture_topics"
        WHERE "departmentId" = $1
        ORDER BY "sortOrder", "title"`,
      [departmentId]
    );

    const lectures = await dataSource.query(
      `SELECT l."id", l."title", l."topicId", l."lectureNumber", l."sortOrder"
         FROM "lectures" l
         JOIN "lecture_topics" t ON t."id" = l."topicId"
        WHERE t."departmentId" = $1
          AND NOT EXISTS (
            SELECT 1 FROM "eliminator_reservations" r
             WHERE r."campaignId" = $2 AND r."lectureId" = l."id"
          )
        ORDER BY t."sortOrder", l."sortOrder", l."title"`,
      [departmentId, campaignId]
    );

    return { topics, lectures };
  }

  /** Open dates for a campaign (remaining capacity > 0). */
  public async getOpenSlots(campaignId: string, dataSource: DataSource): Promise<IEliminatorSlotOption[]> {
    const rows: Array<{ id: string; date: string | Date; isOnline: boolean; capacity: number; reservedCount: number }> =
      await dataSource.query(
        `SELECT "id", "date", "isOnline", "capacity", "reservedCount"
           FROM "eliminator_slots"
          WHERE "campaignId" = $1 AND "reservedCount" < "capacity"
          ORDER BY "date"`,
        [campaignId]
      );
    return rows.map((r) => ({
      id: r.id,
      date: toDateOnlyString(r.date),
      isOnline: r.isOnline,
      remaining: r.capacity - r.reservedCount,
    }));
  }

  /** Public supervisor picker: approved supervisors of the campaign's department, name+id only. */
  public async getSupervisorOptions(
    departmentId: string,
    dataSource: DataSource
  ): Promise<IEliminatorSupervisorOption[]> {
    return dataSource.query(
      `SELECT "id", "fullName"
         FROM "supervisors"
        WHERE "departmentId" = $1 AND "approved" = true
        ORDER BY "fullName"`,
      [departmentId]
    );
  }

  public async getSupervisorById(
    id: string,
    dataSource: DataSource
  ): Promise<{ id: string; fullName: string; departmentId: string; email: string } | null> {
    const rows = await dataSource.query(
      `SELECT "id", "fullName", "departmentId", "email" FROM "supervisors" WHERE "id" = $1`,
      [id]
    );
    return rows[0] ?? null;
  }

  /** A campaign's confirmed reservations for one supervisor, joined for display. */
  public async getSupervisorReservations(
    campaignId: string,
    supervisorId: string,
    dataSource: DataSource
  ): Promise<IEliminatorReservationSummary[]> {
    const rows: Array<Omit<IEliminatorReservationSummary, "date"> & { date: string | Date }> = await dataSource.query(
      `SELECT r."id" AS "reservationId", r."lectureId", l."title" AS "lectureTitle",
              t."title" AS "topicTitle", s."date", s."isOnline", r."eventId"
         FROM "eliminator_reservations" r
         JOIN "lectures" l ON l."id" = r."lectureId"
         JOIN "lecture_topics" t ON t."id" = l."topicId"
         JOIN "eliminator_slots" s ON s."id" = r."slotId"
        WHERE r."campaignId" = $1 AND r."supervisorId" = $2
        ORDER BY s."date"`,
      [campaignId, supervisorId]
    );
    return rows.map((r) => ({ ...r, date: toDateOnlyString(r.date) }));
  }

  public async countReservationsForSupervisor(
    campaignId: string,
    supervisorId: string,
    manager: EntityManager
  ): Promise<number> {
    return manager.getRepository(EliminatorReservationEntity).count({
      where: { campaignId, supervisorId },
    });
  }

  /** Verify a lecture belongs to the campaign's department (defense in depth vs the pool query). */
  public async lectureBelongsToDepartment(
    lectureId: string,
    departmentId: string,
    manager: EntityManager
  ): Promise<boolean> {
    const rows = await manager.query(
      `SELECT 1 FROM "lectures" l
         JOIN "lecture_topics" t ON t."id" = l."topicId"
        WHERE l."id" = $1 AND t."departmentId" = $2`,
      [lectureId, departmentId]
    );
    return rows.length > 0;
  }

  public async getSlotForUpdate(
    campaignId: string,
    slotId: string,
    manager: EntityManager
  ): Promise<EliminatorSlotEntity | null> {
    return manager.getRepository(EliminatorSlotEntity).findOne({ where: { id: slotId, campaignId } });
  }

  /**
   * Atomically claim one seat on a slot: increments reservedCount only if it's
   * still below capacity. Returns the updated row, or null if the slot was
   * already full (race lost) - the caller treats that as a conflict.
   *
   * NB: on Postgres, `manager.query()` against an `UPDATE ... RETURNING` returns
   * a `[rows, affectedCount]` tuple, NOT the rows array directly (documented
   * TypeORM gotcha in this codebase - see the candidate-promotion E2E lesson).
   * Destructure explicitly rather than indexing the raw result.
   */
  public async claimSlotSeat(slotId: string, manager: EntityManager): Promise<EliminatorSlotEntity | null> {
    const result = (await manager.query(
      `UPDATE "eliminator_slots"
          SET "reservedCount" = "reservedCount" + 1
        WHERE "id" = $1 AND "reservedCount" < "capacity"
        RETURNING *`,
      [slotId]
    )) as [EliminatorSlotEntity[], number];
    const [rows] = result;
    return rows[0] ?? null;
  }

  /** Releases a previously claimed seat (used to unwind a partially-applied submission on error). */
  public async releaseSlotSeat(slotId: string, manager: EntityManager): Promise<void> {
    await manager.query(
      `UPDATE "eliminator_slots" SET "reservedCount" = "reservedCount" - 1 WHERE "id" = $1`,
      [slotId]
    );
  }

  /**
   * Inserts the reservation row. Relies on the UNIQUE(campaignId, lectureId)
   * constraint to hard-lock a lecture; callers must catch the unique-violation
   * (Postgres code 23505) and translate it to a friendly conflict.
   */
  public async insertReservation(
    data: { campaignId: string; slotId: string; lectureId: string; supervisorId: string },
    manager: EntityManager
  ): Promise<EliminatorReservationEntity> {
    const repo = manager.getRepository(EliminatorReservationEntity);
    const row = repo.create({ ...data, eventId: null });
    return repo.save(row);
  }

  public async attachEventToReservation(
    reservationId: string,
    eventId: string,
    manager: EntityManager
  ): Promise<void> {
    await manager.getRepository(EliminatorReservationEntity).update({ id: reservationId }, { eventId });
  }
}
