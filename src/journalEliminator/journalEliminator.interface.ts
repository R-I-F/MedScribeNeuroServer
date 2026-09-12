export interface IJournalOption {
  id: string;
  journalTitle: string;
  pdfLink: string;
}

export interface IJournalSlotOption {
  id: string;
  date: string;
  isOnline: boolean;
}

export interface IJournalReservationSummary {
  reservationId: string;
  journalId: string;
  journalTitle: string;
  pdfLink: string;
  date: string;
  isOnline: boolean;
  eventId: string | null;
}

/**
 * What the candidate dashboard renders. `open: false` is a complete answer on its
 * own (super-admin closed the round, or the department has no campaign) - the
 * pool fields are then empty rather than absent, so the page never branches on
 * undefined.
 */
export interface IJournalEliminatorState {
  open: boolean;
  campaign: { id: string; label: string } | null;
  /** The candidate's own claim, if they already booked. Non-null means the form is done. */
  myReservation: IJournalReservationSummary | null;
  journals: IJournalOption[];
  slots: IJournalSlotOption[];
}

export interface IJournalReserveInput {
  journalId: string;
  slotId: string;
}

export type TJournalEliminatorConflictCode =
  | "CANDIDATE_NOT_FOUND"
  | "JOURNALS_CLOSED"
  | "NO_CAMPAIGN"
  | "ALREADY_RESERVED"
  | "JOURNAL_TAKEN"
  | "JOURNAL_NOT_FOUND"
  | "JOURNAL_ALREADY_PRESENTED"
  | "SLOT_FULL"
  | "SLOT_NOT_FOUND";

export class JournalEliminatorConflictError extends Error {
  public code: TJournalEliminatorConflictCode;
  public journalId?: string;
  public slotId?: string;

  constructor(
    code: TJournalEliminatorConflictCode,
    message: string,
    extra?: { journalId?: string; slotId?: string }
  ) {
    super(message);
    this.name = "JournalEliminatorConflictError";
    this.code = code;
    this.journalId = extra?.journalId;
    this.slotId = extra?.slotId;
  }
}

/** Super-admin console row: one campaign plus how full its journal round is. */
export interface IJournalCampaignAdminRow {
  id: string;
  label: string;
  departmentId: string;
  departmentCode: string | null;
  journalsOpen: boolean;
  isActive: boolean;
  totalSeats: number;
  reservedSeats: number;
  journalsAvailable: number;
}
