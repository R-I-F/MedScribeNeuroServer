// Removed: import { Types, Document } from "mongoose"; - Now using UUIDs directly for MariaDB

export type TEventType = "lecture" | "journal" | "conf";
export type TEventStatus = "booked" | "held" | "canceled";
export type TAttendanceAddedByRole = "instituteAdmin" | "supervisor" | "candidate";

export interface IEventAttendance {
  id?: string; // UUID (for populated records)
  candidateId: string; // UUID ref: Candidate
  candidate?: any; // Populated candidate when relations loaded
  addedBy: string; // UUID ref: User (who added the candidate)
  addedByRole: TAttendanceAddedByRole; // Role of who added
  flagged: boolean; // Default: false
  flaggedBy?: string; // UUID ref: User (who flagged, if flagged)
  flaggedAt?: Date; // When flagged
  points: number; // +1 if not flagged, -2 if flagged
  createdAt: Date; // When added to attendance
}

export interface IEvent {
  type: TEventType;

  // One of these will be set based on type
  lectureId?: string; // UUID ref: Lecture
  journalId?: string; // UUID ref: Journal
  confId?: string; // UUID ref: Conf

  dateTime: Date;
  // Location rules:
  // - For lecture & journal: MUST be "Dept" or "Online"
  // - For conf: Can be any string (open)
  location: string;

  // Presenter:
  // - For lecture & conf: MUST be a valid Supervisor UUID
  // - For journal: MUST be a valid Candidate UUID
  presenterId: string;

  // Status: tracks event lifecycle
  // - "booked": Event is created/scheduled (default)
  // - "held": Event was held (has attendees)
  // - "canceled": Event was canceled (no attendees after event date)
  status: TEventStatus;
}

export interface IEventDoc extends IEvent {
  id: string; // UUID (replaces _id from MongoDB Document)
  createdAt: Date;
  updatedAt: Date;
  
  // Populated relations
  lecture?: any; // Populated lecture when relations loaded
  journal?: any; // Populated journal when relations loaded
  conf?: any; // Populated conf when relations loaded
  presenter?: any; // Populated presenter (Supervisor or Candidate) when loaded
  attendance?: IEventAttendance[]; // Populated attendance when relations loaded
}

// Derived types for input operations
// Accept legacy field names for backward compatibility
export type IEventInput = Omit<IEvent, 'lectureId' | 'journalId' | 'confId' | 'presenterId'> & {
  lecture?: string; // Accept 'lecture' in input, convert to 'lectureId' internally
  journal?: string; // Accept 'journal' in input, convert to 'journalId' internally
  conf?: string; // Accept 'conf' in input, convert to 'confId' internally
  presenter: string; // Accept 'presenter' in input, convert to 'presenterId' internally
  attendance?: IEventAttendance[]; // Optional attendance for create
};
export type IEventUpdateInput = Partial<Omit<IEvent, 'lectureId' | 'journalId' | 'confId' | 'presenterId'>> & {
  id: string;
  lecture?: string; // Accept 'lecture' in update
  journal?: string; // Accept 'journal' in update
  conf?: string; // Accept 'conf' in update
  presenter?: string; // Accept 'presenter' in update
  attendance?: IEventAttendance[]; // Optional attendance for update
};

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

/** GET /event/candidate/points response: event-level points and totals */
export type TEventTypePublic = "lecture" | "journal" | "conference";

export interface IEventPointsPresenter {
  presenterId: string;
  name: string;
  role: "candidate" | "supervisor";
  rank?: string;
  position?: string;
}

export interface IEventPointsEvent {
  id: string;
  title: string;
}

export interface IEventPointsItem {
  eventId: string;
  type: TEventTypePublic;
  presenter: IEventPointsPresenter;
  event: IEventPointsEvent;
  points: number;
}

export interface ICandidateEventPointsResponse {
  events: IEventPointsItem[];
  totalPoints: number;
}


