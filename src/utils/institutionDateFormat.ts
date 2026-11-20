/**
 * Date formatting for documents (PDF reports, certificates) in the institution's own time zone.
 *
 * The server runs in UTC on Railway, so `new Date().toLocaleString()` printed a UTC time in US
 * format on every report ("11/20/2026, 12:05:00 PM"). Documents are read in Cairo, so they are
 * formatted here with an explicit zone and an unambiguous day-month-year pattern instead.
 *
 * The zone matches the eliminator's `INSTITUTION_TIMEZONE` (default Africa/Cairo).
 */

export const INSTITUTION_TIMEZONE = process.env.INSTITUTION_TIMEZONE || "Africa/Cairo";

/** Short label for the zone shown after a time, e.g. "Africa/Cairo" -> "Cairo". */
export function institutionZoneLabel(): string {
  const last = INSTITUTION_TIMEZONE.split("/").pop() || INSTITUTION_TIMEZONE;
  return last.replace(/_/g, " ");
}

/** "20 Nov 2026, 14:05 (Cairo)" for an instant, in the institution's zone. */
export function formatInstitutionDateTime(instant: Date = new Date()): string {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: INSTITUTION_TIMEZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const p = Object.fromEntries(fmt.formatToParts(instant).map((x) => [x.type, x.value]));
  return `${p.day} ${p.month} ${p.year}, ${p.hour}:${p.minute} (${institutionZoneLabel()})`;
}

/** Today's date in the institution's zone as YYYY-MM-DD (for filenames). */
export function institutionTodayIso(): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: INSTITUTION_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(new Date());
}
