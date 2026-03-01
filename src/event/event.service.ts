import { inject, injectable } from "inversify";
import { DataSource } from "typeorm";
import { IEvent, IEventDoc, IEventAttendance } from "./event.interface";
import { EventEntity } from "./event.mDbSchema";
import { EventAttendanceEntity } from "./eventAttendance.mDbSchema";
import { Repository, In, MoreThanOrEqual } from "typeorm";
import { CandService } from "../cand/cand.service";
import { SupervisorService } from "../supervisor/supervisor.service";
import { createTtlCache } from "../utils/ttlCache";

export interface IAttendanceWithEvent {
  att: EventAttendanceEntity;
  event: EventEntity;
}

/** TTL for academic points cache (ms). Ranking can be up to this many ms stale. Env: CACHE_TTL_ACADEMIC_POINTS_MS */
const CACHE_TTL_ACADEMIC_POINTS_MS = Math.max(0, parseInt(process.env.CACHE_TTL_ACADEMIC_POINTS_MS ?? "60000", 10)) || 60000;
/** TTL for events dashboard cache (ms). Env: CACHE_TTL_EVENTS_DASHBOARD_MS */
const CACHE_TTL_EVENTS_DASHBOARD_MS = Math.max(0, parseInt(process.env.CACHE_TTL_EVENTS_DASHBOARD_MS ?? "60000", 10)) || 60000;

@injectable()
export class EventService {
  private uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  private readonly academicPointsCache = createTtlCache<Map<string, number>>();
  private readonly academicPointsLoadPromises = new Map<string, Promise<Map<string, number>>>();
  private readonly eventsDashboardCache = createTtlCache<any[]>();
  private readonly eventsDashboardLoadPromises = new Map<string, Promise<any[]>>();

  constructor(
    @inject(CandService) private candService: CandService,
    @inject(SupervisorService) private supervisorService: SupervisorService
  ) {}

  /**
   * Stable cache key per tenant. Read-only from DataSource options.
   */
  private getTenantCacheKey(dataSource: DataSource): string {
    const opts = dataSource.options as { database?: string; host?: string };
    const db = opts.database ?? "";
    const host = opts.host ?? "";
    return host && db ? `${host}:${db}` : db || "default";
  }

  /**
   * Populates the presenter field based on event type
   * - For lecture and conf: presenter is Supervisor (id, name, position)
   * - For journal: presenter is Candidate (id, name, rank)
   */
  private async populatePresenter(event: EventEntity | EventEntity[], dataSource: DataSource): Promise<any> {
    if (Array.isArray(event)) {
      return await Promise.all(event.map(e => this.populatePresenter(e, dataSource)));
    }

    const eventDoc = event as any;

    if (event.presenterId) {
      try {
        if (event.type === "lecture" || event.type === "conf") {
          const supervisor = await this.supervisorService.getSupervisorById({ id: event.presenterId }, dataSource);
          eventDoc.presenter = supervisor
            ? { id: event.presenterId, name: (supervisor as any).fullName ?? "—", position: (supervisor as any).position }
            : { id: event.presenterId, name: "—", position: undefined };
        } else if (event.type === "journal") {
          const candidate = await this.candService.getCandById(event.presenterId, dataSource);
          eventDoc.presenter = candidate
            ? { id: event.presenterId, name: (candidate as any).fullName ?? "—", rank: (candidate as any).rank }
            : { id: event.presenterId, name: "—", rank: undefined };
        }
      } catch (err) {
        eventDoc.presenter = { id: event.presenterId, name: "—", rank: undefined, position: undefined };
      }
    }

    return eventDoc;
  }

  /**
   * Populates attendance records for an event
   */
  private async populateAttendance(eventId: string, dataSource: DataSource): Promise<IEventAttendance[]> {
    const attendanceRepository = dataSource.getRepository(EventAttendanceEntity);
    const attendanceRecords = await attendanceRepository.find({
      where: { eventId },
      relations: ["candidate"],
      order: { createdAt: "ASC" },
    });

    return attendanceRecords.map(att => ({
      id: att.id,
      candidateId: att.candidateId,
      candidate: att.candidate,
      addedBy: att.addedBy,
      addedByRole: att.addedByRole,
      flagged: att.flagged,
      flaggedBy: att.flaggedBy || undefined,
      flaggedAt: att.flaggedAt || undefined,
      points: att.points,
      createdAt: att.createdAt,
    }));
  }

  /**
   * Loads attendance for multiple events in one query (avoids N+1 in list endpoints).
   * Returns a Map of eventId -> IEventAttendance[] in same shape as populateAttendance.
   */
  private async getAttendanceByEventIds(
    eventIds: string[],
    dataSource: DataSource
  ): Promise<Map<string, IEventAttendance[]>> {
    if (eventIds.length === 0) {
      return new Map();
    }
    const attendanceRepository = dataSource.getRepository(EventAttendanceEntity);
    const records = await attendanceRepository.find({
      where: { eventId: In(eventIds) },
      relations: ["candidate"],
      order: { createdAt: "ASC" },
    });
    const map = new Map<string, IEventAttendance[]>();
    for (const eventId of eventIds) {
      map.set(eventId, []);
    }
    for (const att of records) {
      const list = map.get(att.eventId)!;
      list.push({
        id: att.id,
        candidateId: att.candidateId,
        candidate: att.candidate,
        addedBy: att.addedBy,
        addedByRole: att.addedByRole,
        flagged: att.flagged,
        flaggedBy: att.flaggedBy || undefined,
        flaggedAt: att.flaggedAt || undefined,
        points: att.points,
        createdAt: att.createdAt,
      });
    }
    return map;
  }

  public async createEvent(eventData: IEvent, dataSource: DataSource): Promise<IEventDoc> | never {
    try {
      const eventRepository = dataSource.getRepository(EventEntity);
      const attendanceRepository = dataSource.getRepository(EventAttendanceEntity);
      const newEvent = eventRepository.create(eventData);
      const savedEvent = await eventRepository.save(newEvent);

      // If attendance was provided, create attendance records
      if ((eventData as any).attendance && Array.isArray((eventData as any).attendance)) {
        const attendanceArray = (eventData as any).attendance as IEventAttendance[];
        for (const att of attendanceArray) {
          const attendanceRecord = attendanceRepository.create({
            eventId: savedEvent.id,
            candidateId: att.candidateId,
            addedBy: att.addedBy,
            addedByRole: att.addedByRole,
            flagged: att.flagged || false,
            flaggedBy: att.flaggedBy || undefined,
            flaggedAt: att.flaggedAt || undefined,
            points: att.points || 1,
          });
          await attendanceRepository.save(attendanceRecord);
        }
      }

      // Update status if attendance was provided
      if ((eventData as any).attendance && Array.isArray((eventData as any).attendance) && (eventData as any).attendance.length > 0) {
        await eventRepository.update(savedEvent.id, { status: "held" });
        savedEvent.status = "held";
      }

      // Load relations and populate
      const eventWithRelations = await eventRepository.findOne({
        where: { id: savedEvent.id },
        relations: ["lecture", "journal", "conf"],
      });

      if (!eventWithRelations) {
        throw new Error("Failed to load created event");
      }

      const populated = await this.populatePresenter(eventWithRelations, dataSource);
      const attendance = await this.populateAttendance(savedEvent.id, dataSource);

      return {
        ...populated,
        attendance,
      } as IEventDoc;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getAllEvents(dataSource: DataSource): Promise<IEventDoc[]> | never {
    try {
      const eventRepository = dataSource.getRepository(EventEntity);
      const events = await eventRepository.find({
        relations: ["lecture", "journal", "conf"],
        order: { createdAt: "DESC" },
      });

      const eventIds = events.map((e) => e.id);
      const attendanceMap = await this.getAttendanceByEventIds(eventIds, dataSource);

      const populatedEvents = await Promise.all(
        events.map(async (event) => {
          const populated = await this.populatePresenter(event, dataSource);
          const attendance = attendanceMap.get(event.id) ?? [];
          return {
            ...populated,
            attendance,
          };
        })
      );

      return populatedEvents as IEventDoc[];
    } catch (err: any) {
      throw new Error(err);
    }
  }

  /**
   * Returns all events where the given supervisor ID was the presenter.
   * Includes lecture, journal, conf relations and aggregated attendance for each event.
   */
  public async getEventsByPresenter(supervisorId: string, dataSource: DataSource): Promise<any[]> | never {
    try {
      const eventRepository = dataSource.getRepository(EventEntity);
      if (!this.uuidRegex.test(supervisorId)) {
        throw new Error("Invalid supervisor ID format");
      }

      const events = await eventRepository.find({
        where: { presenterId: supervisorId },
        relations: ["lecture", "journal", "conf"],
        order: { dateTime: "ASC" },
      });

      const eventIds = events.map((e) => e.id);
      const attendanceMap = await this.getAttendanceByEventIds(eventIds, dataSource);

      const populatedEvents = await Promise.all(
        events.map(async (event) => {
          const populated = await this.populatePresenter(event, dataSource);
          const attendance = attendanceMap.get(event.id) ?? [];
          const { createdAt, updatedAt, ...rest } = populated as any;
          const item: any = {
            ...rest,
            _id: rest.id ?? rest._id,
            lecture: rest.lecture ? { _id: rest.lecture.id, lectureTitle: rest.lecture.lectureTitle } : undefined,
            journal: rest.journal ? { _id: rest.journal.id, journalTitle: rest.journal.journalTitle } : undefined,
            conf: rest.conf ? { _id: rest.conf.id, confTitle: rest.conf.confTitle } : undefined,
            presenter: rest.presenter ? { _id: rest.presenter.id ?? rest.presenterId, fullName: rest.presenter.fullName ?? rest.presenter.name } : undefined,
            attendance: (attendance || []).map((att: any) => ({
              candidate: att.candidate ? { _id: att.candidate.id ?? att.candidate._id, fullName: att.candidate.fullName } : undefined,
              flagged: att.flagged,
              points: att.points,
              createdAt: att.createdAt,
            })),
          };
          return item;
        })
      );

      return populatedEvents;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  /**
   * Dashboard: events from last 30 days through all future, stripped of createdAt and updatedAt.
   * Cached per tenant with TTL (CACHE_TTL_EVENTS_DASHBOARD_MS). Concurrent requests for same tenant coalesce.
   */
  public async getEventsDashboard(dataSource: DataSource): Promise<any[]> | never {
    try {
      const key = this.getTenantCacheKey(dataSource);
      const cached = this.eventsDashboardCache.get(key);
      if (cached !== undefined) {
        return cached;
      }
      const inProgress = this.eventsDashboardLoadPromises.get(key);
      if (inProgress) {
        await inProgress;
        const after = this.eventsDashboardCache.get(key);
        if (after !== undefined) return after;
      }
      const loadPromise = this.computeEventsDashboard(dataSource);
      this.eventsDashboardLoadPromises.set(key, loadPromise);
      try {
        const result = await loadPromise;
        this.eventsDashboardCache.set(key, result, CACHE_TTL_EVENTS_DASHBOARD_MS);
        return result;
      } finally {
        this.eventsDashboardLoadPromises.delete(key);
      }
    } catch (err: any) {
      throw new Error(err);
    }
  }

  /**
   * Fetches and shapes events for dashboard. Used by getEventsDashboard (cached).
   */
  private async computeEventsDashboard(dataSource: DataSource): Promise<any[]> {
    const eventRepository = dataSource.getRepository(EventEntity);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    cutoff.setHours(0, 0, 0, 0);

    const events = await eventRepository.find({
      where: { dateTime: MoreThanOrEqual(cutoff) },
      relations: ["lecture", "journal", "conf"],
      order: { dateTime: "ASC" },
    });

    const eventIds = events.map((e) => e.id);
    const attendanceMap = await this.getAttendanceByEventIds(eventIds, dataSource);

    const populatedEvents = await Promise.all(
      events.map(async (event) => {
        const populated = await this.populatePresenter(event, dataSource);
        const attendance = attendanceMap.get(event.id) ?? [];
        const { createdAt, updatedAt, ...rest } = populated as any;
        const item: any = {
          ...rest,
          _id: rest.id ?? rest._id,
          lecture: rest.lecture ? { _id: rest.lecture.id, lectureTitle: rest.lecture.lectureTitle } : undefined,
          journal: rest.journal ? { _id: rest.journal.id, journalTitle: rest.journal.journalTitle } : undefined,
          conf: rest.conf ? { _id: rest.conf.id, confTitle: rest.conf.confTitle } : undefined,
          presenter: rest.presenter ? { _id: rest.presenter.id ?? rest.presenterId, fullName: rest.presenter.fullName ?? rest.presenter.name } : undefined,
          attendance: (attendance || []).map((att: any) => ({
            candidate: att.candidate ? { _id: att.candidate.id ?? att.candidate._id, fullName: att.candidate.fullName } : undefined,
            flagged: att.flagged,
            points: att.points,
            createdAt: att.createdAt,
          })),
        };
        return item;
      })
    );

    return populatedEvents;
  }

  public async getEventById(id: string, dataSource: DataSource): Promise<IEventDoc | null> | never {
    try {
      const eventRepository = dataSource.getRepository(EventEntity);
      // Validate UUID format
      if (!this.uuidRegex.test(id)) {
        throw new Error("Invalid event ID format");
      }

      const event = await eventRepository.findOne({
        where: { id },
        relations: ["lecture", "journal", "conf"],
      });

      if (!event) {
        return null;
      }

      const populated = await this.populatePresenter(event, dataSource);
      const attendance = await this.populateAttendance(id, dataSource);

      return {
        ...populated,
        attendance,
      } as IEventDoc;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async updateEvent(id: string, updateData: Partial<IEvent>, dataSource: DataSource): Promise<IEventDoc | null> | never {
    try {
      const eventRepository = dataSource.getRepository(EventEntity);
      const attendanceRepository = dataSource.getRepository(EventAttendanceEntity);
      // Validate UUID format
      if (!this.uuidRegex.test(id)) {
        throw new Error("Invalid event ID format");
      }

      // Handle attendance separately if provided
      if ((updateData as any).attendance !== undefined) {
        const attendanceArray = (updateData as any).attendance as IEventAttendance[];
        
        // Delete all existing attendance
        await attendanceRepository.delete({ eventId: id });
        
        // Create new attendance records
        for (const att of attendanceArray) {
          const attendanceRecord = attendanceRepository.create({
            eventId: id,
            candidateId: att.candidateId,
            addedBy: att.addedBy,
            addedByRole: att.addedByRole,
            flagged: att.flagged || false,
            flaggedBy: att.flaggedBy || undefined,
            flaggedAt: att.flaggedAt || undefined,
            points: att.points || 1,
          });
          await attendanceRepository.save(attendanceRecord);
        }

        // Update status based on attendance: set to "held" when there are attendees
        if (attendanceArray.length > 0) {
          updateData.status = "held";
        } else {
          updateData.status = "booked";
        }

        // Remove attendance from updateData to avoid conflicts
        delete (updateData as any).attendance;
      }

      // Update event fields
      await eventRepository.update(id, updateData);

      // Load updated event with relations
      const updatedEvent = await eventRepository.findOne({
        where: { id },
        relations: ["lecture", "journal", "conf"],
      });

      if (!updatedEvent) {
        return null;
      }

      const populated = await this.populatePresenter(updatedEvent, dataSource);
      const attendance = await this.populateAttendance(id, dataSource);

      return {
        ...populated,
        attendance,
      } as IEventDoc;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async deleteEvent(id: string, dataSource: DataSource): Promise<boolean> | never {
    try {
      const eventRepository = dataSource.getRepository(EventEntity);
      // Validate UUID format
      if (!this.uuidRegex.test(id)) {
        throw new Error("Invalid event ID format");
      }

      // Attendance will be deleted automatically via CASCADE
      const result = await eventRepository.delete(id);
      return (result.affected ?? 0) > 0;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  /**
   * Add candidate to event attendance
   */
  public async addAttendance(
    eventId: string,
    candidateId: string,
    addedBy: string,
    addedByRole: "instituteAdmin" | "supervisor" | "candidate",
    dataSource: DataSource
  ): Promise<IEventDoc | null> | never {
    try {
      const eventRepository = dataSource.getRepository(EventEntity);
      const attendanceRepository = dataSource.getRepository(EventAttendanceEntity);
      // Validate UUID formats
      if (!this.uuidRegex.test(eventId) || !this.uuidRegex.test(candidateId) || !this.uuidRegex.test(addedBy)) {
        throw new Error("Invalid event, candidate, or user ID format");
      }

      const event = await eventRepository.findOne({ where: { id: eventId } });
      if (!event) {
        throw new Error("Event not found");
      }

      // Check if candidate is already in attendance
      const existingAttendance = await attendanceRepository.findOne({
        where: { eventId, candidateId },
      });
      if (existingAttendance) {
        throw new Error("Candidate is already in attendance");
      }

      // Create new attendance record
      await attendanceRepository.save({
        eventId,
        candidateId,
        addedBy,
        addedByRole,
        flagged: false,
        points: 1, // +1 for attendance
      });

      // Update status to "held" if event has attendees
      const attendanceCount = await attendanceRepository.count({ where: { eventId } });
      if (attendanceCount > 0) {
        await eventRepository.update(eventId, { status: "held" });
        event.status = "held";
      }

      // Load event with relations
      const eventWithRelations = await eventRepository.findOne({
        where: { id: eventId },
        relations: ["lecture", "journal", "conf"],
      });

      if (!eventWithRelations) {
        throw new Error("Failed to load updated event");
      }

      const populated = await this.populatePresenter(eventWithRelations, dataSource);
      const attendance = await this.populateAttendance(eventId, dataSource);

      return {
        ...populated,
        attendance,
      } as IEventDoc;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  /**
   * Remove candidate from event attendance
   */
  public async removeAttendance(eventId: string, candidateId: string, dataSource: DataSource): Promise<IEventDoc | null> | never {
    try {
      const eventRepository = dataSource.getRepository(EventEntity);
      const attendanceRepository = dataSource.getRepository(EventAttendanceEntity);
      // Validate UUID formats
      if (!this.uuidRegex.test(eventId) || !this.uuidRegex.test(candidateId)) {
        throw new Error("Invalid event or candidate ID format");
      }

      const event = await eventRepository.findOne({ where: { id: eventId } });
      if (!event) {
        throw new Error("Event not found");
      }

      // Delete attendance record
      await attendanceRepository.delete({ eventId, candidateId });

      // Update status based on attendance: when no attendees left, set to "booked" (do not auto-set "canceled")
      const attendanceCount = await attendanceRepository.count({ where: { eventId } });
      if (attendanceCount === 0) {
        await eventRepository.update(eventId, { status: "booked" });
        event.status = "booked";
      }

      // Load event with relations
      const eventWithRelations = await eventRepository.findOne({
        where: { id: eventId },
        relations: ["lecture", "journal", "conf"],
      });

      if (!eventWithRelations) {
        throw new Error("Failed to load updated event");
      }

      const populated = await this.populatePresenter(eventWithRelations, dataSource);
      const attendance = await this.populateAttendance(eventId, dataSource);

      return {
        ...populated,
        attendance,
      } as IEventDoc;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  /**
   * Flag a candidate in attendance (sets points to -2)
   */
  public async flagAttendance(eventId: string, candidateId: string, flaggedBy: string, dataSource: DataSource): Promise<IEventDoc | null> | never {
    try {
      const eventRepository = dataSource.getRepository(EventEntity);
      const attendanceRepository = dataSource.getRepository(EventAttendanceEntity);
      // Validate UUID formats
      if (!this.uuidRegex.test(eventId) || !this.uuidRegex.test(candidateId) || !this.uuidRegex.test(flaggedBy)) {
        throw new Error("Invalid event, candidate, or user ID format");
      }

      const event = await eventRepository.findOne({ where: { id: eventId } });
      if (!event) {
        throw new Error("Event not found");
      }

      const attendance = await attendanceRepository.findOne({
        where: { eventId, candidateId },
      });
      if (!attendance) {
        throw new Error("Candidate not found in attendance");
      }

      // Flag the candidate
      await attendanceRepository.update(
        { eventId, candidateId },
        {
          flagged: true,
          flaggedBy,
          flaggedAt: new Date(),
          points: -2, // -2 for flagged
        }
      );

      // Load event with relations
      const eventWithRelations = await eventRepository.findOne({
        where: { id: eventId },
        relations: ["lecture", "journal", "conf"],
      });

      if (!eventWithRelations) {
        throw new Error("Failed to load updated event");
      }

      const populated = await this.populatePresenter(eventWithRelations, dataSource);
      const attendanceRecords = await this.populateAttendance(eventId, dataSource);

      return {
        ...populated,
        attendance: attendanceRecords,
      } as IEventDoc;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  /**
   * Unflag a candidate in attendance (sets points back to 1)
   */
  public async unflagAttendance(eventId: string, candidateId: string, dataSource: DataSource): Promise<IEventDoc | null> | never {
    try {
      const eventRepository = dataSource.getRepository(EventEntity);
      const attendanceRepository = dataSource.getRepository(EventAttendanceEntity);
      // Validate UUID formats
      if (!this.uuidRegex.test(eventId) || !this.uuidRegex.test(candidateId)) {
        throw new Error("Invalid event or candidate ID format");
      }

      const event = await eventRepository.findOne({ where: { id: eventId } });
      if (!event) {
        throw new Error("Event not found");
      }

      const attendance = await attendanceRepository.findOne({
        where: { eventId, candidateId },
      });
      if (!attendance) {
        throw new Error("Candidate not found in attendance");
      }

      // Unflag the candidate
      await attendanceRepository.update(
        { eventId, candidateId },
        {
          flagged: false,
          flaggedBy: undefined,
          flaggedAt: undefined,
          points: 1, // Back to +1
        }
      );

      // Auto-update status: if event has unflagged candidates and status is "booked" or "canceled",
      // automatically change to "held"
      const unflaggedCount = await attendanceRepository.count({
        where: { eventId, flagged: false },
      });
      if (unflaggedCount > 0 && (event.status === "booked" || event.status === "canceled")) {
        await eventRepository.update(eventId, { status: "held" });
        event.status = "held";
      }

      // Load event with relations
      const eventWithRelations = await eventRepository.findOne({
        where: { id: eventId },
        relations: ["lecture", "journal", "conf"],
      });

      if (!eventWithRelations) {
        throw new Error("Failed to load updated event");
      }

      const populated = await this.populatePresenter(eventWithRelations, dataSource);
      const attendanceRecords = await this.populateAttendance(eventId, dataSource);

      return {
        ...populated,
        attendance: attendanceRecords,
      } as IEventDoc;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  /**
   * Compute points for a single attendance record using journal-presenter rules.
   * Flagged → −2; journal presenter+attendee → +3; else +1.
   */
  public computePointsForAttendance(
    att: EventAttendanceEntity,
    event: EventEntity,
    candidateId: string
  ): number {
    if (att.flagged) return -2;
    if (event.type === "journal" && event.presenterId === candidateId) return 3;
    return 1;
  }

  /**
   * Fetch all attendance records for a candidate with event and lecture/journal/conf loaded.
   */
  public async getAttendanceWithEventsForCandidate(
    candidateId: string,
    dataSource: DataSource
  ): Promise<IAttendanceWithEvent[]> {
    if (!this.uuidRegex.test(candidateId)) {
      throw new Error("Invalid candidate ID format");
    }
    const attRepo = dataSource.getRepository(EventAttendanceEntity);
    const records = await attRepo.find({
      where: { candidateId },
      relations: ["event", "event.lecture", "event.journal", "event.conf"],
      order: { createdAt: "DESC" },
    });
    return records.map((att) => ({
      att,
      event: att.event! as EventEntity,
    }));
  }

  /**
   * Returns academic points per candidate (candidateId -> total) using journal-presenter rules.
   * Used for ranking (GET /event/academicRanking).
   * Intentional full table scan: we need all attendance + event data to compute points per candidate;
   * indexes do not apply here. The index on event_attendance(candidateId) benefits other endpoints
   * (e.g. "my points", activity timeline) that filter by candidateId.
   * Cached per tenant with TTL (CACHE_TTL_ACADEMIC_POINTS_MS). Concurrent requests for same tenant coalesce.
   */
  public async getAcademicPointsPerCandidate(dataSource: DataSource): Promise<Map<string, number>> {
    const key = this.getTenantCacheKey(dataSource);
    const cached = this.academicPointsCache.get(key);
    if (cached !== undefined) {
      return cached;
    }
    const inProgress = this.academicPointsLoadPromises.get(key);
    if (inProgress) {
      await inProgress;
      const after = this.academicPointsCache.get(key);
      if (after !== undefined) return after;
    }
    const loadPromise = this.computeAcademicPointsPerCandidate(dataSource);
    this.academicPointsLoadPromises.set(key, loadPromise);
    try {
      const result = await loadPromise;
      this.academicPointsCache.set(key, result, CACHE_TTL_ACADEMIC_POINTS_MS);
      return result;
    } finally {
      this.academicPointsLoadPromises.delete(key);
    }
  }

  /**
   * Full scan: all attendance + events, compute points per candidate. Used by getAcademicPointsPerCandidate (cached).
   */
  private async computeAcademicPointsPerCandidate(dataSource: DataSource): Promise<Map<string, number>> {
    const attRepo = dataSource.getRepository(EventAttendanceEntity);
    const records = await attRepo.find({
      relations: ["event"],
      order: { createdAt: "DESC" },
    });
    const map = new Map<string, number>();
    for (const r of records) {
      const cid = r.candidateId;
      const ev = r.event as EventEntity;
      const pts = this.computePointsForAttendance(r, ev, cid);
      map.set(cid, (map.get(cid) ?? 0) + pts);
    }
    return map;
  }

  /**
   * Find event by lecture UUID
   */
  public async findEventByLecture(lectureId: string, dataSource: DataSource): Promise<IEventDoc | null> | never {
    try {
      const eventRepository = dataSource.getRepository(EventEntity);
      // Validate UUID format
      if (!this.uuidRegex.test(lectureId)) {
        throw new Error("Invalid lecture ID format");
      }

      const event = await eventRepository.findOne({
        where: { lectureId },
        relations: ["lecture", "journal", "conf"],
      });

      if (!event) {
        return null;
      }

      const populated = await this.populatePresenter(event, dataSource);
      const attendance = await this.populateAttendance(event.id, dataSource);

      return {
        ...populated,
        attendance,
      } as IEventDoc;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  /**
   * Find event by journal UUID
   */
  public async findEventByJournal(journalId: string, dataSource: DataSource): Promise<IEventDoc | null> | never {
    try {
      const eventRepository = dataSource.getRepository(EventEntity);
      // Validate UUID format
      if (!this.uuidRegex.test(journalId)) {
        throw new Error("Invalid journal ID format");
      }

      const event = await eventRepository.findOne({
        where: { journalId },
        relations: ["lecture", "journal", "conf"],
      });

      if (!event) {
        return null;
      }

      const populated = await this.populatePresenter(event, dataSource);
      const attendance = await this.populateAttendance(event.id, dataSource);

      return {
        ...populated,
        attendance,
      } as IEventDoc;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  /**
   * Find event by conf UUID
   */
  public async findEventByConf(confId: string, dataSource: DataSource): Promise<IEventDoc | null> | never {
    try {
      const eventRepository = dataSource.getRepository(EventEntity);
      // Validate UUID format
      if (!this.uuidRegex.test(confId)) {
        throw new Error("Invalid conf ID format");
      }

      const event = await eventRepository.findOne({
        where: { confId },
        relations: ["lecture", "journal", "conf"],
      });

      if (!event) {
        return null;
      }

      const populated = await this.populatePresenter(event, dataSource);
      const attendance = await this.populateAttendance(event.id, dataSource);

      return {
        ...populated,
        attendance,
      } as IEventDoc;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  /**
   * Batch find events by lecture, journal, or conf UUIDs
   * Returns a map of resourceId -> event for O(1) lookup
   * Accepts both UUID strings and ObjectIds for backward compatibility
   */
  public async findEventsByLectureJournalConfIds(
    lectureIds: (string | any)[],
    journalIds: (string | any)[],
    confIds: (string | any)[],
    dataSource: DataSource
  ): Promise<Map<string, IEventDoc>> | never {
    try {
      const eventRepository = dataSource.getRepository(EventEntity);
      // Convert ObjectIds to strings and filter valid UUIDs
      const normalizeIds = (ids: (string | any)[]): string[] => {
        return ids
          .map(id => {
            // Handle ObjectId (from MongoDB) or string UUID
            if (typeof id === "string" && this.uuidRegex.test(id)) {
              return id;
            }
            if (id && typeof id.toString === "function") {
              const str = id.toString();
              // Check if it's a UUID
              if (this.uuidRegex.test(str)) {
                return str;
              }
            }
            return null;
          })
          .filter((id): id is string => id !== null);
      };

      const normalizedLectureIds = normalizeIds(lectureIds);
      const normalizedJournalIds = normalizeIds(journalIds);
      const normalizedConfIds = normalizeIds(confIds);

      const where: any[] = [];
      if (normalizedLectureIds.length > 0) {
        where.push({ lectureId: In(normalizedLectureIds) });
      }
      if (normalizedJournalIds.length > 0) {
        where.push({ journalId: In(normalizedJournalIds) });
      }
      if (normalizedConfIds.length > 0) {
        where.push({ confId: In(normalizedConfIds) });
      }

      if (where.length === 0) {
        return new Map();
      }

      const events = await eventRepository.find({
        where,
        relations: ["lecture", "journal", "conf"],
      });

      const eventIds = events.map((e) => e.id);
      const attendanceMap = await this.getAttendanceByEventIds(eventIds, dataSource);

      const populatedEvents = await Promise.all(
        events.map(async (event) => {
          const populated = await this.populatePresenter(event, dataSource);
          const attendance = attendanceMap.get(event.id) ?? [];
          return {
            ...populated,
            attendance,
          };
        })
      );

      const eventMap = new Map<string, IEventDoc>();

      for (const event of populatedEvents) {
        // Helper to get ID from either UUID string or populated object
        const getId = (ref: any): string | null => {
          if (!ref) return null;
          if (typeof ref === "string" && this.uuidRegex.test(ref)) {
            return ref;
          }
          if (ref.id) {
            return ref.id;
          }
          if (ref._id) {
            return ref._id.toString();
          }
          return null;
        };

        const lectureId = getId(event.lectureId || event.lecture);
        if (lectureId) {
          eventMap.set(lectureId, event as IEventDoc);
        }

        const journalId = getId(event.journalId || event.journal);
        if (journalId) {
          eventMap.set(journalId, event as IEventDoc);
        }

        const confId = getId(event.confId || event.conf);
        if (confId) {
          eventMap.set(confId, event as IEventDoc);
        }
      }

      return eventMap;
    } catch (err: any) {
      throw new Error(err);
    }
  }
}
