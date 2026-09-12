import { injectable } from "inversify";
import { DataSource, EntityManager } from "typeorm";
import { EliminatorCampaignEntity } from "../eliminator/eliminatorCampaign.mDbSchema";
import { EliminatorSlotEntity } from "../eliminator/eliminatorSlot.mDbSchema";
import { JournalReservationEntity } from "./journalReservation.mDbSchema";
import { toDateOnlyString } from "../eliminator/dateOnly.util";
import {
  IJournalCampaignAdminRow,
  IJournalOption,
  IJournalReservationSummary,
  IJournalSlotOption,
} from "./journalEliminator.interface";

/**
 * Repository layer for the candidate journal-club eliminator. Reads take a plain
 * `DataSource`; the claiming methods take a transactional `EntityManager` so the
 * provider can compose them in one atomic block, exactly like eliminator.service.ts.
 *
 * A canceled journal event is deliberately NOT treated as "already presented": if
 * the talk never happened, the candidate is still free to bring that paper.
 */
@injectable()
export class JournalEliminatorService {
  /** The department's current campaign. Journals ride on the lecture campaign's dates. */
  public async getActiveCampaignForDepartment(
    departmentId: string,
    dataSource: DataSource
  ): Promise<EliminatorCampaignEntity | null> {
    const rows = await dataSource.getRepository(EliminatorCampaignEntity).find({
      where: { departmentId, isActive: true },
      order: { createdAt: "DESC" },
      take: 1,
    });
    return rows[0] ?? null;
  }

  public async getCampaignById(
    id: string,
    dataSource: DataSource
  ): Promise<EliminatorCampaignEntity | null> {
    return dataSource.getRepository(EliminatorCampaignEntity).findOne({ where: { id } });
  }

  public async getCandidateById(
    id: string,
    dataSource: DataSource
  ): Promise<{ id: string; fullName: string; email: string; departmentId: string | null } | null> {
    const rows = await dataSource.query(
      `SELECT "id", "fullName", "email", "departmentId"
         FROM "candidates"
        WHERE "id" = $1 AND "archivedAt" IS NULL`,
      [id]
    );
    return rows[0] ?? null;
  }

  /**
   * The journals this candidate may still pick: their department's catalogue, minus
   * anything already claimed in this campaign (gone for everyone), minus anything
   * this candidate has presented before (their own history only, per the rule).
   */
  public async getOpenJournals(
    campaignId: string,
    departmentId: string,
    candidateId: string,
    dataSource: DataSource
  ): Promise<IJournalOption[]> {
    return dataSource.query(
      `SELECT j."id", j."journalTitle", j."pdfLink"
         FROM "journals" j
        WHERE j."departmentId" = $1
          AND NOT EXISTS (
            SELECT 1 FROM "journal_reservations" r
             WHERE r."campaignId" = $2 AND r."journalId" = j."id"
          )
          AND NOT EXISTS (
            SELECT 1 FROM "events" e
             WHERE e."type" = 'journal'
               AND e."journalId" = j."id"
               AND e."presenterId" = $3::text
               AND e."status" <> 'canceled'
          )
        ORDER BY j."journalTitle"`,
      [departmentId, campaignId, candidateId]
    );
  }

  /** Dates with journal room left. Same rows, same isOnline flag, as the lecture form. */
  public async getOpenSlots(campaignId: string, dataSource: DataSource): Promise<IJournalSlotOption[]> {
    const rows: Array<{ id: string; date: string | Date; isOnline: boolean }> = await dataSource.query(
      `SELECT "id", "date", "isOnline"
         FROM "eliminator_slots"
        WHERE "campaignId" = $1 AND "journalReservedCount" < "journalCapacity"
        ORDER BY "date"`,
      [campaignId]
    );
    return rows.map((r) => ({ id: r.id, date: toDateOnlyString(r.date), isOnline: r.isOnline }));
  }

  public async getCandidateReservation(
    campaignId: string,
    candidateId: string,
    dataSource: DataSource
  ): Promise<IJournalReservationSummary | null> {
    const rows: Array<Omit<IJournalReservationSummary, "date"> & { date: string | Date }> =
      await dataSource.query(
        `SELECT r."id" AS "reservationId", r."journalId", j."journalTitle", j."pdfLink",
                s."date", s."isOnline", r."eventId"
           FROM "journal_reservations" r
           JOIN "journals" j ON j."id" = r."journalId"
           JOIN "eliminator_slots" s ON s."id" = r."slotId"
          WHERE r."campaignId" = $1 AND r."candidateId" = $2`,
        [campaignId, candidateId]
      );
    const row = rows[0];
    return row ? { ...row, date: toDateOnlyString(row.date) } : null;
  }

  /** Defense in depth against a stale or hand-rolled submission. */
  public async journalBelongsToDepartment(
    journalId: string,
    departmentId: string,
    manager: EntityManager
  ): Promise<boolean> {
    const rows = await manager.query(
      `SELECT 1 FROM "journals" WHERE "id" = $1 AND "departmentId" = $2`,
      [journalId, departmentId]
    );
    return rows.length > 0;
  }

  /** Has this candidate already presented (or is booked to present) this paper before? */
  public async candidateHasPresented(
    journalId: string,
    candidateId: string,
    manager: EntityManager
  ): Promise<boolean> {
    const rows = await manager.query(
      `SELECT 1 FROM "events"
        WHERE "type" = 'journal' AND "journalId" = $1
          AND "presenterId" = $2::text AND "status" <> 'canceled'`,
      [journalId, candidateId]
    );
    return rows.length > 0;
  }

  public async getSlot(
    campaignId: string,
    slotId: string,
    manager: EntityManager
  ): Promise<EliminatorSlotEntity | null> {
    return manager.getRepository(EliminatorSlotEntity).findOne({ where: { id: slotId, campaignId } });
  }

  /**
   * Atomically take this date's journal seat: increments only while the date is still
   * under its journal capacity, so two candidates racing for the last Thursday cannot
   * both succeed. Returns null when the race was lost.
   *
   * NB: on Postgres, `manager.query()` of an `UPDATE ... RETURNING` yields a
   * `[rows, affectedCount]` tuple, not the rows array - destructure, never index.
   */
  public async claimJournalSeat(
    slotId: string,
    manager: EntityManager
  ): Promise<EliminatorSlotEntity | null> {
    const result = (await manager.query(
      `UPDATE "eliminator_slots"
          SET "journalReservedCount" = "journalReservedCount" + 1
        WHERE "id" = $1 AND "journalReservedCount" < "journalCapacity"
        RETURNING *`,
      [slotId]
    )) as [EliminatorSlotEntity[], number];
    const [rows] = result;
    return rows[0] ?? null;
  }

  public async insertReservation(
    data: { campaignId: string; slotId: string; journalId: string; candidateId: string },
    manager: EntityManager
  ): Promise<JournalReservationEntity> {
    const repo = manager.getRepository(JournalReservationEntity);
    return repo.save(repo.create({ ...data, eventId: null }));
  }

  public async attachEventToReservation(
    reservationId: string,
    eventId: string,
    manager: EntityManager
  ): Promise<void> {
    await manager.getRepository(JournalReservationEntity).update({ id: reservationId }, { eventId });
  }

  public async getJournalById(
    journalId: string,
    manager: EntityManager
  ): Promise<{ journalTitle: string; pdfLink: string } | null> {
    const rows = await manager.query(
      `SELECT "journalTitle", "pdfLink" FROM "journals" WHERE "id" = $1`,
      [journalId]
    );
    return rows[0] ?? null;
  }

  // Super-admin console

  public async listCampaignsForAdmin(dataSource: DataSource): Promise<IJournalCampaignAdminRow[]> {
    const rows = await dataSource.query(
      `SELECT c."id", c."label", c."departmentId", d."code" AS "departmentCode",
              c."journalsOpen", c."isActive",
              COALESCE((SELECT SUM(s."journalCapacity") FROM "eliminator_slots" s
                         WHERE s."campaignId" = c."id"), 0) AS "totalSeats",
              COALESCE((SELECT SUM(s."journalReservedCount") FROM "eliminator_slots" s
                         WHERE s."campaignId" = c."id"), 0) AS "reservedSeats",
              (SELECT COUNT(*) FROM "journals" j
                WHERE j."departmentId" = c."departmentId"
                  AND NOT EXISTS (SELECT 1 FROM "journal_reservations" r
                                   WHERE r."campaignId" = c."id" AND r."journalId" = j."id")
              ) AS "journalsAvailable"
         FROM "eliminator_campaigns" c
         LEFT JOIN "departments" d ON d."id" = c."departmentId"
        ORDER BY c."createdAt" DESC`
    );
    // Postgres returns SUM/COUNT as strings (bigint/numeric); the API contract is numbers.
    return rows.map((r: any) => ({
      ...r,
      totalSeats: Number(r.totalSeats),
      reservedSeats: Number(r.reservedSeats),
      journalsAvailable: Number(r.journalsAvailable),
    }));
  }

  public async setJournalsOpen(
    campaignId: string,
    open: boolean,
    dataSource: DataSource
  ): Promise<void> {
    await dataSource
      .getRepository(EliminatorCampaignEntity)
      .update({ id: campaignId }, { journalsOpen: open });
  }
}
