import { injectable } from "inversify";
import { IEvent, IEventDoc, IEventAttendance } from "./event.interface";
import { AppDataSource } from "../config/database.config";
import { EventEntity } from "./event.mDbSchema";
import { EventAttendanceEntity } from "./eventAttendance.mDbSchema";
import { Repository, In } from "typeorm";

@injectable()
export class EventService {
  private eventRepository: Repository<EventEntity>;
  private attendanceRepository: Repository<EventAttendanceEntity>;
  private uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  constructor() {
    this.eventRepository = AppDataSource.getRepository(EventEntity);
    this.attendanceRepository = AppDataSource.getRepository(EventAttendanceEntity);
    // Note: SupervisorService and CandService are not currently needed for presenter population
    // Presenter is populated manually in populatePresenter method
  }

  /**
   * Populates the presenter field based on event type
   * - For lecture and conf: populates from Supervisor
   * - For journal: populates from Candidate
   */
  private async populatePresenter(event: EventEntity | EventEntity[]): Promise<any> {
    if (Array.isArray(event)) {
      return await Promise.all(event.map(e => this.populatePresenter(e)));
    }

    const eventDoc = event as any;
    
    // Populate presenter based on type
    if (event.presenterId) {
      try {
        if (event.type === "lecture" || event.type === "conf") {
          // For lecture/conf: presenter is a Supervisor
          // Note: We'll need to inject SupervisorService to populate this
          // For now, we'll just set the presenterId
          eventDoc.presenter = { id: event.presenterId };
        } else if (event.type === "journal") {
          // For journal: presenter is a Candidate
          // Note: We'll need to inject CandService to populate this
          // For now, we'll just set the presenterId
          eventDoc.presenter = { id: event.presenterId };
        }
      } catch (err) {
        // If population fails, just keep the ID
        eventDoc.presenter = { id: event.presenterId };
      }
    }

    return eventDoc;
  }

  /**
   * Populates attendance records for an event
   */
  private async populateAttendance(eventId: string): Promise<IEventAttendance[]> {
    const attendanceRecords = await this.attendanceRepository.find({
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

  public async createEvent(eventData: IEvent): Promise<IEventDoc> | never {
    try {
      const newEvent = this.eventRepository.create(eventData);
      const savedEvent = await this.eventRepository.save(newEvent);

      // If attendance was provided, create attendance records
      if ((eventData as any).attendance && Array.isArray((eventData as any).attendance)) {
        const attendanceArray = (eventData as any).attendance as IEventAttendance[];
        for (const att of attendanceArray) {
          const attendanceRecord = this.attendanceRepository.create({
            eventId: savedEvent.id,
            candidateId: att.candidateId,
            addedBy: att.addedBy,
            addedByRole: att.addedByRole,
            flagged: att.flagged || false,
            flaggedBy: att.flaggedBy || undefined,
            flaggedAt: att.flaggedAt || undefined,
            points: att.points || 1,
          });
          await this.attendanceRepository.save(attendanceRecord);
        }
      }

      // Update status if attendance was provided
      if ((eventData as any).attendance && Array.isArray((eventData as any).attendance) && (eventData as any).attendance.length > 0) {
        await this.eventRepository.update(savedEvent.id, { status: "held" });
        savedEvent.status = "held";
      }

      // Load relations and populate
      const eventWithRelations = await this.eventRepository.findOne({
        where: { id: savedEvent.id },
        relations: ["lecture", "journal", "conf"],
      });

      if (!eventWithRelations) {
        throw new Error("Failed to load created event");
      }

      const populated = await this.populatePresenter(eventWithRelations);
      const attendance = await this.populateAttendance(savedEvent.id);

      return {
        ...populated,
        attendance,
      } as IEventDoc;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getAllEvents(): Promise<IEventDoc[]> | never {
    try {
      const events = await this.eventRepository.find({
        relations: ["lecture", "journal", "conf"],
        order: { createdAt: "DESC" },
      });

      const populatedEvents = await Promise.all(
        events.map(async (event) => {
          const populated = await this.populatePresenter(event);
          const attendance = await this.populateAttendance(event.id);
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

  public async getEventById(id: string): Promise<IEventDoc | null> | never {
    try {
      // Validate UUID format
      if (!this.uuidRegex.test(id)) {
        throw new Error("Invalid event ID format");
      }

      const event = await this.eventRepository.findOne({
        where: { id },
        relations: ["lecture", "journal", "conf"],
      });

      if (!event) {
        return null;
      }

      const populated = await this.populatePresenter(event);
      const attendance = await this.populateAttendance(id);

      return {
        ...populated,
        attendance,
      } as IEventDoc;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async updateEvent(id: string, updateData: Partial<IEvent>): Promise<IEventDoc | null> | never {
    try {
      // Validate UUID format
      if (!this.uuidRegex.test(id)) {
        throw new Error("Invalid event ID format");
      }

      // Handle attendance separately if provided
      if ((updateData as any).attendance !== undefined) {
        const attendanceArray = (updateData as any).attendance as IEventAttendance[];
        
        // Delete all existing attendance
        await this.attendanceRepository.delete({ eventId: id });
        
        // Create new attendance records
        for (const att of attendanceArray) {
          const attendanceRecord = this.attendanceRepository.create({
            eventId: id,
            candidateId: att.candidateId,
            addedBy: att.addedBy,
            addedByRole: att.addedByRole,
            flagged: att.flagged || false,
            flaggedBy: att.flaggedBy || undefined,
            flaggedAt: att.flaggedAt || undefined,
            points: att.points || 1,
          });
          await this.attendanceRepository.save(attendanceRecord);
        }

        // Update status based on attendance
        if (attendanceArray.length > 0) {
          updateData.status = "held";
        } else {
          // Check if event date has passed
          const currentEvent = await this.eventRepository.findOne({ where: { id } });
          if (currentEvent && currentEvent.dateTime < new Date()) {
            updateData.status = "canceled";
          } else {
            updateData.status = "booked";
          }
        }

        // Remove attendance from updateData to avoid conflicts
        delete (updateData as any).attendance;
      }

      // Update event fields
      await this.eventRepository.update(id, updateData);

      // Load updated event with relations
      const updatedEvent = await this.eventRepository.findOne({
        where: { id },
        relations: ["lecture", "journal", "conf"],
      });

      if (!updatedEvent) {
        return null;
      }

      const populated = await this.populatePresenter(updatedEvent);
      const attendance = await this.populateAttendance(id);

      return {
        ...populated,
        attendance,
      } as IEventDoc;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async deleteEvent(id: string): Promise<boolean> | never {
    try {
      // Validate UUID format
      if (!this.uuidRegex.test(id)) {
        throw new Error("Invalid event ID format");
      }

      // Attendance will be deleted automatically via CASCADE
      const result = await this.eventRepository.delete(id);
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
    addedByRole: "instituteAdmin" | "supervisor" | "candidate"
  ): Promise<IEventDoc | null> | never {
    try {
      // Validate UUID formats
      if (!this.uuidRegex.test(eventId) || !this.uuidRegex.test(candidateId) || !this.uuidRegex.test(addedBy)) {
        throw new Error("Invalid event, candidate, or user ID format");
      }

      const event = await this.eventRepository.findOne({ where: { id: eventId } });
      if (!event) {
        throw new Error("Event not found");
      }

      // Check if candidate is already in attendance
      const existingAttendance = await this.attendanceRepository.findOne({
        where: { eventId, candidateId },
      });
      if (existingAttendance) {
        throw new Error("Candidate is already in attendance");
      }

      // Create new attendance record
      await this.attendanceRepository.save({
        eventId,
        candidateId,
        addedBy,
        addedByRole,
        flagged: false,
        points: 1, // +1 for attendance
      });

      // Update status to "held" if event has attendees
      const attendanceCount = await this.attendanceRepository.count({ where: { eventId } });
      if (attendanceCount > 0) {
        await this.eventRepository.update(eventId, { status: "held" });
        event.status = "held";
      }

      // Load event with relations
      const eventWithRelations = await this.eventRepository.findOne({
        where: { id: eventId },
        relations: ["lecture", "journal", "conf"],
      });

      if (!eventWithRelations) {
        throw new Error("Failed to load updated event");
      }

      const populated = await this.populatePresenter(eventWithRelations);
      const attendance = await this.populateAttendance(eventId);

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
  public async removeAttendance(eventId: string, candidateId: string): Promise<IEventDoc | null> | never {
    try {
      // Validate UUID formats
      if (!this.uuidRegex.test(eventId) || !this.uuidRegex.test(candidateId)) {
        throw new Error("Invalid event or candidate ID format");
      }

      const event = await this.eventRepository.findOne({ where: { id: eventId } });
      if (!event) {
        throw new Error("Event not found");
      }

      // Delete attendance record
      await this.attendanceRepository.delete({ eventId, candidateId });

      // Update status based on attendance
      const attendanceCount = await this.attendanceRepository.count({ where: { eventId } });
      if (attendanceCount === 0) {
        // If no attendees and event date has passed, set to "canceled"
        if (event.dateTime < new Date()) {
          await this.eventRepository.update(eventId, { status: "canceled" });
          event.status = "canceled";
        } else {
          await this.eventRepository.update(eventId, { status: "booked" });
          event.status = "booked";
        }
      }

      // Load event with relations
      const eventWithRelations = await this.eventRepository.findOne({
        where: { id: eventId },
        relations: ["lecture", "journal", "conf"],
      });

      if (!eventWithRelations) {
        throw new Error("Failed to load updated event");
      }

      const populated = await this.populatePresenter(eventWithRelations);
      const attendance = await this.populateAttendance(eventId);

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
  public async flagAttendance(eventId: string, candidateId: string, flaggedBy: string): Promise<IEventDoc | null> | never {
    try {
      // Validate UUID formats
      if (!this.uuidRegex.test(eventId) || !this.uuidRegex.test(candidateId) || !this.uuidRegex.test(flaggedBy)) {
        throw new Error("Invalid event, candidate, or user ID format");
      }

      const event = await this.eventRepository.findOne({ where: { id: eventId } });
      if (!event) {
        throw new Error("Event not found");
      }

      const attendance = await this.attendanceRepository.findOne({
        where: { eventId, candidateId },
      });
      if (!attendance) {
        throw new Error("Candidate not found in attendance");
      }

      // Flag the candidate
      await this.attendanceRepository.update(
        { eventId, candidateId },
        {
          flagged: true,
          flaggedBy,
          flaggedAt: new Date(),
          points: -2, // -2 for flagged
        }
      );

      // Load event with relations
      const eventWithRelations = await this.eventRepository.findOne({
        where: { id: eventId },
        relations: ["lecture", "journal", "conf"],
      });

      if (!eventWithRelations) {
        throw new Error("Failed to load updated event");
      }

      const populated = await this.populatePresenter(eventWithRelations);
      const attendanceRecords = await this.populateAttendance(eventId);

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
  public async unflagAttendance(eventId: string, candidateId: string): Promise<IEventDoc | null> | never {
    try {
      // Validate UUID formats
      if (!this.uuidRegex.test(eventId) || !this.uuidRegex.test(candidateId)) {
        throw new Error("Invalid event or candidate ID format");
      }

      const event = await this.eventRepository.findOne({ where: { id: eventId } });
      if (!event) {
        throw new Error("Event not found");
      }

      const attendance = await this.attendanceRepository.findOne({
        where: { eventId, candidateId },
      });
      if (!attendance) {
        throw new Error("Candidate not found in attendance");
      }

      // Unflag the candidate
      await this.attendanceRepository.update(
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
      const unflaggedCount = await this.attendanceRepository.count({
        where: { eventId, flagged: false },
      });
      if (unflaggedCount > 0 && (event.status === "booked" || event.status === "canceled")) {
        await this.eventRepository.update(eventId, { status: "held" });
        event.status = "held";
      }

      // Load event with relations
      const eventWithRelations = await this.eventRepository.findOne({
        where: { id: eventId },
        relations: ["lecture", "journal", "conf"],
      });

      if (!eventWithRelations) {
        throw new Error("Failed to load updated event");
      }

      const populated = await this.populatePresenter(eventWithRelations);
      const attendanceRecords = await this.populateAttendance(eventId);

      return {
        ...populated,
        attendance: attendanceRecords,
      } as IEventDoc;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  /**
   * Get total points for a candidate across all events
   */
  public async getCandidateTotalPoints(candidateId: string): Promise<number> | never {
    try {
      // Validate UUID format
      if (!this.uuidRegex.test(candidateId)) {
        throw new Error("Invalid candidate ID format");
      }

      const attendanceRecords = await this.attendanceRepository.find({
        where: { candidateId },
      });

      const totalPoints = attendanceRecords.reduce((sum, att) => sum + att.points, 0);
      return totalPoints;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  /**
   * Find event by lecture UUID
   */
  public async findEventByLecture(lectureId: string): Promise<IEventDoc | null> | never {
    try {
      // Validate UUID format
      if (!this.uuidRegex.test(lectureId)) {
        throw new Error("Invalid lecture ID format");
      }

      const event = await this.eventRepository.findOne({
        where: { lectureId },
        relations: ["lecture", "journal", "conf"],
      });

      if (!event) {
        return null;
      }

      const populated = await this.populatePresenter(event);
      const attendance = await this.populateAttendance(event.id);

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
  public async findEventByJournal(journalId: string): Promise<IEventDoc | null> | never {
    try {
      // Validate UUID format
      if (!this.uuidRegex.test(journalId)) {
        throw new Error("Invalid journal ID format");
      }

      const event = await this.eventRepository.findOne({
        where: { journalId },
        relations: ["lecture", "journal", "conf"],
      });

      if (!event) {
        return null;
      }

      const populated = await this.populatePresenter(event);
      const attendance = await this.populateAttendance(event.id);

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
  public async findEventByConf(confId: string): Promise<IEventDoc | null> | never {
    try {
      // Validate UUID format
      if (!this.uuidRegex.test(confId)) {
        throw new Error("Invalid conf ID format");
      }

      const event = await this.eventRepository.findOne({
        where: { confId },
        relations: ["lecture", "journal", "conf"],
      });

      if (!event) {
        return null;
      }

      const populated = await this.populatePresenter(event);
      const attendance = await this.populateAttendance(event.id);

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
    confIds: (string | any)[]
  ): Promise<Map<string, IEventDoc>> | never {
    try {
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

      const events = await this.eventRepository.find({
        where,
        relations: ["lecture", "journal", "conf"],
      });

      const populatedEvents = await Promise.all(
        events.map(async (event) => {
          const populated = await this.populatePresenter(event);
          const attendance = await this.populateAttendance(event.id);
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
