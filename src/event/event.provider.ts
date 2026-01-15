import { inject, injectable } from "inversify";
import { EventService } from "./event.service";
import {
  IEvent,
  IEventDoc,
  IEventInput,
  IEventUpdateInput,
  TEventType,
  TEventStatus,
  IAddAttendanceInput,
  IRemoveAttendanceInput,
  IFlagAttendanceInput,
  IUnflagAttendanceInput,
  IEventAttendance,
} from "./event.interface";
import { UtilService } from "../utils/utils.service";
import { LectureService } from "../lecture/lecture.service";
import { JournalService } from "../journal/journal.service";
import { ConfService } from "../conf/conf.service";
import { SupervisorService } from "../supervisor/supervisor.service";
import { CandService } from "../cand/cand.service";
import { ExternalService } from "../externalService/external.service";
import { IGoogleRes } from "../externalService/interfaces/IGoogleRes.interface";
import { Types } from "mongoose";

@injectable()
export class EventProvider {
  constructor(
    @inject(EventService) private eventService: EventService,
    @inject(UtilService) private utilService: UtilService,
    @inject(LectureService) private lectureService: LectureService,
    @inject(JournalService) private journalService: JournalService,
    @inject(ConfService) private confService: ConfService,
    @inject(SupervisorService) private supervisorService: SupervisorService,
    @inject(CandService) private candService: CandService,
    @inject(ExternalService) private externalService: ExternalService
  ) {}

  public async createEvent(validatedReq: IEventInput): Promise<IEventDoc> | never {
    try {
      // Validate type and referenced document
      this.validateTypeAndRefs(validatedReq);
      await this.validateReferencedEntityExists(validatedReq);

      // Validate presenter based on type
      await this.validatePresenter(validatedReq.type, validatedReq.presenter.toString());

      // Validate location based on type
      this.validateLocation(validatedReq.type, validatedReq.location);

      // Process attendance: convert to new structure if needed
      const processedAttendance: IEventAttendance[] = validatedReq.attendance
        ? validatedReq.attendance.map((att) => {
            // If it's already in new format, use it
            if (typeof att === "object" && "candidate" in att) {
              return att as IEventAttendance;
            }
            // If it's old format (just ObjectId), convert it
            // Note: This handles backward compatibility
            return {
              candidate: att as Types.ObjectId,
              addedBy: new Types.ObjectId(), // Will be set by admin creating event
              addedByRole: "instituteAdmin",
              flagged: false,
              points: 1,
              createdAt: new Date(),
            };
          })
        : [];

      // Validate attendance candidate IDs
      this.validateAttendanceIds(processedAttendance);

      const processedData: IEvent = {
        type: validatedReq.type,
        lecture: validatedReq.lecture,
        journal: validatedReq.journal,
        conf: validatedReq.conf,
        dateTime: validatedReq.dateTime,
        location: this.utilService.stringToLowerCaseTrim(validatedReq.location),
        presenter: validatedReq.presenter,
        attendance: processedAttendance,
        status: validatedReq.status || "booked", // Default to "booked" when created
      };

      return await this.eventService.createEvent(processedData);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getAllEvents(): Promise<IEventDoc[]> | never {
    try {
      return await this.eventService.getAllEvents();
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getEventById(id: string): Promise<IEventDoc | null> | never {
    try {
      return await this.eventService.getEventById(id);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async updateEvent(
    validatedReq: IEventUpdateInput
  ): Promise<IEventDoc | null> | never {
    try {
      const { id, ...updateData } = validatedReq;

      const updateFields: Partial<IEvent> = {};

      if (updateData.type !== undefined) {
        updateFields.type = updateData.type;
      }

      if (updateData.lecture !== undefined) {
        updateFields.lecture = updateData.lecture;
      }

      if (updateData.journal !== undefined) {
        updateFields.journal = updateData.journal;
      }

      if (updateData.conf !== undefined) {
        updateFields.conf = updateData.conf;
      }

      // Get current event state for validation (needed for status and dateTime validation)
      const currentEvent = await this.eventService.getEventById(id);
      if (!currentEvent) {
        throw new Error("Event not found");
      }

      if (updateData.dateTime !== undefined) {
        // Business rule: Cannot change date of an event that has already been held
        if (currentEvent.status === "held") {
          throw new Error("Cannot change date of an event that has already been held");
        }

        // Validate dateTime is a valid date (additional check beyond ISO8601 validator)
        const newDateTime = new Date(updateData.dateTime);
        if (isNaN(newDateTime.getTime())) {
          throw new Error("Invalid dateTime format. Expected ISO 8601 format.");
        }

        updateFields.dateTime = updateData.dateTime;
      }

      if (updateData.location !== undefined) {
        // Validate location based on event type (use merged type for validation)
        const mergedType = updateData.type !== undefined 
          ? updateData.type 
          : currentEvent.type;
        
        if (mergedType) {
          this.validateLocation(mergedType, updateData.location);
        }
        
        updateFields.location = this.utilService.stringToLowerCaseTrim(
          updateData.location
        );
      }

      if (updateData.presenter !== undefined) {
        updateFields.presenter = updateData.presenter;
      }

      let processedAttendance: IEventAttendance[] | undefined;

      if (updateData.attendance !== undefined) {
        // Process attendance: convert to new structure if needed
        processedAttendance = updateData.attendance.map((att) => {
          // If it's already in new format, use it
          if (typeof att === "object" && "candidate" in att) {
            return att as IEventAttendance;
          }
          // If it's old format (just ObjectId), convert it
          return {
            candidate: att as Types.ObjectId,
            addedBy: new Types.ObjectId(), // Will be set by admin updating event
            addedByRole: "instituteAdmin",
            flagged: false,
            points: 1,
            createdAt: new Date(),
          };
        });
        
        updateFields.attendance = processedAttendance;
        
        // Auto-update status based on attendance:
        // - If attendance has attendees, set status to "held"
        // - If attendance is empty and event date has passed, set status to "canceled"
        // - Otherwise, keep current status or default to "booked"
        if (processedAttendance.length > 0) {
          updateFields.status = "held";
        } else {
          // Check if event date has passed
          if (currentEvent.dateTime < new Date()) {
            updateFields.status = "canceled";
          }
        }
      }

      if (updateData.status !== undefined) {
        // Validate status change based on attendance rules
        // Use updated attendance if provided, otherwise use current attendance
        const attendanceToCheck = processedAttendance !== undefined
          ? processedAttendance
          : currentEvent.attendance;
        
        this.validateStatusChange(attendanceToCheck, updateData.status);
        updateFields.status = updateData.status;
      }

      // If type or refs or presenter/attendance changed, re-validate
      const merged: IEventInput = {
        ...(await this.buildCurrentEventState(id)),
        ...updateFields,
      };

      this.validateTypeAndRefs(merged);
      await this.validateReferencedEntityExists(merged);
      await this.validatePresenter(merged.type, merged.presenter.toString());
      this.validateLocation(merged.type, merged.location);
      this.validateAttendanceIds(merged.attendance);

      return await this.eventService.updateEvent(id, updateFields);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async addAttendance(validatedReq: IAddAttendanceInput): Promise<IEventDoc> | never {
    try {
      // Validate event exists
      const event = await this.eventService.getEventById(validatedReq.eventId);
      if (!event) {
        throw new Error("Event not found");
      }

      // Validate candidate exists
      const candidate = await this.candService.getCandById(validatedReq.candidateId);
      if (!candidate) {
        throw new Error("Candidate not found");
      }

      // Validate IDs
      if (!Types.ObjectId.isValid(validatedReq.eventId) || 
          !Types.ObjectId.isValid(validatedReq.candidateId) ||
          !Types.ObjectId.isValid(validatedReq.addedBy)) {
        throw new Error("Invalid event, candidate, or user ID");
      }

      const result = await this.eventService.addAttendance(
        validatedReq.eventId,
        validatedReq.candidateId,
        validatedReq.addedBy,
        validatedReq.addedByRole
      );
      if (!result) {
        throw new Error("Failed to add attendance");
      }
      return result;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async removeAttendance(validatedReq: IRemoveAttendanceInput): Promise<IEventDoc> | never {
    try {
      // Validate event exists
      const event = await this.eventService.getEventById(validatedReq.eventId);
      if (!event) {
        throw new Error("Event not found");
      }

      // Validate IDs
      if (!Types.ObjectId.isValid(validatedReq.eventId) || 
          !Types.ObjectId.isValid(validatedReq.candidateId)) {
        throw new Error("Invalid event or candidate ID");
      }

      const result = await this.eventService.removeAttendance(
        validatedReq.eventId,
        validatedReq.candidateId
      );
      if (!result) {
        throw new Error("Failed to remove attendance");
      }
      return result;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async flagAttendance(validatedReq: IFlagAttendanceInput): Promise<IEventDoc> | never {
    try {
      // Validate event exists
      const event = await this.eventService.getEventById(validatedReq.eventId);
      if (!event) {
        throw new Error("Event not found");
      }

      // Validate IDs
      if (!Types.ObjectId.isValid(validatedReq.eventId) || 
          !Types.ObjectId.isValid(validatedReq.candidateId) ||
          !Types.ObjectId.isValid(validatedReq.flaggedBy)) {
        throw new Error("Invalid event, candidate, or user ID");
      }

      const result = await this.eventService.flagAttendance(
        validatedReq.eventId,
        validatedReq.candidateId,
        validatedReq.flaggedBy
      );
      if (!result) {
        throw new Error("Failed to flag attendance");
      }
      return result;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async unflagAttendance(validatedReq: IUnflagAttendanceInput): Promise<IEventDoc> | never {
    try {
      // Validate event exists
      const event = await this.eventService.getEventById(validatedReq.eventId);
      if (!event) {
        throw new Error("Event not found");
      }

      // Validate IDs
      if (!Types.ObjectId.isValid(validatedReq.eventId) || 
          !Types.ObjectId.isValid(validatedReq.candidateId)) {
        throw new Error("Invalid event or candidate ID");
      }

      const result = await this.eventService.unflagAttendance(
        validatedReq.eventId,
        validatedReq.candidateId
      );
      if (!result) {
        throw new Error("Failed to unflag attendance");
      }
      return result;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getCandidateTotalPoints(candidateId: string): Promise<number> | never {
    try {
      if (!Types.ObjectId.isValid(candidateId)) {
        throw new Error("Invalid candidate ID");
      }

      return await this.eventService.getCandidateTotalPoints(candidateId);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async deleteEvent(id: string): Promise<boolean> | never {
    try {
      return await this.eventService.deleteEvent(id);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  /** Helper: get current event state (for validation during update) */
  private async buildCurrentEventState(id: string): Promise<IEventInput> | never {
    const existing = await this.eventService.getEventById(id);
    if (!existing) {
      throw new Error("Event not found");
    }

    return {
      type: existing.type,
      lecture: existing.lecture,
      journal: existing.journal,
      conf: existing.conf,
      dateTime: existing.dateTime,
      location: existing.location,
      presenter: existing.presenter,
      attendance: existing.attendance,
      status: existing.status,
    };
  }

  /** Helper: basic type and reference validation */
  private validateTypeAndRefs(event: IEventInput): void | never {
    const { type, lecture, journal, conf } = event;

    if (!type) {
      throw new Error("event type is required");
    }

    if (type === "lecture") {
      if (!lecture) {
        throw new Error("lecture reference is required for lecture events");
      }
    } else if (type === "journal") {
      if (!journal) {
        throw new Error("journal reference is required for journal events");
      }
    } else if (type === "conf") {
      if (!conf) {
        throw new Error("conf reference is required for conf events");
      }
    }
  }

  /** Helper: validate referenced lecture/journal/conf exists */
  private async validateReferencedEntityExists(event: IEventInput): Promise<void> {
    const { type, lecture, journal, conf } = event;

    if (type === "lecture" && lecture) {
      const lectureDoc = await this.lectureService.getLectureById(
        lecture.toString()
      );
      if (!lectureDoc) {
        throw new Error(`Lecture with ID '${lecture}' not found`);
      }
    }

    if (type === "journal" && journal) {
      const journalDoc = await this.journalService.getJournalById(
        journal.toString()
      );
      if (!journalDoc) {
        throw new Error(`Journal with ID '${journal}' not found`);
      }
    }

    if (type === "conf" && conf) {
      const confDoc = await this.confService.getConfById(conf.toString());
      if (!confDoc) {
        throw new Error(`Conf with ID '${conf}' not found`);
      }
    }
  }

  /** Helper: validate presenter based on event type */
  private async validatePresenter(
    type: TEventType,
    presenterId: string
  ): Promise<void> {
    if (!Types.ObjectId.isValid(presenterId)) {
      throw new Error("Invalid presenter ID format");
    }

    if (type === "lecture" || type === "conf") {
      const supervisor = await this.supervisorService.getSupervisorById({
        id: presenterId,
      });
      if (!supervisor) {
        throw new Error(`Supervisor presenter with ID '${presenterId}' not found`);
      }
    } else if (type === "journal") {
      const cand = await this.candService.getCandById(presenterId);
      if (!cand) {
        throw new Error(`Candidate presenter with ID '${presenterId}' not found`);
      }
    }
  }

  /** Helper: validate attendance candidate IDs */
  private validateAttendanceIds(attendance: IEventAttendance[]): void {
    if (!attendance) return;

    for (const att of attendance) {
      if (!att.candidate || !Types.ObjectId.isValid(att.candidate.toString())) {
        throw new Error(`Invalid candidate ID in attendance: '${att.candidate}'`);
      }
      if (!att.addedBy || !Types.ObjectId.isValid(att.addedBy.toString())) {
        throw new Error(`Invalid addedBy ID in attendance: '${att.addedBy}'`);
      }
      if (!["instituteAdmin", "supervisor", "candidate"].includes(att.addedByRole)) {
        throw new Error(`Invalid addedByRole in attendance: '${att.addedByRole}'`);
      }
    }
  }

  /** Helper: validate location based on event type */
  private validateLocation(type: TEventType, location: string): void | never {
    if (!location) {
      throw new Error("location is required");
    }

    const normalizedLocation = location.trim().toLowerCase();

    if (type === "lecture" || type === "journal") {
      // For lecture and journal: location must be "Dept" or "Online"
      if (normalizedLocation !== "dept" && normalizedLocation !== "online") {
        throw new Error(
          `Location for ${type} events must be either "Dept" or "Online". Received: "${location}"`
        );
      }
    }
    // For conf: location can be any string (no validation needed)
  }

  /**
   * Validates status change based on attendance rules:
   * - Rule 1: Events with unflagged candidates can only be "held"
   * - Rule 2: Events with no candidates can only be "booked" or "canceled" (not "held")
   * - Rule 3: Events with only flagged candidates can have any status
   */
  private validateStatusChange(
    attendance: IEventAttendance[],
    newStatus: TEventStatus
  ): void | never {
    // Handle null/undefined attendance
    const attendanceArray = attendance || [];

    // Check if there are any unflagged candidates
    const hasUnflaggedCandidates = attendanceArray.some(
      (att) => att.flagged === false
    );

    // Check if there are only flagged candidates (or no candidates)
    const hasOnlyFlaggedCandidates =
      attendanceArray.length > 0 &&
      attendanceArray.every((att) => att.flagged === true);

    const hasNoCandidates = attendanceArray.length === 0;

    // Rule 1: Unflagged candidates → must be "held"
    if (hasUnflaggedCandidates && newStatus !== "held") {
      throw new Error(
        'Cannot change status: Event has unflagged candidates and must remain as "held"'
      );
    }

    // Rule 2: No candidates → can only be "booked" or "canceled"
    if (hasNoCandidates && newStatus === "held") {
      throw new Error(
        'Cannot change status to "held": Event has no candidates. Allowed statuses: "booked" or "canceled"'
      );
    }

    // Rule 3: Only flagged candidates → all statuses allowed (no validation needed)
    // This case passes through without restrictions
  }

  /**
   * Bulk import attendance from external spreadsheet
   * Spreadsheet: lectureRegistrationRes, Sheet: "Form Responses 1"
   * Column B: Candidate Email Address
   * Column C: Lecture, Journal, or Conf UID
   * 
   * Optimized with batch operations for O(n) time complexity instead of O(n*m)
   */
  public async bulkImportAttendanceFromExternal(
    addedBy: string,
    addedByRole: "instituteAdmin" | "supervisor" | "candidate"
  ): Promise<{
    totalRows: number;
    processed: number;
    added: number;
    skipped: number;
    errors: Array<{ row: number; email: string; uid: string; reason: string }>;
  }> | never {
    try {
      // Build API string to fetch spreadsheet data
      const apiString = `${process.env.GETTER_API_ENDPOINT}?spreadsheetName=${encodeURIComponent(
        "lectureRegistrationRes"
      )}&sheetName=${encodeURIComponent("Form Responses 1")}`;

      // Fetch external data
      const externalData: IGoogleRes = await this.externalService.fetchExternalData(apiString);

      if (!externalData.success) {
        throw new Error("Failed to fetch external data from spreadsheet");
      }

      const rows = externalData.data.data;
      const totalRows = rows.length;
      let processed = 0;
      let added = 0;
      let skipped = 0;
      const errors: Array<{ row: number; email: string; uid: string; reason: string }> = [];

      // Step 1: Parse all rows and collect unique emails and UIDs
      interface ParsedRow {
        rowNumber: number;
        email: string;
        uid: string;
      }
      const parsedRows: ParsedRow[] = [];
      const uniqueEmails = new Set<string>();
      const uniqueUids = new Set<string>();

      const startIndex = 1; // Skip header row
      for (let i = startIndex; i < rows.length; i++) {
        const row = rows[i];
        const rowNumber = i + 1;

        try {
          let candidateEmail: string | undefined;
          let uid: string | undefined;

          if (Array.isArray(row)) {
            candidateEmail = row[1]?.trim();
            uid = row[2]?.trim();
          } else {
            const headers = externalData.data.headers || [];
            if (headers.length >= 3) {
              candidateEmail = row[headers[1]]?.trim();
              uid = row[headers[2]]?.trim();
            } else {
              const keys = Object.keys(row);
              if (keys.length >= 3) {
                candidateEmail = row[keys[1]]?.trim();
                uid = row[keys[2]]?.trim();
              }
            }
          }

          if (!candidateEmail || !uid || candidateEmail === "" || uid === "") {
            skipped++;
            errors.push({
              row: rowNumber,
              email: candidateEmail || "N/A",
              uid: uid || "N/A",
              reason: "Missing email or UID",
            });
            continue;
          }

          parsedRows.push({ rowNumber, email: candidateEmail, uid });
          uniqueEmails.add(candidateEmail);
          uniqueUids.add(uid);
        } catch (err: any) {
          skipped++;
          errors.push({
            row: rowNumber,
            email: "N/A",
            uid: "N/A",
            reason: err.message || "Error parsing row",
          });
        }
      }

      // Step 2: Batch fetch all candidates, lectures, journals, and confs
      const [candidates, lectures, journals, confs] = await Promise.all([
        this.candService.findCandidatesByEmails(Array.from(uniqueEmails)),
        this.lectureService.findLecturesByGoogleUids(Array.from(uniqueUids)),
        this.journalService.findJournalsByGoogleUids(Array.from(uniqueUids)),
        this.confService.findConfsByGoogleUids(Array.from(uniqueUids)),
      ]);

      // Step 3: Build in-memory maps for O(1) lookups
      const candidateMap = new Map<string, any>();
      for (const cand of candidates) {
        candidateMap.set(cand.email.toLowerCase(), cand);
      }

      const lectureMap = new Map<string, any>();
      for (const lecture of lectures) {
        lectureMap.set(lecture.google_uid, lecture);
      }

      const journalMap = new Map<string, any>();
      for (const journal of journals) {
        journalMap.set(journal.google_uid, journal);
      }

      const confMap = new Map<string, any>();
      for (const conf of confs) {
        confMap.set(conf.google_uid, conf);
      }

      // Step 4: Collect all resource IDs (lecture/journal/conf) to batch fetch events
      const lectureIds: Types.ObjectId[] = [];
      const journalIds: Types.ObjectId[] = [];
      const confIds: Types.ObjectId[] = [];
      const uidToResourceType = new Map<string, "lecture" | "journal" | "conf">();

      for (const parsedRow of parsedRows) {
        const uid = parsedRow.uid;
        if (lectureMap.has(uid)) {
          const lecture = lectureMap.get(uid);
          lectureIds.push(lecture._id);
          uidToResourceType.set(uid, "lecture");
        } else if (journalMap.has(uid)) {
          const journal = journalMap.get(uid);
          journalIds.push(journal._id);
          uidToResourceType.set(uid, "journal");
        } else if (confMap.has(uid)) {
          const conf = confMap.get(uid);
          confIds.push(conf._id);
          uidToResourceType.set(uid, "conf");
        }
      }

      // Step 5: Batch fetch all events
      const eventMap = await this.eventService.findEventsByLectureJournalConfIds(
        lectureIds,
        journalIds,
        confIds
      );

      // Step 6: Process all rows using the maps
      for (const parsedRow of parsedRows) {
        processed++;
        const { rowNumber, email, uid } = parsedRow;

        try {
          // Find candidate
          const candidate = candidateMap.get(email.toLowerCase());
          if (!candidate) {
            skipped++;
            errors.push({
              row: rowNumber,
              email,
              uid,
              reason: "Candidate not found in database",
            });
            continue;
          }

          // Find resource (lecture/journal/conf) by UID
          const resourceType = uidToResourceType.get(uid);
          if (!resourceType) {
            skipped++;
            errors.push({
              row: rowNumber,
              email,
              uid,
              reason: "Lecture, Journal, or Conf not found with this UID",
            });
            continue;
          }

          // Get resource ID
          let resourceId: Types.ObjectId | null = null;
          if (resourceType === "lecture") {
            resourceId = lectureMap.get(uid)?._id;
          } else if (resourceType === "journal") {
            resourceId = journalMap.get(uid)?._id;
          } else if (resourceType === "conf") {
            resourceId = confMap.get(uid)?._id;
          }

          if (!resourceId) {
            skipped++;
            errors.push({
              row: rowNumber,
              email,
              uid,
              reason: "Resource ID not found",
            });
            continue;
          }

          // Find event by resource ID
          const event = eventMap.get(resourceId.toString());
          if (!event) {
            skipped++;
            errors.push({
              row: rowNumber,
              email,
              uid,
              reason: "Event not found for this Lecture/Journal/Conf",
            });
            continue;
          }

          // Check if candidate is already in attendance
          const isAlreadyRegistered = event.attendance.some(
            (att) => att.candidate.toString() === candidate._id.toString()
          );

          if (isAlreadyRegistered) {
            skipped++;
            errors.push({
              row: rowNumber,
              email,
              uid,
              reason: "Candidate already registered for this event",
            });
            continue;
          }

          // Add candidate to attendance
          await this.eventService.addAttendance(
            event._id.toString(),
            candidate._id.toString(),
            addedBy,
            addedByRole
          );

          added++;
        } catch (err: any) {
          skipped++;
          errors.push({
            row: rowNumber,
            email,
            uid,
            reason: err.message || "Unknown error",
          });
        }
      }

      return {
        totalRows,
        processed,
        added,
        skipped,
        errors,
      };
    } catch (err: any) {
      throw new Error(err);
    }
  }
}


