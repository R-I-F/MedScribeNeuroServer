import { inject, injectable } from "inversify";
import { DataSource } from "typeorm";
import { EliminatorService } from "./eliminator.service";
import { EventProvider } from "../event/event.provider";
import { IEventInput } from "../event/event.interface";
import { MailerService } from "../mailer/mailer.service";
import {
  EliminatorConflictError,
  IEliminatorReserveInput,
  IEliminatorReservationSummary,
  IEliminatorState,
  IEliminatorSupervisorOption,
  IEliminatorSupervisorStatus,
} from "./eliminator.interface";
import { EliminatorCampaignEntity } from "./eliminatorCampaign.mDbSchema";
import { toDateOnlyString } from "./dateOnly.util";

/** Postgres unique_violation error code. */
const UNIQUE_VIOLATION = "23505";

/** Named so the reminder/contact copy stays in one place instead of scattered inline. */
const ADMIN_CONTACT_NAMES = "Dr. Amr Helmy or Dr. Alaa Mahmoud";

const getCcEmail = (): string => process.env.ELIMINATOR_NOTIFY_CC || "medscribeeg@gmail.com";
const getLoginUrl = (): string => `${process.env.FRONTEND_URL || "http://localhost:3000"}/login`;

@injectable()
export class EliminatorProvider {
  constructor(
    @inject(EliminatorService) private eliminatorService: EliminatorService,
    @inject(EventProvider) private eventProvider: EventProvider,
    @inject(MailerService) private mailerService: MailerService
  ) {}

  public async getState(
    campaignId: string,
    dataSource: DataSource,
    excludeLectureIds: string[] = []
  ): Promise<IEliminatorState> {
    const campaign = await this.mustGetActiveCampaign(campaignId, dataSource);
    const { topics, lectures } = await this.eliminatorService.getOpenTopicsAndLectures(
      campaign.id,
      campaign.departmentId,
      dataSource,
      excludeLectureIds
    );
    const slots = await this.eliminatorService.getOpenSlots(campaign.id, dataSource);
    return {
      campaign: {
        id: campaign.id,
        label: campaign.label,
        minPerSupervisor: campaign.minPerSupervisor,
        maxPerSupervisor: campaign.maxPerSupervisor,
      },
      topics,
      lectures,
      slots,
    };
  }

  public async getSupervisors(campaignId: string, dataSource: DataSource): Promise<IEliminatorSupervisorOption[]> {
    const campaign = await this.mustGetActiveCampaign(campaignId, dataSource);
    return this.eliminatorService.getSupervisorOptions(campaign.departmentId, dataSource);
  }

  // ── Form-scoped variants: a form is just a named view (+ static lecture exclusion list)
  // onto a campaign's SHARED pool of dates and reservations. Nothing about the pool itself
  // is per-form - a lecture or date taken through any form is gone from every form pointing
  // at the same campaign, because they all read/write the one underlying campaignId.

  public async getStateForForm(formId: string, dataSource: DataSource): Promise<IEliminatorState> {
    const form = await this.mustGetForm(formId, dataSource);
    const excluded = await this.eliminatorService.getFormExcludedLectureIds(form.id, dataSource);
    const state = await this.getState(form.campaignId, dataSource, excluded);
    // Show the form's own label (e.g. "... - New Lectures Only"), not the shared campaign's
    // generic one, so a supervisor can tell which entry point they're actually on.
    return { ...state, campaign: { ...state.campaign, label: form.label } };
  }

  public async getSupervisorsForForm(formId: string, dataSource: DataSource): Promise<IEliminatorSupervisorOption[]> {
    const form = await this.mustGetForm(formId, dataSource);
    return this.getSupervisors(form.campaignId, dataSource);
  }

  public async getSupervisorStatusForForm(
    formId: string,
    supervisorId: string,
    dataSource: DataSource
  ): Promise<IEliminatorSupervisorStatus> {
    const form = await this.mustGetForm(formId, dataSource);
    return this.getSupervisorStatus(form.campaignId, supervisorId, dataSource);
  }

  public async reserveForForm(
    formId: string,
    input: IEliminatorReserveInput,
    dataSource: DataSource
  ): Promise<{ reservations: IEliminatorReservationSummary[]; remainingCap: number }> {
    const form = await this.mustGetForm(formId, dataSource);
    const excluded = await this.eliminatorService.getFormExcludedLectureIds(form.id, dataSource);
    return this.reserve(form.campaignId, input, dataSource, excluded);
  }

  public async getSupervisorStatus(
    campaignId: string,
    supervisorId: string,
    dataSource: DataSource
  ): Promise<IEliminatorSupervisorStatus> {
    const campaign = await this.mustGetActiveCampaign(campaignId, dataSource);
    const supervisor = await this.eliminatorService.getSupervisorById(supervisorId, dataSource);
    if (!supervisor || supervisor.departmentId !== campaign.departmentId) {
      throw new EliminatorConflictError("SUPERVISOR_NOT_FOUND", "Supervisor not found in this campaign's department");
    }
    const reservations = await this.eliminatorService.getSupervisorReservations(
      campaign.id,
      supervisorId,
      dataSource
    );
    return {
      supervisor: { id: supervisor.id, fullName: supervisor.fullName },
      reservations,
      remainingCap: Math.max(0, campaign.maxPerSupervisor - reservations.length),
      minPerSupervisor: campaign.minPerSupervisor,
      maxPerSupervisor: campaign.maxPerSupervisor,
    };
  }

  public async reserve(
    campaignId: string,
    input: IEliminatorReserveInput,
    dataSource: DataSource,
    excludeLectureIds: string[] = []
  ): Promise<{ reservations: IEliminatorReservationSummary[]; remainingCap: number }> {
    const campaign = await this.mustGetActiveCampaign(campaignId, dataSource);
    const excludedSet = new Set(excludeLectureIds);

    const selections = input.selections ?? [];
    if (selections.length === 0) {
      throw new EliminatorConflictError("MIN_NOT_MET", "At least one lecture selection is required");
    }
    // No picking the same lecture or the same slot+lecture twice within one submission.
    const lectureIds = selections.map((s) => s.lectureId);
    if (new Set(lectureIds).size !== lectureIds.length) {
      throw new EliminatorConflictError("DUPLICATE_SELECTION", "The same lecture was selected more than once");
    }

    const result = await dataSource.transaction(async (manager) => {
      // Serialize concurrent submissions from the same supervisor (e.g. double-click / two
      // tabs) - released automatically at transaction end.
      await manager.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [`${campaign.id}:${input.supervisorId}`]);

      const supervisor = await this.eliminatorService.getSupervisorById(input.supervisorId, manager as unknown as DataSource);
      if (!supervisor || supervisor.departmentId !== campaign.departmentId) {
        throw new EliminatorConflictError("SUPERVISOR_NOT_FOUND", "Supervisor not found in this campaign's department");
      }

      const existingCount = await this.eliminatorService.countReservationsForSupervisor(
        campaign.id,
        input.supervisorId,
        manager
      );

      if (existingCount + selections.length > campaign.maxPerSupervisor) {
        throw new EliminatorConflictError(
          "CAP_EXCEEDED",
          `This would total ${existingCount + selections.length} lectures, above the cap of ${campaign.maxPerSupervisor}`
        );
      }

      // Soft minimum: a first-time submitter must clear the floor in one go, UNLESS the
      // remaining pool genuinely can't support it (checked against what's open right now,
      // before this submission claims anything).
      if (existingCount === 0 && existingCount + selections.length < campaign.minPerSupervisor) {
        const { lectures } = await this.eliminatorService.getOpenTopicsAndLectures(
          campaign.id,
          campaign.departmentId,
          manager as unknown as DataSource,
          excludeLectureIds
        );
        const openSlots = await this.eliminatorService.getOpenSlots(campaign.id, manager as unknown as DataSource);
        const openSeats = openSlots.reduce((sum, s) => sum + s.remaining, 0);
        const poolCanSupportMin = Math.min(lectures.length, openSeats) >= campaign.minPerSupervisor;
        if (poolCanSupportMin) {
          throw new EliminatorConflictError(
            "MIN_NOT_MET",
            `Please select at least ${campaign.minPerSupervisor} lectures`
          );
        }
      }

      const summaries: IEliminatorReservationSummary[] = [];

      // On any throw below, the whole DB transaction rolls back - slot counters and
      // reservation rows already touched in this loop are automatically undone, so
      // there is nothing to manually unwind here.
      for (const selection of selections) {
        // Defense in depth: reject an excluded lecture even if a stale client submits it
        // anyway (the picker already hides it, so this only fires against a stale page).
        if (excludedSet.has(selection.lectureId)) {
          throw new EliminatorConflictError("LECTURE_EXCLUDED", "That lecture is not offered on this form", {
            lectureId: selection.lectureId,
          });
        }

        const belongs = await this.eliminatorService.lectureBelongsToDepartment(
          selection.lectureId,
          campaign.departmentId,
          manager
        );
        if (!belongs) {
          throw new EliminatorConflictError("LECTURE_NOT_FOUND", "Lecture not found", {
            lectureId: selection.lectureId,
          });
        }

        const slot = await this.eliminatorService.getSlotForUpdate(campaign.id, selection.slotId, manager);
        if (!slot) {
          throw new EliminatorConflictError("SLOT_NOT_FOUND", "Date not found", { slotId: selection.slotId });
        }

        const claimed = await this.eliminatorService.claimSlotSeat(selection.slotId, manager);
        if (!claimed) {
          throw new EliminatorConflictError(
            "SLOT_FULL",
            "That date just filled up - please pick another date",
            { slotId: selection.slotId }
          );
        }

        let reservation;
        try {
          reservation = await this.eliminatorService.insertReservation(
            {
              campaignId: campaign.id,
              slotId: selection.slotId,
              lectureId: selection.lectureId,
              supervisorId: input.supervisorId,
            },
            manager
          );
        } catch (err: any) {
          if (err?.code === UNIQUE_VIOLATION) {
            throw new EliminatorConflictError(
              "LECTURE_TAKEN",
              "That lecture was just reserved by someone else - please pick another",
              { lectureId: selection.lectureId }
            );
          }
          throw err;
        }

        const lectureRows = await manager.query(`SELECT "title" FROM "lectures" WHERE "id" = $1`, [
          selection.lectureId,
        ]);
        const topicRows = await manager.query(
          `SELECT t."title" FROM "lecture_topics" t
             JOIN "lectures" l ON l."topicId" = t."id"
            WHERE l."id" = $1`,
          [selection.lectureId]
        );

        const dateTime = this.buildDateTime(slot.date, slot.isOnline, campaign);
        const eventInput: IEventInput = {
          type: "lecture",
          lecture: selection.lectureId,
          dateTime,
          location: slot.isOnline ? "Online" : "Dept",
          presenter: input.supervisorId,
          status: "booked",
          attendance: [],
        };
        const event = await this.eventProvider.createEvent(
          eventInput,
          manager as unknown as DataSource,
          campaign.departmentId,
          { id: input.supervisorId, role: "supervisor" }
        );

        await this.eliminatorService.attachEventToReservation(reservation.id, event.id, manager);

        summaries.push({
          reservationId: reservation.id,
          lectureId: selection.lectureId,
          lectureTitle: lectureRows[0]?.title ?? "",
          topicTitle: topicRows[0]?.title ?? "",
          date: toDateOnlyString(slot.date),
          isOnline: slot.isOnline,
          eventId: event.id,
        });
      }

      return {
        reservations: summaries,
        remainingCap: Math.max(0, campaign.maxPerSupervisor - (existingCount + summaries.length)),
        supervisor: { id: supervisor.id, fullName: supervisor.fullName, email: supervisor.email },
      };
    });

    // Best-effort confirmation email, sent AFTER commit (so a mail failure never rolls back a
    // real booking). Reads the supervisor's full up-to-date reservation list (existing + the
    // ones just added) rather than only this submission's summaries, matching what the "done"
    // screen shows.
    try {
      const allReservations = await this.eliminatorService.getSupervisorReservations(
        campaign.id,
        result.supervisor.id,
        dataSource
      );
      await this.sendConfirmationEmail(campaign, result.supervisor, allReservations);
    } catch (err: any) {
      console.error(`[Eliminator] confirmation email failed for supervisor ${result.supervisor.id}:`, err?.message ?? err);
    }

    return { reservations: result.reservations, remainingCap: result.remainingCap };
  }

  private async sendConfirmationEmail(
    campaign: EliminatorCampaignEntity,
    supervisor: { fullName: string; email: string },
    reservations: IEliminatorReservationSummary[]
  ): Promise<void> {
    if (!supervisor.email) return;
    const subject = `Lecture reservations confirmed - ${campaign.label}`;
    await this.mailerService.sendMail({
      to: supervisor.email,
      cc: getCcEmail(),
      subject,
      html: this.buildConfirmationHtml(campaign, supervisor, reservations),
      text: this.buildConfirmationText(campaign, supervisor, reservations),
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
    supervisor: { fullName: string },
    reservations: IEliminatorReservationSummary[]
  ): string {
    const rows = reservations
      .map(
        (r) => `
        <tr>
          <td style="padding: 8px 12px; font-size: 14px; color: #111827; border-bottom: 1px solid #e5e7eb;">${this.escapeHtml(r.lectureTitle)}<br/><span style="color:#6b7280; font-size:12px;">${this.escapeHtml(r.topicTitle)}</span></td>
          <td style="padding: 8px 12px; font-size: 14px; color: #111827; border-bottom: 1px solid #e5e7eb; white-space: nowrap;">${this.formatReadableDate(r.date)}</td>
          <td style="padding: 8px 12px; font-size: 12px; border-bottom: 1px solid #e5e7eb; white-space: nowrap;">
            <span style="display:inline-block; padding:2px 10px; border-radius:999px; background:${r.isOnline ? "#ede9fe" : "#dcfce7"}; color:${r.isOnline ? "#6d28d9" : "#15803d"}; font-weight:600;">${r.isOnline ? "Online" : "On-site"}</span>
          </td>
        </tr>`
      )
      .join("");

    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Lecture reservations confirmed</title></head>
<body style="margin: 0; padding: 24px 16px; background-color: #eff6ff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 560px; margin: 0 auto;">
    <tr><td style="padding: 24px 0 8px; text-align: center;">
      <span style="display: inline-block; padding: 8px 16px; background-color: #dbeafe; color: #1d4ed8; font-size: 14px; font-weight: 600; border-radius: 9999px;">LibelusPro</span>
    </td></tr>
    <tr><td style="padding: 16px 0; font-size: 22px; font-weight: 700; color: #111827; text-align: center;">Lecture reservations confirmed</td></tr>
    <tr><td style="padding: 24px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px;">
      <p style="margin: 0 0 12px; font-size: 14px; color: #111827;">Hi ${this.escapeHtml(supervisor.fullName)},</p>
      <p style="margin: 0 0 16px; font-size: 14px; color: #374151; line-height: 1.6;">
        Thank you for confirming your lecture reservations for <strong>${this.escapeHtml(campaign.label)}</strong>. Here is your current schedule:
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th style="text-align:left; padding: 8px 12px; font-size: 12px; color: #6b7280; border-bottom: 2px solid #e5e7eb;">Lecture</th>
            <th style="text-align:left; padding: 8px 12px; font-size: 12px; color: #6b7280; border-bottom: 2px solid #e5e7eb;">Date</th>
            <th style="text-align:left; padding: 8px 12px; font-size: 12px; color: #6b7280; border-bottom: 2px solid #e5e7eb;"></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div style="margin-top: 20px; padding: 14px 16px; background-color: #f8fafc; border: 1px solid #e5e7eb; border-radius: 8px;">
        <p style="margin: 0 0 8px; font-size: 13px; color: #374151; line-height: 1.6;">
          Reminder: you already have an account on the Electronic Logbook system. You can log in anytime to track your attendance and view your past lectures.
        </p>
        <a href="${getLoginUrl()}" style="display:inline-block; margin-top: 4px; padding: 8px 16px; background-color: #2563eb; color: #ffffff; font-size: 13px; font-weight: 600; text-decoration: none; border-radius: 6px;">Log in</a>
      </div>
      <p style="margin: 16px 0 0; font-size: 12px; color: #6b7280; line-height: 1.6;">
        If you don't remember your login credentials, please contact the Electronic Logbook admins: ${this.escapeHtml(ADMIN_CONTACT_NAMES)}.
      </p>
    </td></tr>
    <tr><td style="padding: 16px 0 0; font-size: 12px; color: #6b7280; text-align: center;">This is an automated confirmation from the NS lecture reservation form.</td></tr>
  </table>
</body>
</html>
    `.trim();
  }

  private buildConfirmationText(
    campaign: EliminatorCampaignEntity,
    supervisor: { fullName: string },
    reservations: IEliminatorReservationSummary[]
  ): string {
    const lines = reservations.map(
      (r) => `- ${r.lectureTitle} (${r.topicTitle}) - ${this.formatReadableDate(r.date)} - ${r.isOnline ? "Online" : "On-site"}`
    );
    return [
      `Lecture reservations confirmed - ${campaign.label}`,
      ``,
      `Hi ${supervisor.fullName},`,
      ``,
      `Thank you for confirming your lecture reservations. Here is your current schedule:`,
      ``,
      ...lines,
      ``,
      `Reminder: you already have an account on the Electronic Logbook system. You can log in anytime to track your attendance and view your past lectures.`,
      `Log in: ${getLoginUrl()}`,
      ``,
      `If you don't remember your login credentials, please contact the Electronic Logbook admins: ${ADMIN_CONTACT_NAMES}.`,
    ].join("\n");
  }

  private async mustGetActiveCampaign(campaignId: string, dataSource: DataSource): Promise<EliminatorCampaignEntity> {
    const campaign = await this.eliminatorService.getCampaignById(campaignId, dataSource);
    if (!campaign || !campaign.isActive) {
      throw new Error("Campaign not found");
    }
    return campaign;
  }

  private async mustGetForm(
    formId: string,
    dataSource: DataSource
  ): Promise<{ id: string; campaignId: string; label: string }> {
    const form = await this.eliminatorService.getFormById(formId, dataSource);
    if (!form) {
      throw new Error("Form not found");
    }
    return form;
  }

  /**
   * Builds the event's `dateTime`. TypeORM formats "timestamp" (no tz) columns from a JS
   * Date's UTC getters, so constructing via `Date.UTC(...)` with the intended Cairo
   * wall-clock hour stores exactly that wall-clock value, independent of the server's or
   * client's actual timezone.
   */
  private buildDateTime(date: string | Date, isOnline: boolean, campaign: EliminatorCampaignEntity): Date {
    const [year, month, day] = toDateOnlyString(date).split("-").map(Number);
    const [hour, minute] = (isOnline ? campaign.onlineTime : campaign.onsiteTime).split(":").map(Number);
    return new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  }
}
