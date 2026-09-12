import { inject, injectable } from "inversify";
import { DataSource } from "typeorm";
import { JournalEliminatorService } from "./journalEliminator.service";
import { EventProvider } from "../event/event.provider";
import { IEventInput } from "../event/event.interface";
import { MailerService } from "../mailer/mailer.service";
import { EliminatorCampaignEntity } from "../eliminator/eliminatorCampaign.mDbSchema";
import { toDateOnlyString } from "../eliminator/dateOnly.util";
import {
  IJournalCampaignAdminRow,
  IJournalEliminatorState,
  IJournalReservationSummary,
  IJournalReserveInput,
  JournalEliminatorConflictError,
} from "./journalEliminator.interface";

/** Postgres unique_violation error code. */
const UNIQUE_VIOLATION = "23505";
const IDX_CAMPAIGN_JOURNAL = "IDX_jelim_res_campaign_journal";

const getCcEmail = (): string => process.env.ELIMINATOR_NOTIFY_CC || "medscribeeg@gmail.com";
const getLoginUrl = (): string => `${process.env.FRONTEND_URL || "http://localhost:3000"}/login`;

/**
 * Candidate journal-club booking, riding on the lecture eliminator's campaign and
 * its dates (src/eliminator/). The rules, and where each one is actually enforced:
 *
 *  - one journal per candidate      -> UNIQUE(campaignId, candidateId) in the DB
 *  - one journal per Thursday       -> eliminator_slots.journalCapacity, claimed atomically
 *  - a taken journal leaves the list -> UNIQUE(campaignId, journalId) + the pool query
 *  - no repeating your own past paper -> checked against this candidate's journal events
 *  - super-admin open/close          -> eliminator_campaigns.journalsOpen
 *
 * The identity always comes from the candidate's DB row, resolved from the JWT id,
 * never from a body field and never from the JWT's own department claim (which can
 * be stale after a department switch).
 */
@injectable()
export class JournalEliminatorProvider {
  constructor(
    @inject(JournalEliminatorService) private journalEliminatorService: JournalEliminatorService,
    @inject(EventProvider) private eventProvider: EventProvider,
    @inject(MailerService) private mailerService: MailerService
  ) {}

  public async getState(candidateId: string, dataSource: DataSource): Promise<IJournalEliminatorState> {
    const candidate = await this.mustGetCandidate(candidateId, dataSource);

    const closed: IJournalEliminatorState = {
      open: false,
      campaign: null,
      myReservation: null,
      journals: [],
      slots: [],
    };

    if (!candidate.departmentId) return closed;

    const campaign = await this.journalEliminatorService.getActiveCampaignForDepartment(
      candidate.departmentId,
      dataSource
    );
    if (!campaign) return closed;

    const myReservation = await this.journalEliminatorService.getCandidateReservation(
      campaign.id,
      candidate.id,
      dataSource
    );

    // A closed round still shows an existing booking: the candidate must be able to see
    // which paper and date they hold after the round is shut.
    const campaignRef = { id: campaign.id, label: campaign.label };
    if (!campaign.journalsOpen) {
      return { ...closed, campaign: campaignRef, myReservation };
    }

    // Already booked: the pool is irrelevant to them (one journal each), so it is not
    // fetched rather than being sent and hidden.
    if (myReservation) {
      return { open: true, campaign: campaignRef, myReservation, journals: [], slots: [] };
    }

    const [journals, slots] = await Promise.all([
      this.journalEliminatorService.getOpenJournals(
        campaign.id,
        candidate.departmentId,
        candidate.id,
        dataSource
      ),
      this.journalEliminatorService.getOpenSlots(campaign.id, dataSource),
    ]);

    return { open: true, campaign: campaignRef, myReservation: null, journals, slots };
  }

  public async reserve(
    candidateId: string,
    input: IJournalReserveInput,
    dataSource: DataSource
  ): Promise<IJournalReservationSummary> {
    const candidate = await this.mustGetCandidate(candidateId, dataSource);
    if (!candidate.departmentId) {
      throw new JournalEliminatorConflictError(
        "NO_CAMPAIGN",
        "Your account has no department, so there is no journal club round to book"
      );
    }

    const campaign = await this.journalEliminatorService.getActiveCampaignForDepartment(
      candidate.departmentId,
      dataSource
    );
    if (!campaign) {
      throw new JournalEliminatorConflictError(
        "NO_CAMPAIGN",
        "There is no active journal club round for your department"
      );
    }
    if (!campaign.journalsOpen) {
      throw new JournalEliminatorConflictError(
        "JOURNALS_CLOSED",
        "Journal club booking is currently closed"
      );
    }

    const summary = await dataSource.transaction(async (manager) => {
      // Serializes a double-click or two open tabs from the same candidate. Released at
      // transaction end.
      await manager.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [
        `journal:${campaign.id}:${candidate.id}`,
      ]);

      const existing = await this.journalEliminatorService.getCandidateReservation(
        campaign.id,
        candidate.id,
        manager as unknown as DataSource
      );
      if (existing) {
        throw new JournalEliminatorConflictError(
          "ALREADY_RESERVED",
          "You have already reserved a journal club. Each candidate may present one."
        );
      }

      const belongs = await this.journalEliminatorService.journalBelongsToDepartment(
        input.journalId,
        candidate.departmentId!,
        manager
      );
      if (!belongs) {
        throw new JournalEliminatorConflictError("JOURNAL_NOT_FOUND", "Journal not found", {
          journalId: input.journalId,
        });
      }

      // Defense in depth: the picker already hides these, so this only catches a stale page.
      const presented = await this.journalEliminatorService.candidateHasPresented(
        input.journalId,
        candidate.id,
        manager
      );
      if (presented) {
        throw new JournalEliminatorConflictError(
          "JOURNAL_ALREADY_PRESENTED",
          "You have presented this journal before. Please choose one you have not presented.",
          { journalId: input.journalId }
        );
      }

      const slot = await this.journalEliminatorService.getSlot(campaign.id, input.slotId, manager);
      if (!slot) {
        throw new JournalEliminatorConflictError("SLOT_NOT_FOUND", "Date not found", {
          slotId: input.slotId,
        });
      }

      const claimed = await this.journalEliminatorService.claimJournalSeat(input.slotId, manager);
      if (!claimed) {
        throw new JournalEliminatorConflictError(
          "SLOT_FULL",
          "That date just filled up. Please pick another date.",
          { slotId: input.slotId }
        );
      }

      let reservation;
      try {
        reservation = await this.journalEliminatorService.insertReservation(
          {
            campaignId: campaign.id,
            slotId: input.slotId,
            journalId: input.journalId,
            candidateId: candidate.id,
          },
          manager
        );
      } catch (err: any) {
        // Which unique index fired tells us which race was lost: the paper, or a second
        // booking by this same candidate.
        if (err?.code === UNIQUE_VIOLATION) {
          if (String(err?.constraint ?? "").includes(IDX_CAMPAIGN_JOURNAL)) {
            throw new JournalEliminatorConflictError(
              "JOURNAL_TAKEN",
              "That journal was just reserved by someone else. Please pick another.",
              { journalId: input.journalId }
            );
          }
          throw new JournalEliminatorConflictError(
            "ALREADY_RESERVED",
            "You have already reserved a journal club. Each candidate may present one."
          );
        }
        throw err;
      }

      const journal = await this.journalEliminatorService.getJournalById(input.journalId, manager);

      const eventInput: IEventInput = {
        type: "journal",
        journal: input.journalId,
        dateTime: this.buildDateTime(slot.date, slot.isOnline, campaign),
        location: slot.isOnline ? "Online" : "Dept",
        presenter: candidate.id,
        status: "booked",
        attendance: [],
      };
      const event = await this.eventProvider.createEvent(
        eventInput,
        manager as unknown as DataSource,
        campaign.departmentId,
        { id: candidate.id, role: "candidate" }
      );

      await this.journalEliminatorService.attachEventToReservation(reservation.id, event.id, manager);

      return {
        reservationId: reservation.id,
        journalId: input.journalId,
        journalTitle: journal?.journalTitle ?? "",
        pdfLink: journal?.pdfLink ?? "",
        date: toDateOnlyString(slot.date),
        isOnline: slot.isOnline,
        eventId: event.id,
      };
    });

    // Best-effort confirmation, sent AFTER commit so a mail failure never undoes a real booking.
    try {
      await this.sendConfirmationEmail(campaign, candidate, summary);
    } catch (err: any) {
      console.error(
        `[JournalEliminator] confirmation email failed for candidate ${candidate.id}:`,
        err?.message ?? err
      );
    }

    return summary;
  }

  // Super-admin

  public listCampaignsForAdmin(dataSource: DataSource): Promise<IJournalCampaignAdminRow[]> {
    return this.journalEliminatorService.listCampaignsForAdmin(dataSource);
  }

  public async setJournalsOpen(
    campaignId: string,
    open: boolean,
    dataSource: DataSource
  ): Promise<IJournalCampaignAdminRow> {
    const campaign = await this.journalEliminatorService.getCampaignById(campaignId, dataSource);
    if (!campaign) {
      throw new JournalEliminatorConflictError("NO_CAMPAIGN", "Campaign not found");
    }
    await this.journalEliminatorService.setJournalsOpen(campaignId, open, dataSource);
    const rows = await this.journalEliminatorService.listCampaignsForAdmin(dataSource);
    // Report the row as it now stands, so the caller never has to guess the result.
    return rows.find((r) => r.id === campaignId)!;
  }

  private async mustGetCandidate(
    candidateId: string,
    dataSource: DataSource
  ): Promise<{ id: string; fullName: string; email: string; departmentId: string | null }> {
    const candidate = await this.journalEliminatorService.getCandidateById(candidateId, dataSource);
    // Also the role gate: `requireCandidate` is hierarchical and admits supervisors and
    // admins, but only a real, active candidate row can present a journal club.
    if (!candidate) {
      throw new JournalEliminatorConflictError(
        "CANDIDATE_NOT_FOUND",
        "Journal club booking is available to candidates only"
      );
    }
    return candidate;
  }

  /**
   * Builds the event's `dateTime`. TypeORM formats "timestamp" (no tz) columns from a JS
   * Date's UTC getters, so constructing via `Date.UTC(...)` with the intended Cairo
   * wall-clock hour stores exactly that wall-clock value, whatever the server timezone is.
   */
  private buildDateTime(date: string | Date, isOnline: boolean, campaign: EliminatorCampaignEntity): Date {
    const [year, month, day] = toDateOnlyString(date).split("-").map(Number);
    const [hour, minute] = (isOnline ? campaign.onlineTime : campaign.onsiteTime).split(":").map(Number);
    return new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  }

  private async sendConfirmationEmail(
    campaign: EliminatorCampaignEntity,
    candidate: { fullName: string; email: string },
    reservation: IJournalReservationSummary
  ): Promise<void> {
    if (!candidate.email) return;
    await this.mailerService.sendMail({
      to: candidate.email,
      cc: getCcEmail(),
      subject: `Journal club reservation confirmed - ${campaign.label}`,
      html: this.buildConfirmationHtml(campaign, candidate, reservation),
      text: this.buildConfirmationText(campaign, candidate, reservation),
    });
  }

  private formatReadableDate(date: string): string {
    const [y, m, d] = date.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  }

  private formatTime(isOnline: boolean, campaign: EliminatorCampaignEntity): string {
    return isOnline ? campaign.onlineTime : campaign.onsiteTime;
  }

  private escapeHtml(value: string): string {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  private buildConfirmationHtml(
    campaign: EliminatorCampaignEntity,
    candidate: { fullName: string },
    r: IJournalReservationSummary
  ): string {
    const modeLabel = r.isOnline ? "Online" : "On-site";
    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Journal club reservation confirmed</title></head>
<body style="margin: 0; padding: 24px 16px; background-color: #eff6ff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 560px; margin: 0 auto;">
    <tr><td style="padding: 24px 0 8px; text-align: center;">
      <span style="display: inline-block; padding: 8px 16px; background-color: #dbeafe; color: #1d4ed8; font-size: 14px; font-weight: 600; border-radius: 9999px;">LibelusPro</span>
    </td></tr>
    <tr><td style="padding: 16px 0; font-size: 22px; font-weight: 700; color: #111827; text-align: center;">Journal club reservation confirmed</td></tr>
    <tr><td style="padding: 24px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px;">
      <p style="margin: 0 0 12px; font-size: 14px; color: #111827;">Hi ${this.escapeHtml(candidate.fullName)},</p>
      <p style="margin: 0 0 16px; font-size: 14px; color: #374151; line-height: 1.6;">
        Your journal club presentation for <strong>${this.escapeHtml(campaign.label)}</strong> is booked.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 12px; font-size: 12px; color: #6b7280; border-bottom: 1px solid #e5e7eb; white-space: nowrap;">Journal</td>
          <td style="padding: 8px 12px; font-size: 14px; color: #111827; border-bottom: 1px solid #e5e7eb;">${this.escapeHtml(r.journalTitle)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; font-size: 12px; color: #6b7280; border-bottom: 1px solid #e5e7eb; white-space: nowrap;">Date</td>
          <td style="padding: 8px 12px; font-size: 14px; color: #111827; border-bottom: 1px solid #e5e7eb;">${this.formatReadableDate(r.date)} at ${this.formatTime(r.isOnline, campaign)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; font-size: 12px; color: #6b7280; border-bottom: 1px solid #e5e7eb; white-space: nowrap;">Mode</td>
          <td style="padding: 8px 12px; font-size: 12px; border-bottom: 1px solid #e5e7eb;">
            <span style="display:inline-block; padding:2px 10px; border-radius:999px; background:${r.isOnline ? "#ede9fe" : "#dcfce7"}; color:${r.isOnline ? "#6d28d9" : "#15803d"}; font-weight:600;">${modeLabel}</span>
          </td>
        </tr>
      </table>
      <p style="margin: 20px 0 0; font-size: 13px; color: #374151; line-height: 1.6;">
        Each candidate presents one journal club, so this reservation is final. You can see it any time on your dashboard.
      </p>
      <a href="${getLoginUrl()}" style="display:inline-block; margin-top: 12px; padding: 8px 16px; background-color: #2563eb; color: #ffffff; font-size: 13px; font-weight: 600; text-decoration: none; border-radius: 6px;">Open my dashboard</a>
    </td></tr>
    <tr><td style="padding: 16px 0 0; font-size: 12px; color: #6b7280; text-align: center;">This is an automated confirmation from the Electronic Logbook.</td></tr>
  </table>
</body>
</html>
    `.trim();
  }

  private buildConfirmationText(
    campaign: EliminatorCampaignEntity,
    candidate: { fullName: string },
    r: IJournalReservationSummary
  ): string {
    return [
      `Journal club reservation confirmed - ${campaign.label}`,
      ``,
      `Hi ${candidate.fullName},`,
      ``,
      `Your journal club presentation is booked:`,
      `- Journal: ${r.journalTitle}`,
      `- Date: ${this.formatReadableDate(r.date)} at ${this.formatTime(r.isOnline, campaign)}`,
      `- Mode: ${r.isOnline ? "Online" : "On-site"}`,
      ``,
      `Each candidate presents one journal club, so this reservation is final.`,
      `Dashboard: ${getLoginUrl()}`,
    ].join("\n");
  }
}
