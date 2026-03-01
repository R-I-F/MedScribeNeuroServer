import { inject, injectable } from "inversify";
import { DataSource } from "typeorm";
import { ClinicalSubService } from "./clinicalSub.service";
import {
  IClinicalSubDoc,
  IClinicalSubInput,
  IClinicalSubUpdateInput,
  IClinicalSubAssignedDoc,
} from "./clinicalSub.interface";
import { ClinicalSubStatus } from "./clinicalSub.mDbSchema";
import { CandService } from "../cand/cand.service";
import { SupervisorService } from "../supervisor/supervisor.service";
import { MailerService } from "../mailer/mailer.service";
import { toCensoredCand, toCensoredSupervisor } from "../utils/censored.mapper";
import { ICandDoc } from "../cand/cand.interface";
import { ISupervisorDoc } from "../supervisor/supervisor.interface";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Frontend path for supervisor clinical sub review (base URL from FRONTEND_URL env). */
const CLINICAL_SUB_REVIEW_PATH = "/dashboard/supervisor/clinical-submissions";

@injectable()
export class ClinicalSubProvider {
  constructor(
    @inject(ClinicalSubService) private clinicalSubService: ClinicalSubService,
    @inject(CandService) private candService: CandService,
    @inject(SupervisorService) private supervisorService: SupervisorService,
    @inject(MailerService) private mailerService: MailerService
  ) {}

  public async create(
    validatedReq: IClinicalSubInput,
    dataSource: DataSource,
    institutionId?: string
  ): Promise<IClinicalSubDoc> {
    await this.validateCandidateExists(validatedReq.candDocId, dataSource);
    await this.validateSupervisorExists(validatedReq.supervisorDocId, dataSource);
    const dateCA = typeof validatedReq.dateCA === "string" ? new Date(validatedReq.dateCA) : validatedReq.dateCA;
    const saved = await this.clinicalSubService.create(
      {
        candDocId: validatedReq.candDocId,
        supervisorDocId: validatedReq.supervisorDocId,
        dateCA,
        typeCA: validatedReq.typeCA,
        subStatus: ClinicalSubStatus.PENDING,
        description: validatedReq.description ?? "",
      },
      dataSource
    );
    void this.sendSupervisorNewClinicalSubEmail(saved, dataSource, institutionId, validatedReq.supervisorDocId);
    return saved;
  }

  /** Returns list with censored candidate and supervisor (no password, email, phone). */
  public async getAll(dataSource: DataSource): Promise<IClinicalSubAssignedDoc[]> {
    const list = await this.clinicalSubService.getAll(dataSource);
    return list.map((row) => this.toAssignedDoc(row));
  }

  /** Returns one with censored candidate and supervisor (no password, email, phone). */
  public async getById(id: string, dataSource: DataSource): Promise<IClinicalSubAssignedDoc | null> {
    const row = await this.clinicalSubService.getById(id, dataSource);
    return row ? this.toAssignedDoc(row) : null;
  }

  /**
   * Get clinical subs in the resolved institution assigned to the signed-in supervisor (or all for admin).
   * Returns candidate and supervisor as censored (no password, email, phone, etc.).
   */
  public async getAssignedToSupervisorOrAll(
    dataSource: DataSource,
    options: { callerSupervisorId?: string }
  ): Promise<IClinicalSubAssignedDoc[]> {
    const list = await this.clinicalSubService.getAssignedToSupervisorOrAll(dataSource, {
      supervisorDocId: options.callerSupervisorId,
    });
    return list.map((row) => this.toAssignedDoc(row));
  }

  /**
   * Get clinical subs in the resolved institution for the signed-in candidate (or all for admin).
   * Returns candidate and supervisor as censored (no password, email, phone, etc.).
   */
  public async getMineOrAll(
    dataSource: DataSource,
    options: { callerCandidateId?: string }
  ): Promise<IClinicalSubAssignedDoc[]> {
    const list = await this.clinicalSubService.getByCandidateOrAll(dataSource, {
      candDocId: options.callerCandidateId,
    });
    return list.map((row) => this.toAssignedDoc(row));
  }

  private toAssignedDoc(doc: IClinicalSubDoc): IClinicalSubAssignedDoc {
    const { candidate, supervisor, ...rest } = doc;
    return {
      ...rest,
      candidate: candidate ? toCensoredCand(candidate as ICandDoc) : undefined,
      supervisor: supervisor ? toCensoredSupervisor(supervisor as ISupervisorDoc) : undefined,
    };
  }

  /** Returns updated item with censored candidate and supervisor (no password, email, phone). */
  public async update(validatedReq: IClinicalSubUpdateInput, dataSource: DataSource): Promise<IClinicalSubAssignedDoc | null> {
    const { id, ...updateData } = validatedReq;
    if (updateData.candDocId !== undefined) {
      await this.validateCandidateExists(updateData.candDocId, dataSource);
    }
    if (updateData.supervisorDocId !== undefined) {
      await this.validateSupervisorExists(updateData.supervisorDocId, dataSource);
    }
    const existing = await this.clinicalSubService.getById(id, dataSource);
    const previousStatus = existing?.subStatus;
    const payload: Parameters<ClinicalSubService["update"]>[1] = {};
    if (updateData.candDocId !== undefined) payload.candDocId = updateData.candDocId;
    if (updateData.supervisorDocId !== undefined) payload.supervisorDocId = updateData.supervisorDocId;
    if (updateData.dateCA !== undefined) payload.dateCA = new Date(updateData.dateCA);
    if (updateData.typeCA !== undefined) payload.typeCA = updateData.typeCA;
    if (updateData.subStatus !== undefined) payload.subStatus = updateData.subStatus;
    if (updateData.description !== undefined) payload.description = updateData.description;
    if (updateData.review !== undefined) payload.review = updateData.review;
    if (updateData.reviewedAt !== undefined) payload.reviewedAt = updateData.reviewedAt;
    const updated = await this.clinicalSubService.update(id, payload, dataSource);
    if (updated && updateData.subStatus && (updateData.subStatus === "approved" || updateData.subStatus === "rejected")) {
      const statusChanged = previousStatus !== updateData.subStatus;
      if (statusChanged) {
        void this.sendCandidateClinicalSubReviewEmail(updated, updateData.subStatus, updateData.review ?? undefined);
      }
    }
    return updated ? this.toAssignedDoc(updated) : null;
  }

  private async validateCandidateExists(candidateId: string, dataSource: DataSource): Promise<void> {
    if (!UUID_REGEX.test(candidateId)) {
      throw new Error("Invalid candidate ID format");
    }
    const candidate = await this.candService.getCandById(candidateId, dataSource);
    if (!candidate) {
      throw new Error(`Candidate with ID '${candidateId}' not found`);
    }
  }

  private async validateSupervisorExists(supervisorId: string, dataSource: DataSource): Promise<void> {
    if (!UUID_REGEX.test(supervisorId)) {
      throw new Error("Invalid supervisor ID format");
    }
    const supervisor = await this.supervisorService.getSupervisorById({ id: supervisorId }, dataSource);
    if (!supervisor) {
      throw new Error(`Supervisor with ID '${supervisorId}' not found`);
    }
  }

  /**
   * Send "new clinical sub to review" email to supervisor. Runs in background; do not await.
   */
  private async sendSupervisorNewClinicalSubEmail(
    savedSub: IClinicalSubDoc,
    dataSource: DataSource,
    institutionId?: string,
    supervisorDocId?: string
  ): Promise<void> {
    try {
      let supervisor = (savedSub as any).supervisor;
      if (!supervisor?.email && supervisorDocId) {
        const supervisorDoc = await this.supervisorService.getSupervisorById(
          { id: supervisorDocId },
          dataSource
        );
        if (supervisorDoc) supervisor = supervisorDoc;
      }
      if (supervisor?.email) {
        const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        const pathPart = `${CLINICAL_SUB_REVIEW_PATH}/${savedSub.id}`;
        const reviewLink = institutionId
          ? `${baseUrl}${pathPart}?institutionId=${encodeURIComponent(institutionId)}`
          : `${baseUrl}${pathPart}`;
        const supervisorName = (supervisor as ISupervisorDoc).fullName || "Supervisor";
        const candidate = (savedSub as any).candidate;
        const candidateName = (candidate as any)?.fullName || "A candidate";
        const shortId = savedSub.id.slice(0, 8);
        const subject = `Review clinical submission from ${candidateName} · ${shortId}`;
        const html = this.getSupervisorNewClinicalSubEmailHtml(
          supervisorName,
          candidateName,
          reviewLink,
          baseUrl,
          savedSub
        );
        const text = this.getSupervisorNewClinicalSubEmailText(
          supervisorName,
          candidateName,
          reviewLink,
          savedSub
        );
        await this.mailerService.sendMail({
          to: (supervisor as ISupervisorDoc).email,
          subject,
          html,
          text,
        });
      } else {
        console.warn(
          "[ClinicalSubProvider] New clinical sub: No email sent to supervisor - supervisor not found or has no email",
          { clinicalSubId: savedSub.id, supervisorDocId }
        );
      }
    } catch (err: any) {
      console.error("[ClinicalSubProvider] New clinical sub: Failed to send email to supervisor", {
        clinicalSubId: savedSub.id,
        error: err?.message ?? String(err),
      });
    }
  }

  /**
   * Send "clinical sub approved/rejected" email to candidate. Runs in background; do not await.
   */
  private async sendCandidateClinicalSubReviewEmail(
    fullyPopulated: IClinicalSubDoc,
    status: "approved" | "rejected",
    review?: string
  ): Promise<void> {
    try {
      const candidate = (fullyPopulated as any).candidate;
      const supervisor = (fullyPopulated as any).supervisor;
      if (candidate && (candidate as ICandDoc).email) {
        const candidateEmail = (candidate as ICandDoc).email;
        const candidateName = (candidate as ICandDoc).fullName || "Candidate";
        const supervisorName = supervisor && (supervisor as ISupervisorDoc).fullName ? (supervisor as ISupervisorDoc).fullName : "Supervisor";
        const subject = `Clinical submission ${status === "approved" ? "Approved" : "Rejected"}`;
        const html = this.getClinicalSubReviewEmailHtml(candidateName, supervisorName, fullyPopulated, status, review);
        const text = this.getClinicalSubReviewEmailText(candidateName, supervisorName, fullyPopulated, status, review);
        await this.mailerService.sendMail({
          to: candidateEmail,
          subject,
          html,
          text,
        });
      } else {
        console.warn("[ClinicalSubProvider] Clinical sub review: No email sent - candidate not populated or has no email", {
          clinicalSubId: fullyPopulated.id,
        });
      }
    } catch (err: any) {
      console.error("[ClinicalSubProvider] Clinical sub review: Failed to send email to candidate", {
        clinicalSubId: fullyPopulated.id,
        error: err?.message ?? String(err),
      });
    }
  }

  private getSupervisorNewClinicalSubEmailHtml(
    supervisorName: string,
    candidateName: string,
    reviewLink: string,
    _baseUrl: string,
    sub: IClinicalSubDoc
  ): string {
    const dateStr = sub.dateCA ? new Date(sub.dateCA).toLocaleDateString(undefined, { dateStyle: "medium" }) : "—";
    const typeCA = sub.typeCA ?? "—";
    const desc = sub.description ? sub.description.slice(0, 200) + (sub.description.length > 200 ? "…" : "") : "—";
    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Review clinical submission</title></head>
<body style="margin:0; padding:0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 1rem; line-height: 1.5; color: #4b5563; background-color: #eff6ff;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #eff6ff;">
    <tr><td style="padding: 32px 20px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 448px; margin: 0 auto;">
        <tr><td style="padding: 0 0 16px; text-align: center;"><span style="display: inline-block; padding: 8px 16px; background-color: #dbeafe; color: #1d4ed8; font-size: 0.875rem; font-weight: 600; border-radius: 9999px;">LibelusPro</span></td></tr>
        <tr><td style="padding: 0 0 8px; font-size: 1.5rem; font-weight: 700; color: #111827; text-align: center;">New clinical submission to review</td></tr>
        <tr><td style="padding: 24px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 0.5rem; box-shadow: 0 1px 3px 0 rgba(0,0,0,0.1);">
          <p style="margin: 0 0 16px;">Dear ${supervisorName},</p>
          <p style="margin: 0 0 20px;">A candidate has submitted a clinical activity for your approval. Please review the details below and take action when convenient.</p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 0 0 20px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 0.5rem;">
            <tr><td style="padding: 12px 16px 8px; font-size: 0.875rem; font-weight: 600; color: #374151;">Submission details</td></tr>
            <tr><td style="padding: 0 16px 16px;">
              <p style="margin: 4px 0; font-size: 0.875rem;"><span style="color: #6b7280;">Candidate:</span> ${candidateName}</p>
              <p style="margin: 4px 0; font-size: 0.875rem;"><span style="color: #6b7280;">Date:</span> ${dateStr}</p>
              <p style="margin: 4px 0; font-size: 0.875rem;"><span style="color: #6b7280;">Type:</span> ${typeCA}</p>
              <p style="margin: 4px 0; font-size: 0.875rem;"><span style="color: #6b7280;">Description:</span> ${desc}</p>
            </td></tr>
          </table>
          <p style="margin: 0 0 16px;"><a href="${reviewLink}" style="display: inline-block; padding: 10px 20px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 0.375rem; font-weight: 500;">Review submission</a></p>
          <p style="margin: 0; font-size: 0.75rem; color: #9ca3af;">This is an automated message. Please do not reply to this email.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }

  private getSupervisorNewClinicalSubEmailText(
    supervisorName: string,
    candidateName: string,
    reviewLink: string,
    sub: IClinicalSubDoc
  ): string {
    const dateStr = sub.dateCA ? new Date(sub.dateCA).toLocaleDateString(undefined, { dateStyle: "medium" }) : "—";
    const typeCA = sub.typeCA ?? "—";
    const desc = sub.description ? sub.description.slice(0, 200) + (sub.description.length > 200 ? "…" : "") : "—";
    return [
      `Dear ${supervisorName},`,
      "",
      "A candidate has submitted a clinical activity for your approval.",
      "",
      `Candidate: ${candidateName}`,
      `Date: ${dateStr}`,
      `Type: ${typeCA}`,
      `Description: ${desc}`,
      "",
      `Review: ${reviewLink}`,
      "",
      "This is an automated message. Please do not reply to this email.",
    ].join("\n");
  }

  private getClinicalSubReviewEmailHtml(
    candidateName: string,
    supervisorName: string,
    sub: IClinicalSubDoc,
    status: "approved" | "rejected",
    review?: string
  ): string {
    const statusText = status === "approved" ? "Approved" : "Rejected";
    const statusBg = status === "approved" ? "#d1fae5" : "#fee2e2";
    const statusFg = status === "approved" ? "#047857" : "#b91c1c";
    const dateStr = sub.dateCA ? new Date(sub.dateCA).toLocaleDateString(undefined, { dateStyle: "medium" }) : "—";
    const typeCA = sub.typeCA ?? "—";
    const desc = sub.description || "—";
    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Clinical submission ${statusText}</title></head>
<body style="margin:0; padding:0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 1rem; line-height: 1.5; color: #4b5563; background-color: #eff6ff;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #eff6ff;">
    <tr><td style="padding: 32px 20px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 448px; margin: 0 auto;">
        <tr><td style="padding: 0 0 16px; text-align: center;"><span style="display: inline-block; padding: 8px 16px; background-color: #dbeafe; color: #1d4ed8; font-size: 0.875rem; font-weight: 600; border-radius: 9999px;">LibelusPro</span></td></tr>
        <tr><td style="padding: 0 0 8px; font-size: 1.5rem; font-weight: 700; color: #111827; text-align: center;">Clinical submission ${statusText}</td></tr>
        <tr><td style="padding: 24px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 0.5rem;">
          <p style="margin: 0 0 16px;">Dear ${candidateName},</p>
          <p style="margin: 0 0 16px;">Your clinical submission has been <strong style="color: ${statusFg}; background-color: ${statusBg}; padding: 2px 8px; border-radius: 4px;">${statusText.toLowerCase()}</strong> by ${supervisorName}.</p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 0 0 16px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 0.5rem;">
            <tr><td style="padding: 12px 16px;">
              <p style="margin: 4px 0; font-size: 0.875rem;"><span style="color: #6b7280;">Date:</span> ${dateStr}</p>
              <p style="margin: 4px 0; font-size: 0.875rem;"><span style="color: #6b7280;">Type:</span> ${typeCA}</p>
              <p style="margin: 4px 0; font-size: 0.875rem;"><span style="color: #6b7280;">Description:</span> ${desc}</p>
              ${review ? `<p style="margin: 8px 0 0; font-size: 0.875rem;"><span style="color: #6b7280;">Review:</span> ${review}</p>` : ""}
            </td></tr>
          </table>
          <p style="margin: 0; font-size: 0.75rem; color: #9ca3af;">This is an automated message. Please do not reply.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }

  private getClinicalSubReviewEmailText(
    candidateName: string,
    supervisorName: string,
    sub: IClinicalSubDoc,
    status: "approved" | "rejected",
    review?: string
  ): string {
    const statusText = status === "approved" ? "Approved" : "Rejected";
    const dateStr = sub.dateCA ? new Date(sub.dateCA).toLocaleDateString(undefined, { dateStyle: "medium" }) : "—";
    const typeCA = sub.typeCA ?? "—";
    const desc = sub.description || "—";
    const lines = [
      `Dear ${candidateName},`,
      "",
      `Your clinical submission has been ${statusText.toLowerCase()} by ${supervisorName}.`,
      "",
      `Date: ${dateStr}`,
      `Type: ${typeCA}`,
      `Description: ${desc}`,
    ];
    if (review) lines.push("", `Review: ${review}`);
    lines.push("", "This is an automated message. Please do not reply.");
    return lines.join("\n");
  }
}
