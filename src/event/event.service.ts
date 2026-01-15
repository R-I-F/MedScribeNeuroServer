import { inject, injectable } from "inversify";
import { IEvent, IEventDoc } from "./event.interface";
import { Model, Types } from "mongoose";
import { Event } from "./event.schema";
import { Supervisor } from "../supervisor/supervisor.schema";
import { Cand } from "../cand/cand.schema";

@injectable()
export class EventService {
  private eventModel: Model<IEvent> = Event;

  /**
   * Populates the presenter field based on event type
   * - For lecture and conf: populates from Supervisor
   * - For journal: populates from Candidate
   */
  private async populatePresenter(
    event: IEventDoc | IEventDoc[]
  ): Promise<IEventDoc | IEventDoc[]> {
    const isPresenterPopulated = (presenter: any): boolean => {
      return presenter && typeof presenter === "object" && !(presenter instanceof Types.ObjectId);
    };

    if (Array.isArray(event)) {
      // Handle array of events
      const populatedEvents = await Promise.all(
        event.map(async (e) => {
          // Skip if presenter is already populated
          if (isPresenterPopulated(e.presenter)) {
            return e;
          }

          if (e.presenter && Types.ObjectId.isValid(e.presenter as any)) {
            const presenterId = e.presenter as Types.ObjectId;
            let populatedPresenter;

            if (e.type === "lecture" || e.type === "conf") {
              // Populate from Supervisor
              populatedPresenter = await Supervisor.findById(presenterId)
                .select("_id fullName email phoneNum role position canValidate")
                .exec();
            } else if (e.type === "journal") {
              // Populate from Candidate
              populatedPresenter = await Cand.findById(presenterId)
                .select("_id fullName email phoneNum regNum role")
                .exec();
            }

            if (populatedPresenter) {
              e.presenter = populatedPresenter as any;
            }
          }
          return e;
        })
      );
      return populatedEvents;
    } else {
      // Handle single event
      // Skip if presenter is already populated
      if (isPresenterPopulated(event.presenter)) {
        return event;
      }

      if (event.presenter && Types.ObjectId.isValid(event.presenter as any)) {
        const presenterId = event.presenter as Types.ObjectId;
        let populatedPresenter;

        if (event.type === "lecture" || event.type === "conf") {
          // Populate from Supervisor
          populatedPresenter = await Supervisor.findById(presenterId)
            .select("_id fullName email phoneNum role position canValidate")
            .exec();
        } else if (event.type === "journal") {
          // Populate from Candidate
          populatedPresenter = await Cand.findById(presenterId)
            .select("_id fullName email phoneNum regNum role")
            .exec();
        }

        if (populatedPresenter) {
          event.presenter = populatedPresenter as any;
        }
      }
      return event;
    }
  }

  public async createEvent(eventData: IEvent): Promise<IEventDoc> | never {
    try {
      const newEvent = new this.eventModel(eventData);
      const savedEvent = await newEvent.save();
      return (await this.populatePresenter(savedEvent)) as IEventDoc;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getAllEvents(): Promise<IEventDoc[]> | never {
    try {
      const events = await this.eventModel
        .find()
        .populate("lecture")
        .populate("journal")
        .populate("conf")
        .populate("attendance.candidate")
        .exec();
      return (await this.populatePresenter(events)) as IEventDoc[];
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getEventById(id: string): Promise<IEventDoc | null> | never {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new Error("Invalid event ID");
      }
      const event = await this.eventModel
        .findById(id)
        .populate("lecture")
        .populate("journal")
        .populate("conf")
        .populate("attendance.candidate")
        .exec();
      if (!event) {
        return null;
      }
      return (await this.populatePresenter(event)) as IEventDoc;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async updateEvent(
    id: string,
    updateData: Partial<IEvent>
  ): Promise<IEventDoc | null> | never {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new Error("Invalid event ID");
      }
      const event = await this.eventModel
        .findByIdAndUpdate(id, updateData, { new: true })
        .populate("lecture")
        .populate("journal")
        .populate("conf")
        .populate("attendance.candidate")
        .exec();
      if (!event) {
        return null;
      }
      return (await this.populatePresenter(event)) as IEventDoc;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async deleteEvent(id: string): Promise<boolean> | never {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new Error("Invalid event ID");
      }
      const result = await this.eventModel.findByIdAndDelete(id).exec();
      return result !== null;
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
      if (!Types.ObjectId.isValid(eventId) || !Types.ObjectId.isValid(candidateId)) {
        throw new Error("Invalid event or candidate ID");
      }

      const event = await this.eventModel.findById(eventId).exec();
      if (!event) {
        throw new Error("Event not found");
      }

      // Check if candidate is already in attendance
      const existingAttendance = event.attendance.find(
        (att) => att.candidate.toString() === candidateId
      );
      if (existingAttendance) {
        throw new Error("Candidate is already in attendance");
      }

      // Add new attendance record
      event.attendance.push({
        candidate: new Types.ObjectId(candidateId),
        addedBy: new Types.ObjectId(addedBy),
        addedByRole,
        flagged: false,
        points: 1, // +1 for attendance
        createdAt: new Date(),
      });

      // Update status to "held" if attendance has entries
      if (event.attendance.length > 0) {
        event.status = "held";
      }

      const updatedEvent = await event.save();
      return (await this.populatePresenter(updatedEvent)) as IEventDoc;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  /**
   * Remove candidate from event attendance
   */
  public async removeAttendance(
    eventId: string,
    candidateId: string
  ): Promise<IEventDoc | null> | never {
    try {
      if (!Types.ObjectId.isValid(eventId) || !Types.ObjectId.isValid(candidateId)) {
        throw new Error("Invalid event or candidate ID");
      }

      const event = await this.eventModel.findById(eventId).exec();
      if (!event) {
        throw new Error("Event not found");
      }

      // Remove candidate from attendance
      event.attendance = event.attendance.filter(
        (att) => att.candidate.toString() !== candidateId
      );

      // Update status based on attendance
      if (event.attendance.length === 0) {
        // If no attendees and event date has passed, set to "canceled"
        if (event.dateTime < new Date()) {
          event.status = "canceled";
        } else {
          event.status = "booked";
        }
      }

      const updatedEvent = await event.save();
      return (await this.populatePresenter(updatedEvent)) as IEventDoc;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  /**
   * Flag a candidate in attendance (sets points to -2)
   */
  public async flagAttendance(
    eventId: string,
    candidateId: string,
    flaggedBy: string
  ): Promise<IEventDoc | null> | never {
    try {
      if (!Types.ObjectId.isValid(eventId) || !Types.ObjectId.isValid(candidateId)) {
        throw new Error("Invalid event or candidate ID");
      }

      const event = await this.eventModel.findById(eventId).exec();
      if (!event) {
        throw new Error("Event not found");
      }

      const attendance = event.attendance.find(
        (att) => att.candidate.toString() === candidateId
      );
      if (!attendance) {
        throw new Error("Candidate not found in attendance");
      }

      // Flag the candidate
      attendance.flagged = true;
      attendance.flaggedBy = new Types.ObjectId(flaggedBy);
      attendance.flaggedAt = new Date();
      attendance.points = -2; // -2 for flagged

      const updatedEvent = await event.save();
      return (await this.populatePresenter(updatedEvent)) as IEventDoc;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  /**
   * Unflag a candidate in attendance (sets points back to 1)
   */
  public async unflagAttendance(
    eventId: string,
    candidateId: string
  ): Promise<IEventDoc | null> | never {
    try {
      if (!Types.ObjectId.isValid(eventId) || !Types.ObjectId.isValid(candidateId)) {
        throw new Error("Invalid event or candidate ID");
      }

      const event = await this.eventModel.findById(eventId).exec();
      if (!event) {
        throw new Error("Event not found");
      }

      const attendance = event.attendance.find(
        (att) => att.candidate.toString() === candidateId
      );
      if (!attendance) {
        throw new Error("Candidate not found in attendance");
      }

      // Unflag the candidate
      attendance.flagged = false;
      attendance.flaggedBy = undefined;
      attendance.flaggedAt = undefined;
      attendance.points = 1; // Back to +1

      // Auto-update status: if event has unflagged candidates and status is "booked" or "canceled",
      // automatically change to "held"
      const hasUnflaggedCandidates = event.attendance.some(
        (att) => att.flagged === false
      );
      if (hasUnflaggedCandidates && (event.status === "booked" || event.status === "canceled")) {
        event.status = "held";
      }

      const updatedEvent = await event.save();
      return (await this.populatePresenter(updatedEvent)) as IEventDoc;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  /**
   * Get total points for a candidate across all events
   */
  public async getCandidateTotalPoints(candidateId: string): Promise<number> | never {
    try {
      if (!Types.ObjectId.isValid(candidateId)) {
        throw new Error("Invalid candidate ID");
      }

      const result = await this.eventModel.aggregate([
        { $unwind: "$attendance" },
        { $match: { "attendance.candidate": new Types.ObjectId(candidateId) } },
        { $group: { _id: null, totalPoints: { $sum: "$attendance.points" } } },
      ]);

      return result[0]?.totalPoints || 0;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  /**
   * Find event by lecture ObjectId
   */
  public async findEventByLecture(lectureId: Types.ObjectId): Promise<IEventDoc | null> | never {
    try {
      const event = await this.eventModel
        .findOne({ lecture: lectureId })
        .populate("lecture")
        .populate("journal")
        .populate("conf")
        .populate("attendance.candidate")
        .exec();
      if (!event) {
        return null;
      }
      return (await this.populatePresenter(event)) as IEventDoc;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  /**
   * Find event by journal ObjectId
   */
  public async findEventByJournal(journalId: Types.ObjectId): Promise<IEventDoc | null> | never {
    try {
      const event = await this.eventModel
        .findOne({ journal: journalId })
        .populate("lecture")
        .populate("journal")
        .populate("conf")
        .populate("attendance.candidate")
        .exec();
      if (!event) {
        return null;
      }
      return (await this.populatePresenter(event)) as IEventDoc;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  /**
   * Find event by conf ObjectId
   */
  public async findEventByConf(confId: Types.ObjectId): Promise<IEventDoc | null> | never {
    try {
      const event = await this.eventModel
        .findOne({ conf: confId })
        .populate("lecture")
        .populate("journal")
        .populate("conf")
        .populate("attendance.candidate")
        .exec();
      if (!event) {
        return null;
      }
      return (await this.populatePresenter(event)) as IEventDoc;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  /**
   * Batch find events by lecture, journal, or conf ObjectIds
   * Returns a map of resourceId -> event for O(1) lookup
   */
  public async findEventsByLectureJournalConfIds(
    lectureIds: Types.ObjectId[],
    journalIds: Types.ObjectId[],
    confIds: Types.ObjectId[]
  ): Promise<Map<string, IEventDoc>> | never {
    try {
      const $or: any[] = [];
      if (lectureIds.length > 0) {
        $or.push({ lecture: { $in: lectureIds } });
      }
      if (journalIds.length > 0) {
        $or.push({ journal: { $in: journalIds } });
      }
      if (confIds.length > 0) {
        $or.push({ conf: { $in: confIds } });
      }

      if ($or.length === 0) {
        return new Map();
      }

      const events = await this.eventModel
        .find({ $or })
        .populate("lecture")
        .populate("journal")
        .populate("conf")
        .populate("attendance.candidate")
        .exec();

      const populatedEvents = await this.populatePresenter(events) as IEventDoc[];
      const eventMap = new Map<string, IEventDoc>();

      for (const event of populatedEvents) {
        // Helper to get ID from either ObjectId or populated object
        const getId = (ref: any): string | null => {
          if (!ref) return null;
          if (ref instanceof Types.ObjectId) {
            return ref.toString();
          }
          if (ref._id) {
            return ref._id.toString();
          }
          return null;
        };

        const lectureId = getId(event.lecture);
        if (lectureId) {
          eventMap.set(lectureId, event);
        }

        const journalId = getId(event.journal);
        if (journalId) {
          eventMap.set(journalId, event);
        }

        const confId = getId(event.conf);
        if (confId) {
          eventMap.set(confId, event);
        }
      }

      return eventMap;
    } catch (err: any) {
      throw new Error(err);
    }
  }
}


