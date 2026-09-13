import { AiOfficeActivityType, AiOfficeMemberRole } from "./aiOffice.types";

/** The caller's own AI Office status, read from their DB row (drives the dashboard navigation). */
export interface IAiOfficeMe {
  /** Approved, active, and holding the AI Office role: may use the form and stats. */
  member: boolean;
  role: AiOfficeMemberRole | null;
  aiOfficeMember: boolean;
  approved: boolean;
  /** No mirrored department (signed up with a typed one): the dashboard shows AI Office pages only. */
  departmentless: boolean;
  departmentOther: string | null;
}

/** A member resolved from JWT id + role, then their DB row (never from JWT claims). */
export interface IAiOfficeMember {
  id: string;
  role: AiOfficeMemberRole;
  fullName: string;
  email: string;
  approved: boolean;
  aiOfficeMember: boolean;
  archived: boolean;
  departmentId: string | null;
  departmentOther: string | null;
}

export interface IAiOfficeActivityInput {
  activityType: AiOfficeActivityType;
  title?: string | null;
  status?: string | null;
  activityDate?: string | null;
  notes?: string | null;
  details?: Record<string, unknown> | null;
}

export interface IAiOfficeActivityDoc {
  id: string;
  activityType: AiOfficeActivityType;
  title: string | null;
  status: string | null;
  /** YYYY-MM-DD */
  activityDate: string | null;
  notes: string | null;
  details: Record<string, unknown>;
  /** ISO 8601, UTC */
  createdAt: string;
  updatedAt: string;
}

/** Admin view of an activity: the entry plus who registered it. */
export interface IAiOfficeActivityAdminDoc extends IAiOfficeActivityDoc {
  memberId: string;
  memberRole: AiOfficeMemberRole;
  memberName: string;
  departmentName: string | null;
  departmentArName: string | null;
  departmentOther: string | null;
}

export interface IAiOfficeStats {
  total: number;
  /** Entries whose status is an end state (completed, ready, published). */
  done: number;
  thisQuarter: number;
  lastActivityAt: string | null;
  byType: Array<{ activityType: AiOfficeActivityType; count: number }>;
  byStatus: Array<{ status: string; count: number }>;
  /** The last 12 months including the current one, gap-filled, by registration date. */
  byMonth: Array<{ month: string; count: number }>;
}

export interface IAiOfficeAdminStats extends IAiOfficeStats {
  /** Accounts currently holding the AI Office role. */
  membersTotal: number;
  /** Members with at least one entry in the filtered set. */
  activeMembers: number;
  byMember: Array<{
    memberId: string;
    memberRole: AiOfficeMemberRole;
    memberName: string;
    departmentName: string | null;
    departmentArName: string | null;
    departmentOther: string | null;
    count: number;
    lastActivityAt: string | null;
  }>;
  byDepartment: Array<{
    departmentName: string | null;
    departmentArName: string | null;
    departmentOther: string | null;
    count: number;
  }>;
}

export type TAiOfficeYesNoAll = "all" | "yes" | "no";

export interface IAiOfficeAdminUsersQuery {
  role: AiOfficeMemberRole;
  /** "all", "none" (department-less), or a department uuid. */
  departmentId?: string;
  aiOffice?: TAiOfficeYesNoAll;
  approved?: TAiOfficeYesNoAll;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface IAiOfficeAdminUserRow {
  id: string;
  role: AiOfficeMemberRole;
  fullName: string;
  email: string;
  phoneNum: string;
  approved: boolean;
  aiOfficeMember: boolean;
  departmentId: string | null;
  departmentName: string | null;
  departmentArName: string | null;
  departmentOther: string | null;
  createdAt: string;
  activityCount: number;
  /** Supervisors only. */
  canValidate?: boolean | null;
  canValClin?: boolean | null;
  position?: string | null;
  /** Candidates only. */
  rank?: string | null;
  regDeg?: string | null;
}

export interface IAiOfficeAdminActivitiesQuery {
  activityType?: AiOfficeActivityType;
  status?: string;
  role?: AiOfficeMemberRole;
  memberId?: string;
  departmentId?: string;
  /** YYYY-MM-DD, on the registration date */
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export interface IAiOfficeAccessRequestRow {
  id: string;
  email: string;
  requestedRole: AiOfficeMemberRole;
  existingRole: AiOfficeMemberRole;
  existingUserId: string;
  fullName: string;
  departmentLabel: string | null;
  emailed: boolean;
  createdAt: string;
}

export interface IPaged<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** POST /aiOffice/signup body (after validation). */
export interface IAiOfficeSignupInput {
  role: AiOfficeMemberRole;
  email: string;
  password: string;
  fullName: string;
  phoneNum: string;
  departmentId?: string | null;
  departmentOther?: string | null;
  // candidate
  regNum?: string;
  nationality?: string;
  rank?: string;
  regDeg?: string | null;
  // supervisor
  position?: string | null;
}

export interface IAiOfficeRequestMeta {
  ip: string;
  userAgent?: string;
}

export type TAiOfficeSignupResult =
  | { status: "started"; signupId: string; expiresAt: string; email: string }
  | { status: "email_exists" }
  | { status: "phone_exists" }
  | { status: "signups_closed" };

export type TAiOfficeErrorCode =
  | "NOT_AI_OFFICE_MEMBER"
  | "ACTIVITY_NOT_FOUND"
  | "INVALID_ACTIVITY"
  | "USER_NOT_FOUND"
  | "DEPARTMENTLESS_MEMBER"
  | "UNKNOWN_DEPARTMENT";

/** A business-rule failure; the router maps `code` to an HTTP status. */
export class AiOfficeError extends Error {
  public code: TAiOfficeErrorCode;

  constructor(code: TAiOfficeErrorCode, message: string) {
    super(message);
    this.name = "AiOfficeError";
    this.code = code;
  }
}
