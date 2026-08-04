import { inject, injectable } from "inversify";
import { DataSource } from "typeorm";
import { UtilService } from "../utils/utils.service";
import { IExternalRow } from "../types/externalRow.interface";
import { ExternalService } from "../externalService/external.service";
import { ICand, ICandDoc } from "./cand.interface";
import { CandidateEntity } from "./cand.mDbSchema";
import { SupervisorEntity } from "../supervisor/supervisor.mDbSchema";
import { ISupervisorDoc } from "../supervisor/supervisor.interface";
import { SupervisorPosition } from "../types/supervisorPosition.types";
import { UserRole } from "../types/role.types";

/** Options an admin may set on the supervisor account created by a promotion. */
export type PromoteCandidateOptions = {
  position?: SupervisorPosition;
  canValidate?: boolean;
  canValClin?: boolean;
};

export type PromoteCandidateResult = {
  supervisor: ISupervisorDoc;
  archivedCandidateId: string;
  /** History that stays on the archived candidate row (nothing is moved). */
  carriedOver: {
    submissions: number;
    clinicalSubmissions: number;
    eventAttendance: number;
  };
  /** Work that was still pending and was closed out by the promotion. */
  autoApproved: {
    submissions: number;
    clinicalSubmissions: number;
  };
};

/** Stamped on rows the promotion approves, so the status change is never anonymous. */
const AUTO_APPROVE_NOTE = "Auto-approved on promotion to supervisor.";

/** Thrown with a stable `code` so the router can map it to the right HTTP status. */
export class PromoteCandidateError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

@injectable()
export class CandProvider {
  constructor(
    @inject(UtilService) private utilsService: UtilService,
    @inject(ExternalService) private externalService: ExternalService
  ) {}

  /**
   * Promote a candidate to supervisor after a real-life promotion
   * (docs/CANDIDATE_TO_SUPERVISOR_PROMOTION_PLAN.md).
   *
   * The candidate row is NOT deleted or repointed: submissions/clinical_sub reference it
   * ON DELETE RESTRICT and event_attendance ON DELETE CASCADE, so it is the anchor of his
   * whole logbook. Instead a supervisors row is created (same email + same bcrypt hash, so
   * he keeps his credentials) and the candidate row is archived and linked. His candidate
   * history stays exactly where it is and stays readable through the previous-logbook view.
   *
   * Promotion also CLOSES OUT his candidate logbook: every still-pending submission and
   * clinical submission is approved in the same transaction (rejected rows are left as
   * they are). He is no longer a candidate, so nothing of his should sit waiting in a
   * supervisor's review queue.
   */
  public async promoteToSupervisor(
    candidateId: string,
    options: PromoteCandidateOptions,
    dataSource: DataSource,
    adminDepartmentId?: string | null
  ): Promise<PromoteCandidateResult> {
    return dataSource.transaction(async (em) => {
      const candRepo = em.getRepository(CandidateEntity);
      const supRepo = em.getRepository(SupervisorEntity);

      const candidate = await candRepo.findOne({ where: { id: candidateId } });
      if (!candidate) {
        throw new PromoteCandidateError("not_found", "Candidate not found");
      }
      // Department-scoped institute admins may only promote their own department's people.
      if (adminDepartmentId && candidate.departmentId !== adminDepartmentId) {
        throw new PromoteCandidateError(
          "out_of_scope",
          "Candidate does not belong to your department"
        );
      }
      if (candidate.archivedAt || candidate.promotedToSupervisorId) {
        throw new PromoteCandidateError(
          "already_promoted",
          "This candidate has already been promoted to supervisor"
        );
      }

      // `supervisors.email` and `supervisors.phoneNum` are both UNIQUE: check first so the
      // admin gets a clear conflict instead of a raw constraint violation.
      const emailTaken = await supRepo
        .createQueryBuilder("s")
        .where("LOWER(TRIM(s.email)) = :email", { email: candidate.email.trim().toLowerCase() })
        .getOne();
      if (emailTaken) {
        throw new PromoteCandidateError(
          "supervisor_email_exists",
          "A supervisor account already exists for this email"
        );
      }
      const phoneTaken = await supRepo.findOne({ where: { phoneNum: candidate.phoneNum } });
      if (phoneTaken) {
        throw new PromoteCandidateError(
          "supervisor_phone_exists",
          "A supervisor account already exists for this phone number"
        );
      }

      const newSupervisor = supRepo.create({
        email: candidate.email,
        // Same hash: he keeps the password he already knows.
        password: candidate.password,
        fullName: candidate.fullName,
        phoneNum: candidate.phoneNum,
        departmentId: candidate.departmentId,
        approved: true,
        role: UserRole.SUPERVISOR,
        canValidate: options.canValidate ?? true,
        canValClin: options.canValClin ?? false,
        position: options.position ?? SupervisorPosition.UNKNOWN,
        ...(candidate.termsAcceptedAt ? { termsAcceptedAt: candidate.termsAcceptedAt } : {}),
      });
      const savedSupervisor = await supRepo.save(newSupervisor);

      await candRepo.update(candidate.id, {
        archivedAt: new Date(),
        promotedToSupervisorId: savedSupervisor.id,
      });

      // Close out his candidate logbook: everything still PENDING is approved by the
      // promotion itself. Rejected rows are left alone on purpose, a supervisor made that
      // call deliberately and the promotion must not silently reverse it.
      //
      // `reviewedBy` is deliberately NOT stamped. `activity_read_model` emits a supervisor
      // 'surgical_review' activity for every submission with both reviewedBy AND reviewedAt
      // set, so stamping a reviewer here would fabricate review activity that never
      // happened and inflate that supervisor's active-user counts. reviewedAt is filled
      // only where it was empty (COALESCE), so no existing review timestamp is moved.
      // The pending ids are SELECTed first and updated by id. `query()` on an UPDATE
      // returns [rows, affectedCount], so counting its result directly would always
      // report 2; a plain SELECT has no such ambiguity.
      const pendingSubIds: { id: string }[] = await em.query(
        `SELECT "id" FROM "submissions" WHERE "candDocId" = $1 AND "subStatus" = 'pending'`,
        [candidate.id]
      );
      if (pendingSubIds.length) {
        await em.query(
          `UPDATE "submissions"
              SET "subStatus" = 'approved',
                  "reviewedAt" = COALESCE("reviewedAt", now()),
                  "review" = COALESCE("review", $2)
            WHERE "id" = ANY($1::uuid[])`,
          [pendingSubIds.map((r) => r.id), AUTO_APPROVE_NOTE]
        );
      }

      // clinical_sub has no reviewedBy column: `activity_read_model` keys its
      // 'clinical_review' activity on supervisorDocId (always set) + reviewedAt, so
      // stamping reviewedAt HERE would fabricate a review for the assigned supervisor.
      // The status and the note are enough; reviewedAt stays NULL.
      const pendingClinicalIds: { id: string }[] = await em.query(
        `SELECT "id" FROM "clinical_sub" WHERE "candDocId" = $1 AND "subStatus" = 'pending'`,
        [candidate.id]
      );
      if (pendingClinicalIds.length) {
        await em.query(
          `UPDATE "clinical_sub"
              SET "subStatus" = 'approved',
                  "review" = COALESCE("review", $2)
            WHERE "id" = ANY($1::uuid[])`,
          [pendingClinicalIds.map((r) => r.id), AUTO_APPROVE_NOTE]
        );
      }

      const [subCounts] = await em.query(
        `SELECT count(*)::int AS total FROM "submissions" WHERE "candDocId" = $1`,
        [candidate.id]
      );
      const [clinicalCount] = await em.query(
        `SELECT count(*)::int AS total FROM "clinical_sub" WHERE "candDocId" = $1`,
        [candidate.id]
      );
      const [attendanceCount] = await em.query(
        `SELECT count(*)::int AS total FROM "event_attendance" WHERE "candidateId" = $1`,
        [candidate.id]
      );

      return {
        supervisor: savedSupervisor as unknown as ISupervisorDoc,
        archivedCandidateId: candidate.id,
        carriedOver: {
          submissions: subCounts?.total ?? 0,
          clinicalSubmissions: clinicalCount?.total ?? 0,
          eventAttendance: attendanceCount?.total ?? 0,
        },
        autoApproved: {
          submissions: pendingSubIds.length,
          clinicalSubmissions: pendingClinicalIds.length,
        },
      };
    });
  }

  /**
   * The archived candidate row a supervisor was promoted from, or null if this supervisor
   * was never a candidate. Backs the read-only previous-logbook view.
   */
  public async getPromotedFromCandidate(
    supervisorId: string,
    dataSource: DataSource
  ): Promise<ICandDoc | null> {
    const candRepo = dataSource.getRepository(CandidateEntity);
    const candidate = await candRepo.findOne({
      where: { promotedToSupervisorId: supervisorId },
    });
    return candidate as unknown as ICandDoc | null;
  }

  public async provideCandsFromExternal(
    validatedReq: Partial<IExternalRow>
  ): Promise<ICand[]> | never {
    try {
      let apiString: string;
      if (validatedReq.row) {
        apiString = `${process.env.GETTER_API_ENDPOINT}?spreadsheetName=candRegResponses&sheetName=Form%20Responses%201&row=${validatedReq.row}`;
      } else {
        apiString = `${process.env.GETTER_API_ENDPOINT}?spreadsheetName=candRegResponses&sheetName=Form%20Responses%201`;
      }
      const externalData = await this.externalService.fetchExternalData(
        apiString
      );
      if (!externalData?.success) {
        const message = (externalData?.data as { error?: string } | undefined)?.error ?? "External data fetch failed";
        throw new Error(message);
      }
      const rows = externalData?.data?.data;
      if (!Array.isArray(rows)) {
        return [];
      }
      const items: ICand[] = [];
      for (let i: number = 0; i < rows.length; i++) {
        const rawItem = rows[i];
        try {
          const normalizedItem: ICand = {
            timeStamp: this.utilsService.stringToDateConverter(
              rawItem["Timestamp"]
            ),
            email: String(rawItem["Email Address"] ?? "").trim(),
            password: `MEDscrobe01$`,
            fullName: this.utilsService.stringToLowerCaseTrim(
              rawItem["Full Name (as per ID)"]
            ),
            regNum: this.utilsService.numToStringTrim(
              rawItem["Registry Number (Medical Committee or College ID)"]
            ),
            phoneNum: rawItem["Phone Number"],
            nationality: this.utilsService.stringToLowerCaseTrim(
              rawItem["Nationality"]
            ),
            rank: this.utilsService.returnRankEnum(
              rawItem["Rank"]
            ),
            regDeg: this.utilsService.returnRegDegree(
              rawItem["Registered Degree  (Currently Enrolled Program)"]
            ),
            google_uid: (() => {
              const value = rawItem["Uuid"];
              if (!value || typeof value !== "string") {
                throw new Error(`Uuid is not a string. Value: ${value}, Type: ${typeof value}`);
              }
              return value.trim();
            })(),
            approved: this.utilsService.approvedToBoolean(
              rawItem["Approved"]
            ),
          };
          items.push(normalizedItem);
        } catch (fieldError: any) {
          console.error(`\n❌ [Row ${i + 1}] ERROR processing field:`, fieldError.message);
          console.error(`[Row ${i + 1}] Error stack:`, fieldError.stack);
          console.error(`[Row ${i + 1}] Full raw item that caused error:`, JSON.stringify(rawItem, null, 2));
          throw new Error(`Error processing row ${i + 1}: ${fieldError.message}`);
        }
      }
      return items;
    } catch (err: any) {
      throw new Error(err);
    }
  }
}
