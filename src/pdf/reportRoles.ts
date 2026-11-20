/**
 * Surgical role labels shared by every document that prints `submissions.roleInSurg`
 * (the E-Certificate, the supervisor report and the Logbook Record), so the documents
 * cannot name the same role differently.
 */

/** Role order for documents (matches the frontend): Operator, Operator (Assisted), Assistant, Supervising, Observer. */
export const REPORT_ROLE_ORDER = ["Operator", "Operator (Assisted)", "Assistant", "Supervising", "Observer"];

/** Raw roleInSurg (lowercase) to display label. */
export const REPORT_ROLE_LABELS: Record<string, string> = {
  operator: "Operator",
  "operator with supervisor scrubbed (assisted)": "Operator (Assisted)",
  assistant: "Assistant",
  "supervising, teaching a junior colleague (scrubbed)": "Supervising",
  "observer (scrubbed)": "Observer",
};

export function getReportRoleLabel(roleInSurg: string | undefined | null): string {
  if (!roleInSurg || typeof roleInSurg !== "string") return "Other";
  return REPORT_ROLE_LABELS[roleInSurg.trim().toLowerCase()] ?? roleInSurg.trim();
}
