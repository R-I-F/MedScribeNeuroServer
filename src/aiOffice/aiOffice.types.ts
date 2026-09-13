/**
 * The AI Office activity form (docs/AI_OFFICE_PLAN.md), stated once.
 *
 * Mirrors the "AI Office - Activity Registration" Google Form section by section. Read from the
 * form's own data on 2026-09-13: every question there is optional, so only the activity type is
 * required here (the form cannot branch without it). Validation, the list views and the
 * statistics all read this map, so a new status or field is added in exactly one place (plus the
 * frontend copy in src/lib/aiOfficeActivities.ts).
 */

export const AI_OFFICE_ACTIVITY_TYPES = [
  "project_review",
  "journal_club",
  "symposium",
  "partner_meeting",
  "qualification",
  "project_study",
  "other_task",
] as const;

export type AiOfficeActivityType = (typeof AI_OFFICE_ACTIVITY_TYPES)[number];

export type AiOfficeDetailKind = "text" | "boolean";

export interface IAiOfficeActivityDef {
  /** The section's name/title question maps to the `title` column. */
  hasTitle: boolean;
  /** Allowed `status` values; empty when the section has no status question. */
  statuses: readonly string[];
  /** Every section has one date question; it maps to `activityDate`. */
  hasDate: boolean;
  /** "Notes / Comments" maps to `notes`; the partner meeting section has none. */
  hasNotes: boolean;
  /** The section's remaining questions, stored in `details`. */
  detailFields: readonly { key: string; kind: AiOfficeDetailKind }[];
}

export const AI_OFFICE_ACTIVITY_DEFS: Record<AiOfficeActivityType, IAiOfficeActivityDef> = {
  project_review: {
    hasTitle: true,
    statuses: ["not_started", "in_progress", "completed"],
    hasDate: true,
    hasNotes: true,
    detailFields: [{ key: "description", kind: "text" }],
  },
  journal_club: {
    hasTitle: true,
    statuses: ["not_started", "in_progress", "ready"],
    hasDate: true,
    hasNotes: true,
    detailFields: [{ key: "presenters", kind: "text" }],
  },
  symposium: {
    hasTitle: false,
    statuses: ["not_started", "in_progress", "ready"],
    hasDate: true,
    hasNotes: true,
    detailFields: [
      { key: "proposedTopics", kind: "text" },
      { key: "roleInPreparation", kind: "text" },
    ],
  },
  partner_meeting: {
    hasTitle: true,
    statuses: [],
    hasDate: true,
    hasNotes: false,
    detailFields: [
      { key: "purpose", kind: "text" },
      { key: "outcome", kind: "text" },
      { key: "followUpNeeded", kind: "boolean" },
    ],
  },
  qualification: {
    hasTitle: true,
    statuses: ["enrolled", "in_progress", "completed"],
    hasDate: true,
    hasNotes: true,
    detailFields: [{ key: "provider", kind: "text" }],
  },
  project_study: {
    hasTitle: true,
    statuses: ["planning", "data_collection", "analysis", "writing", "submitted", "published"],
    hasDate: true,
    hasNotes: true,
    detailFields: [
      { key: "topicField", kind: "text" },
      { key: "yourRole", kind: "text" },
    ],
  },
  other_task: {
    hasTitle: false,
    statuses: ["not_started", "in_progress", "completed"],
    hasDate: true,
    hasNotes: true,
    detailFields: [{ key: "taskDescription", kind: "text" }],
  },
};

/** Statuses that mean the activity reached its end state, for the "done" counters. */
export const AI_OFFICE_DONE_STATUSES: readonly string[] = ["completed", "ready", "published"];

/** Paragraph answers are free text; this only stops abuse, not normal long answers. */
export const AI_OFFICE_TEXT_MAX = 5000;

export type AiOfficeMemberRole = "candidate" | "supervisor";

export const isAiOfficeActivityType = (value: unknown): value is AiOfficeActivityType =>
  typeof value === "string" && (AI_OFFICE_ACTIVITY_TYPES as readonly string[]).includes(value);
