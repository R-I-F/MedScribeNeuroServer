import { Types, Document } from "mongoose";

export type TEventType = "lecture" | "journal" | "conf";
export type TEventStatus = "booked" | "held" | "canceled";
export type TAttendanceAddedByRole = "instituteAdmin" | "supervisor" | "candidate";

export interface IEventAttendance {
  candidate: Types.ObjectId; // Ref: Candidate
  addedBy: Types.ObjectId; // Ref: User (who added the candidate)
  addedByRole: TAttendanceAddedByRole; // Role of who added
  flagged: boolean; // Default: false
  flaggedBy?: Types.ObjectId; // Ref: User (who flagged, if flagged)
  flaggedAt?: Date; // When flagged
  points: number; // +1 if not flagged, -2 if flagged
  createdAt: Date; // When added to attendance
}

export interface IEvent {
  type: TEventType;

  // One of these will be set based on type
  lecture?: Types.ObjectId; // Ref: Lecture
  journal?: Types.ObjectId; // Ref: Journal
  conf?: Types.ObjectId; // Ref: Conf

  dateTime: Date;
  // Location rules:
  // - For lecture & journal: MUST be "Dept" or "Online"
  // - For conf: Can be any string (open)
  location: string;

  // Presenter:
  // - For lecture & conf: MUST be a valid Supervisor ObjectId
  // - For journal: MUST be a valid Candidate ObjectId
  presenter: Types.ObjectId;

  // Attendance: array of attendance records with metadata
  attendance: IEventAttendance[];

  // Status: tracks event lifecycle
  // - "booked": Event is created/scheduled (default)
  // - "held": Event was held (has attendees)
  // - "canceled": Event was canceled (no attendees after event date)
  status: TEventStatus;
}

export interface IEventDoc extends IEvent, Document {
  _id: Types.ObjectId;
}

// Derived types for input operations
export type IEventInput = IEvent;
export type IEventUpdateInput = Partial<IEvent> & { id: string };

// Attendance management input types
export interface IAddAttendanceInput {
  eventId: string;
  candidateId: string;
  addedBy: string; // User ID who is adding
  addedByRole: TAttendanceAddedByRole;
}

export interface IRemoveAttendanceInput {
  eventId: string;
  candidateId: string;
}

export interface IFlagAttendanceInput {
  eventId: string;
  candidateId: string;
  flaggedBy: string; // User ID who is flagging
}

export interface IUnflagAttendanceInput {
  eventId: string;
  candidateId: string;
}


