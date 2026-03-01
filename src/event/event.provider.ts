import { inject, injectable } from "inversify";
import { DataSource } from "typeorm";
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
  ICandidateEventPointsResponse,
  IEventPointsItem,
  IEventPointsPresenter,
  IEventPointsEvent,
  TEventTypePublic,
} from "./event.interface";
import { UtilService } from "../utils/utils.service";
import { LectureService } from "../lecture/lecture.service";
import { JournalService } from "../journal/journal.service";
import { ConfService } from "../conf/conf.service";
import { SupervisorService } from "../supervisor/supervisor.service";
import { CandService } from "../cand/cand.service";
import { ExternalService } from "../externalService/external.service";
import { IGoogleRes } from "../externalService/interfaces/IGoogleRes.interface";
// Removed: import { Types } from "mongoose"; - Now using UUIDs directly for MariaDB

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

  public async createEvent(validatedReq: IEventInput, dataSource: DataSource): Promise<IEventDoc> | never {
    try {
      // Validate type and referenced document
      this.validateTypeAndRefs(validatedReq);
      await this.validateReferencedEntityExists(validatedReq, dataSource);

      // Validate presenter based on type
      const presenterId = validatedReq.presenter;
      await this.validatePresenter(validatedReq.type, presenterId, dataSource);

      // Validate location based on type
      this.validateLocation(validatedReq.type, validatedReq.location);

      // Process attendance: convert to new structure if needed
      const processedAttendance: IEventAttendance[] = validatedReq.attendance
        ? validatedReq.attendance.map((att: any) => {
            // Handle both old format (candidate: ObjectId) and new format (candidateId: string)
            let candidateId: string;
            if (typeof att === "object" && "candidateId" in att) {
              candidateId = att.candidateId;
            } else if (typeof att === "object" && "candidate" in att) {
              // Old format: candidate is ObjectId or string
              candidateId = typeof att.candidate === "string" ? att.candidate : (att.candidate?.toString() || String(att.candidate));
            } else {
              // Legacy: att is just an ID string or ObjectId
              candidateId = typeof att === "string" ? att : (att?.toString() || String(att));
            }

            return {
              candidateId,
              addedBy: (att as any).addedBy || "", // Will be set by admin creating event
              addedByRole: (att as any).addedByRole || "instituteAdmin",
              flagged: (att as any).flagged || false,
              flaggedBy: (att as any).flaggedBy,
              flaggedAt: (att as any).flaggedAt,
              points: (att as any).points || 1,
              createdAt: (att as any).createdAt || new Date(),
            };
          })
        : [];

      // Validate attendance candidate IDs
      this.validateAttendanceIds(processedAttendance);

      // Convert input fields to UUID-based fields
      const processedData: IEvent = {
        type: validatedReq.type,
        lectureId: validatedReq.lecture,
        journalId: validatedReq.journal,
        confId: validatedReq.conf,
        dateTime: validatedReq.dateTime,
        location: this.utilService.stringToLowerCaseTrim(validatedReq.location),
        presenterId: presenterId,
        status: validatedReq.status || "booked", // Default to "booked" when created
      };

      // Add attendance as separate property for service to handle
      const eventWithAttendance = {
        ...processedData,
        attendance: processedAttendance,
      } as any;

      return await this.eventService.createEvent(eventWithAttendance, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getAllEvents(dataSource: DataSource): Promise<IEventDoc[]> | never {
    try {
      return await this.eventService.getAllEvents(dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  /**
   * Dashboard: events from last 30 days through all future, stripped of createdAt and updatedAt
   */
  public async getEventsDashboard(dataSource: DataSource): Promise<any[]> | never {
    try {
      return await this.eventService.getEventsDashboard(dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  /**
   * Returns all events where the given supervisor ID was the presenter.
   * Includes aggregated attendance for each event.
   */
  public async getEventsByPresenter(supervisorId: string, dataSource: DataSource): Promise<any[]> | never {
    try {
      return await this.eventService.getEventsByPresenter(supervisorId, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getEventById(id: string, dataSource: DataSource): Promise<IEventDoc | null> | never {
    try {
      return await this.eventService.getEventById(id, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async updateEvent(
    validatedReq: IEventUpdateInput,
    dataSource: DataSource
  ): Promise<IEventDoc | null> | never {
    try {
      const { id, ...updateData } = validatedReq;

      const updateFields: Partial<IEvent> = {};

      if (updateData.type !== undefined) {
        updateFields.type = updateData.type;
      }

      // Convert input fields to UUID-based fields
      if (updateData.lecture !== undefined) {
        updateFields.lectureId = updateData.lecture;
      }

      if (updateData.journal !== undefined) {
        updateFields.journalId = updateData.journal;
      }

      if (updateData.conf !== undefined) {
        updateFields.confId = updateData.conf;
      }

      // Get current event state for validation (needed for status and dateTime validation)
      const currentEvent = await this.eventService.getEventById(id, dataSource);
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
        updateFields.presenterId = updateData.presenter;
      }

      let processedAttendance: IEventAttendance[] | undefined;

      if (updateData.attendance !== undefined) {
        // Process attendance: convert to new structure if needed
        processedAttendance = updateData.attendance.map((att: any) => {
          // Handle both old format (candidate: ObjectId) and new format (candidateId: string)
          let candidateId: string;
          if (typeof att === "object" && "candidateId" in att) {
            candidateId = att.candidateId;
          } else if (typeof att === "object" && "candidate" in att) {
            // Old format: candidate is ObjectId or string
            candidateId = typeof att.candidate === "string" ? att.candidate : (att.candidate?.toString() || String(att.candidate));
          } else {
            // Legacy: att is just an ID string or ObjectId
            candidateId = typeof att === "string" ? att : (att?.toString() || String(att));
          }

          return {
            candidateId,
            addedBy: (att as any).addedBy || "",
            addedByRole: (att as any).addedByRole || "instituteAdmin",
            flagged: (att as any).flagged || false,
            flaggedBy: (att as any).flaggedBy,
            flaggedAt: (att as any).flaggedAt,
            points: (att as any).points || 1,
            createdAt: (att as any).createdAt || new Date(),
          };
        });
        
        // Add attendance as separate property for service to handle
        (updateFields as any).attendance = processedAttendance;
        
        // Auto-update status based on attendance:
        // - If attendance has attendees, set status to "held"
        // - If attendance is empty, do not auto-change status (keep current)
        if (processedAttendance.length > 0) {
          updateFields.status = "held";
        }
      }

      if (updateData.status !== undefined) {
        // Validate status change based on attendance rules
        // Use updated attendance if provided, otherwise use current attendance
        const attendanceToCheck = processedAttendance !== undefined
          ? processedAttendance
          : (currentEvent.attendance || []);
        
        this.validateStatusChange(attendanceToCheck, updateData.status);
        updateFields.status = updateData.status;
      }

      // If type or refs or presenter/attendance changed, re-validate
      const currentState = await this.buildCurrentEventState(id, dataSource);
      const merged: IEventInput = {
        ...currentState,
        ...updateFields,
        // Convert UUID fields back to input format for validation
        lecture: (updateFields.lectureId !== undefined ? updateFields.lectureId : currentState.lecture) || undefined,
        journal: (updateFields.journalId !== undefined ? updateFields.journalId : currentState.journal) || undefined,
        conf: (updateFields.confId !== undefined ? updateFields.confId : currentState.conf) || undefined,
        presenter: (updateFields.presenterId !== undefined ? updateFields.presenterId : currentState.presenter) || "",
      };

      this.validateTypeAndRefs(merged);
      await this.validateReferencedEntityExists(merged, dataSource);
      await this.validatePresenter(merged.type, merged.presenter, dataSource);
      this.validateLocation(merged.type, merged.location);
      const attendanceToValidate = processedAttendance !== undefined ? processedAttendance : (currentState.attendance || []);
      this.validateAttendanceIds(attendanceToValidate);

      return await this.eventService.updateEvent(id, updateFields, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async addAttendance(validatedReq: IAddAttendanceInput, dataSource: DataSource): Promise<IEventDoc> | never {
    try {
      // Validate event exists
      const event = await this.eventService.getEventById(validatedReq.eventId, dataSource);
      if (!event) {
        throw new Error("Event not found");
      }

      // Validate candidate exists
      const candidate = await this.candService.getCandById(validatedReq.candidateId, dataSource);
      if (!candidate) {
        throw new Error("Candidate not found");
      }

      // Validate UUID formats
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(validatedReq.eventId) || 
          !uuidRegex.test(validatedReq.candidateId) ||
          !uuidRegex.test(validatedReq.addedBy)) {
        throw new Error("Invalid event, candidate, or user ID format");
      }

      const result = await this.eventService.addAttendance(
        validatedReq.eventId,
        validatedReq.candidateId,
        validatedReq.addedBy,
        validatedReq.addedByRole,
        dataSource
      );
      if (!result) {
        throw new Error("Failed to add attendance");
      }
      return result;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async removeAttendance(validatedReq: IRemoveAttendanceInput, dataSource: DataSource): Promise<IEventDoc> | never {
    try {
      // Validate event exists
      const event = await this.eventService.getEventById(validatedReq.eventId, dataSource);
      if (!event) {
        throw new Error("Event not found");
      }

      // Validate UUID formats
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(validatedReq.eventId) || 
          !uuidRegex.test(validatedReq.candidateId)) {
        throw new Error("Invalid event or candidate ID format");
      }

      const result = await this.eventService.removeAttendance(
        validatedReq.eventId,
        validatedReq.candidateId,
        dataSource
      );
      if (!result) {
        throw new Error("Failed to remove attendance");
      }
      return result;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async flagAttendance(validatedReq: IFlagAttendanceInput, dataSource: DataSource): Promise<IEventDoc> | never {
    try {
      // Validate event exists
      const event = await this.eventService.getEventById(validatedReq.eventId, dataSource);
      if (!event) {
        throw new Error("Event not found");
      }

      // Validate UUID formats
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(validatedReq.eventId) || 
          !uuidRegex.test(validatedReq.candidateId) ||
          !uuidRegex.test(validatedReq.flaggedBy)) {
        throw new Error("Invalid event, candidate, or user ID format");
      }

      const result = await this.eventService.flagAttendance(
        validatedReq.eventId,
        validatedReq.candidateId,
        validatedReq.flaggedBy,
        dataSource
      );
      if (!result) {
        throw new Error("Failed to flag attendance");
      }
      return result;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async unflagAttendance(validatedReq: IUnflagAttendanceInput, dataSource: DataSource): Promise<IEventDoc> | never {
    try {
      // Validate event exists
      const event = await this.eventService.getEventById(validatedReq.eventId, dataSource);
      if (!event) {
        throw new Error("Event not found");
      }

      // Validate UUID formats
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(validatedReq.eventId) || 
          !uuidRegex.test(validatedReq.candidateId)) {
        throw new Error("Invalid event or candidate ID format");
      }

      const result = await this.eventService.unflagAttendance(
        validatedReq.eventId,
        validatedReq.candidateId,
        dataSource
      );
      if (!result) {
        throw new Error("Failed to unflag attendance");
      }
      return result;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  /**
   * Candidate event points: all attended events with per-event points and total.
   * Uses journal-presenter rules: flagged −2; journal presenter+attendee +3; else +1.
   */
  public async getCandidateEventPoints(
    candidateId: string,
    dataSource: DataSource
  ): Promise<ICandidateEventPointsResponse> | never {
    try {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(candidateId)) {
        throw new Error("Invalid candidate ID format");
      }

      const attendanceWithEvents = await this.eventService.getAttendanceWithEventsForCandidate(
        candidateId,
        dataSource
      );

      const journalPresenterIds = new Set<string>();
      const lectureConfPresenterIds = new Set<string>();
      for (const { event } of attendanceWithEvents) {
        if (event.type === "journal") {
          journalPresenterIds.add(event.presenterId);
        } else {
          lectureConfPresenterIds.add(event.presenterId);
        }
      }

      const presenterMap = new Map<
        string,
        { name: string; role: "candidate" | "supervisor"; rank?: string; position?: string }
      >();
      const journalIds = Array.from(journalPresenterIds);
      const lectureConfIds = Array.from(lectureConfPresenterIds);
      if (journalIds.length > 0) {
        const candidates = await this.candService.getCandsByIds(journalIds, dataSource);
        for (const c of candidates) {
          const id = (c as any)?.id ?? (c as any)?._id;
          if (id) {
            presenterMap.set(id, {
              name: (c as any)?.fullName ?? "—",
              role: "candidate",
              rank: (c as any)?.rank,
            });
          }
        }
      }
      if (lectureConfIds.length > 0) {
        const supervisors = await this.supervisorService.getSupervisorsByIds(lectureConfIds, dataSource);
        for (const s of supervisors) {
          const id = (s as any)?.id ?? (s as any)?._id;
          if (id) {
            presenterMap.set(id, {
              name: (s as any)?.fullName ?? "—",
              role: "supervisor",
              position: (s as any)?.position,
            });
          }
        }
      }
      for (const id of journalIds) {
        if (!presenterMap.has(id)) presenterMap.set(id, { name: "—", role: "candidate" });
      }
      for (const id of lectureConfIds) {
        if (!presenterMap.has(id)) presenterMap.set(id, { name: "—", role: "supervisor" });
      }

      const events: IEventPointsItem[] = [];
      let totalPoints = 0;

      for (const { att, event } of attendanceWithEvents) {
        const points = this.eventService.computePointsForAttendance(att, event, candidateId);
        totalPoints += points;

        const type: TEventTypePublic =
          event.type === "conf" ? "conference" : (event.type as "lecture" | "journal");
        const ev = event as any;
        let eventId: string;
        let eventTitle: string;
        if (event.type === "lecture" && ev.lecture) {
          eventId = ev.lecture.id;
          eventTitle = ev.lecture.lectureTitle ?? "—";
        } else if (event.type === "journal" && ev.journal) {
          eventId = ev.journal.id;
          eventTitle = ev.journal.journalTitle ?? "—";
        } else if (event.type === "conf" && ev.conf) {
          eventId = ev.conf.id;
          eventTitle = ev.conf.confTitle ?? "—";
        } else {
          eventId = event.id;
          eventTitle = "—";
        }

        const pres = presenterMap.get(event.presenterId);
        const presenter: IEventPointsPresenter = {
          presenterId: event.presenterId,
          name: pres?.name ?? "—",
          role: pres?.role ?? (event.type === "journal" ? "candidate" : "supervisor"),
          ...(pres?.rank !== undefined && { rank: String(pres.rank) }),
          ...(pres?.position !== undefined && { position: String(pres.position) }),
        };

        const eventInfo: IEventPointsEvent = { id: eventId, title: eventTitle };
        events.push({
          eventId: att.eventId,
          type,
          presenter,
          event: eventInfo,
          points,
        });
      }

      return { events, totalPoints };
    } catch (err: any) {
      throw new Error(err);
    }
  }

  /**
   * Academic (points) ranking: top 10 by points + logged-in candidate if not in top 10.
   * Uses shared event-points rules (attendance +1, flagged −2, journal presenter +2, presenter+attendee +3).
   * Fetches candidate details only for returned ids (≤11).
   */
  public async getAcademicRanking(
    dataSource: DataSource,
    loggedInUserId?: string,
    loggedInUserRole?: string
  ): Promise<
    { candidateId: string; candidateName: string; rank: number; academicPoints: number; regDeg: string }[]
  > | never {
    try {
      const pointsMap = await this.eventService.getAcademicPointsPerCandidate(dataSource);
      const sorted = Array.from(pointsMap.entries())
        .map(([candidateId, academicPoints]) => ({ candidateId, academicPoints }))
        .sort((a, b) => {
          if (b.academicPoints !== a.academicPoints) return b.academicPoints - a.academicPoints;
          return a.candidateId.localeCompare(b.candidateId);
        });

      const top10 = sorted.slice(0, 10);
      const top10Ids = new Set(top10.map((r) => r.candidateId));
      const isLoggedInCandidate =
        loggedInUserRole === "candidate" && loggedInUserId && loggedInUserId.length > 0;
      const addLoggedIn =
        isLoggedInCandidate && !top10Ids.has(loggedInUserId!);

      let loggedInRank: number | null = null;
      let loggedInPoints = 0;
      if (isLoggedInCandidate && loggedInUserId) {
        loggedInPoints = pointsMap.get(loggedInUserId) ?? 0;
        if (addLoggedIn) {
          const idx = sorted.findIndex((r) => r.candidateId === loggedInUserId);
          loggedInRank = idx >= 0 ? idx + 1 : sorted.length + 1;
        }
      }

      const idsToFetch = addLoggedIn
        ? [...top10.map((r) => r.candidateId), loggedInUserId!]
        : top10.map((r) => r.candidateId);
      const candidates = await this.candService.getCandsByIds(idsToFetch, dataSource);
      const candidateMap = new Map<string, { fullName: string; regDeg: string }>();
      for (const c of candidates) {
        const id = (c as any)?.id;
        if (id) {
          candidateMap.set(id, {
            fullName: (c as any)?.fullName ?? "—",
            regDeg: (c as any)?.regDeg ?? "",
          });
        }
      }
      for (const id of idsToFetch) {
        if (!candidateMap.has(id)) {
          candidateMap.set(id, { fullName: "—", regDeg: "" });
        }
      }

      const result: { candidateId: string; candidateName: string; rank: number; academicPoints: number; regDeg: string }[] = [];
      for (let i = 0; i < top10.length; i++) {
        const r = top10[i];
        const meta = candidateMap.get(r.candidateId);
        result.push({
          candidateId: r.candidateId,
          candidateName: meta?.fullName ?? "—",
          rank: i + 1,
          academicPoints: r.academicPoints,
          regDeg: meta?.regDeg ?? "",
        });
      }
      if (addLoggedIn && loggedInUserId != null && loggedInRank != null) {
        const meta = candidateMap.get(loggedInUserId);
        result.push({
          candidateId: loggedInUserId,
          candidateName: meta?.fullName ?? "—",
          rank: loggedInRank,
          academicPoints: loggedInPoints,
          regDeg: meta?.regDeg ?? "",
        });
      }
      return result;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async deleteEvent(id: string, dataSource: DataSource): Promise<boolean> | never {
    try {
      return await this.eventService.deleteEvent(id, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  /** Helper: get current event state (for validation during update) */
  private async buildCurrentEventState(id: string, dataSource: DataSource): Promise<IEventInput> | never {
    const existing = await this.eventService.getEventById(id, dataSource);
    if (!existing) {
      throw new Error("Event not found");
    }

    return {
      type: existing.type,
      lecture: existing.lectureId || undefined,
      journal: existing.journalId || undefined,
      conf: existing.confId || undefined,
      dateTime: existing.dateTime,
      location: existing.location,
      presenter: existing.presenterId,
      attendance: existing.attendance || [],
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
  private async validateReferencedEntityExists(event: IEventInput, dataSource: DataSource): Promise<void> {
    const { type, lecture, journal, conf } = event;

    // Convert to string for validation
    const lectureId = lecture ? (typeof lecture === "string" ? lecture : String(lecture)) : null;
    const journalId = journal ? (typeof journal === "string" ? journal : String(journal)) : null;
    const confId = conf ? (typeof conf === "string" ? conf : String(conf)) : null;

    if (type === "lecture" && lectureId) {
      const lectureDoc = await this.lectureService.getLectureById(lectureId, dataSource);
      if (!lectureDoc) {
        throw new Error(`Lecture with ID '${lectureId}' not found`);
      }
    }

    if (type === "journal" && journalId) {
      const journalDoc = await this.journalService.getJournalById(journalId, dataSource);
      if (!journalDoc) {
        throw new Error(`Journal with ID '${journalId}' not found`);
      }
    }

    if (type === "conf" && confId) {
      const confDoc = await this.confService.getConfById(confId, dataSource);
      if (!confDoc) {
        throw new Error(`Conf with ID '${confId}' not found`);
      }
    }
  }

  /** Helper: validate presenter based on event type */
  private async validatePresenter(
    type: TEventType,
    presenterId: string,
    dataSource: DataSource
  ): Promise<void> {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(presenterId)) {
      throw new Error("Invalid presenter ID format");
    }

    if (type === "lecture" || type === "conf") {
      const supervisor = await this.supervisorService.getSupervisorById({
        id: presenterId,
      }, dataSource);
      if (!supervisor) {
        throw new Error(`Supervisor presenter with ID '${presenterId}' not found`);
      }
    } else if (type === "journal") {
      const cand = await this.candService.getCandById(presenterId, dataSource);
      if (!cand) {
        throw new Error(`Candidate presenter with ID '${presenterId}' not found`);
      }
    }
  }

  /** Helper: validate attendance candidate IDs */
  private validateAttendanceIds(attendance: IEventAttendance[]): void {
    if (!attendance) return;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    for (const att of attendance) {
      const candidateId = att.candidateId || (att as any).candidate?.toString() || (att as any).candidate;
      if (!candidateId || !uuidRegex.test(candidateId)) {
        throw new Error(`Invalid candidate ID in attendance: '${candidateId}'`);
      }
      if (!att.addedBy || !uuidRegex.test(att.addedBy)) {
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
    addedByRole: "instituteAdmin" | "supervisor" | "candidate",
    dataSource: DataSource,
    options?: { startRow?: number }
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

      let rows: any[] = externalData.data.data;
      const startRow = options?.startRow;
      if (startRow != null && startRow > 1) {
        rows = rows.slice(startRow - 1);
      }
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

      const startIndex = startRow != null && startRow > 1 ? 0 : 1; // When startRow set, process from first sliced row; else skip header
      const rowOffset = startRow != null && startRow > 1 ? startRow - 1 : 0;
      for (let i = startIndex; i < rows.length; i++) {
        const row = rows[i];
        const rowNumber = rowOffset + i + 1;

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
        this.candService.findCandidatesByEmails(Array.from(uniqueEmails), dataSource),
        this.lectureService.findLecturesByGoogleUids(Array.from(uniqueUids), dataSource),
        this.journalService.findJournalsByGoogleUids(Array.from(uniqueUids), dataSource),
        this.confService.findConfsByGoogleUids(Array.from(uniqueUids), dataSource),
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
      // Handle both id (MariaDB UUID) and _id (MongoDB ObjectId) formats
      const lectureIds: (string | any)[] = [];
      const journalIds: (string | any)[] = [];
      const confIds: (string | any)[] = [];
      const uidToResourceType = new Map<string, "lecture" | "journal" | "conf">();

      for (const parsedRow of parsedRows) {
        const uid = parsedRow.uid;
        if (lectureMap.has(uid)) {
          const lecture = lectureMap.get(uid);
          // Handle both id (MariaDB) and _id (MongoDB) formats
          const lectureId = (lecture as any).id || (lecture as any)._id?.toString() || (lecture as any)._id;
          lectureIds.push(lectureId);
          uidToResourceType.set(uid, "lecture");
        } else if (journalMap.has(uid)) {
          const journal = journalMap.get(uid);
          // Handle both id (MariaDB) and _id (MongoDB) formats
          const journalId = (journal as any).id || (journal as any)._id?.toString() || (journal as any)._id;
          journalIds.push(journalId);
          uidToResourceType.set(uid, "journal");
        } else if (confMap.has(uid)) {
          const conf = confMap.get(uid);
          // Handle both id (MariaDB) and _id (MongoDB) formats
          const confId = (conf as any).id || (conf as any)._id?.toString() || (conf as any)._id;
          confIds.push(confId);
          uidToResourceType.set(uid, "conf");
        }
      }

      // Step 5: Batch fetch all events
      const eventMap = await this.eventService.findEventsByLectureJournalConfIds(
        lectureIds as any,
        journalIds as any,
        confIds as any,
        dataSource
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
          let resourceId: string | null = null;
          if (resourceType === "lecture") {
            const lecture = lectureMap.get(uid);
            // Handle both id (MariaDB) and _id (MongoDB) formats
            resourceId = lecture ? ((lecture as any).id || (lecture as any)._id?.toString() || (lecture as any)._id) : null;
          } else if (resourceType === "journal") {
            const journal = journalMap.get(uid);
            // Handle both id (MariaDB) and _id (MongoDB) formats
            resourceId = journal ? ((journal as any).id || (journal as any)._id?.toString() || (journal as any)._id) : null;
          } else if (resourceType === "conf") {
            const conf = confMap.get(uid);
            // Handle both id (MariaDB) and _id (MongoDB) formats
            resourceId = conf ? ((conf as any).id || (conf as any)._id?.toString() || (conf as any)._id) : null;
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
          const candidateIdStr = (candidate as any).id || (candidate as any)._id?.toString() || String((candidate as any)._id || candidate);
          const isAlreadyRegistered = (event.attendance || []).some(
            (att: any) => {
              const attCandidateId = att.candidateId || (att.candidate as any)?.id || (att.candidate as any)?._id?.toString() || (att.candidate?.toString?.() || String(att.candidate));
              return attCandidateId === candidateIdStr;
            }
          ) || false;

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
          const eventIdStr = (event as any).id || (event as any)._id?.toString() || event.toString();
          await this.eventService.addAttendance(
            eventIdStr,
            candidateIdStr,
            addedBy,
            addedByRole,
            dataSource
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


