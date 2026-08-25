export interface IEliminatorCampaignDoc {
  id: string;
  label: string;
  departmentId: string;
  slotsPerDay: number;
  minPerSupervisor: number;
  maxPerSupervisor: number;
  onsiteTime: string;
  onlineTime: string;
  isActive: boolean;
}

export interface IEliminatorSupervisorOption {
  id: string;
  fullName: string;
}

export interface IEliminatorTopicOption {
  id: string;
  title: string;
  sortOrder: number;
}

export interface IEliminatorLectureOption {
  id: string;
  title: string;
  topicId: string;
  lectureNumber: string | null;
  sortOrder: number | null;
}

export interface IEliminatorSlotOption {
  id: string;
  date: string;
  isOnline: boolean;
  remaining: number;
}

export interface IEliminatorState {
  campaign: {
    id: string;
    label: string;
    minPerSupervisor: number;
    maxPerSupervisor: number;
  };
  topics: IEliminatorTopicOption[];
  lectures: IEliminatorLectureOption[];
  slots: IEliminatorSlotOption[];
}

export interface IEliminatorSupervisorStatus {
  supervisor: IEliminatorSupervisorOption;
  reservations: IEliminatorReservationSummary[];
  remainingCap: number;
  minPerSupervisor: number;
  maxPerSupervisor: number;
}

export interface IEliminatorReservationSummary {
  reservationId: string;
  lectureId: string;
  lectureTitle: string;
  topicTitle: string;
  date: string;
  isOnline: boolean;
  eventId: string | null;
}

export interface IEliminatorSelection {
  lectureId: string;
  slotId: string;
}

export interface IEliminatorReserveInput {
  supervisorId: string;
  selections: IEliminatorSelection[];
}

export type TEliminatorConflictCode =
  | "SUPERVISOR_NOT_FOUND"
  | "MIN_NOT_MET"
  | "CAP_EXCEEDED"
  | "DUPLICATE_SELECTION"
  | "LECTURE_TAKEN"
  | "SLOT_FULL"
  | "LECTURE_NOT_FOUND"
  | "SLOT_NOT_FOUND";

export class EliminatorConflictError extends Error {
  public code: TEliminatorConflictCode;
  public lectureId?: string;
  public slotId?: string;

  constructor(code: TEliminatorConflictCode, message: string, extra?: { lectureId?: string; slotId?: string }) {
    super(message);
    this.name = "EliminatorConflictError";
    this.code = code;
    this.lectureId = extra?.lectureId;
    this.slotId = extra?.slotId;
  }
}
