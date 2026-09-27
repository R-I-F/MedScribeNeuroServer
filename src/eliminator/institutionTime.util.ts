/**
 * Converts a campaign's wall-clock session time into the UTC instant the rest of
 * the app stores.
 *
 * `eliminator_campaigns.onsiteTime` / `onlineTime` are plain "HH:mm" strings that
 * mean local Cairo time ("the online session starts at 22:00"). `events.dateTime`
 * is a "timestamp without time zone" column, but every other writer (the calendar
 * manager form) fills it with a UTC INSTANT: the browser sends
 * `new Date("<date>T<time>").toISOString()` and Postgres stores the UTC part after
 * dropping the trailing "Z". Every reader then does the inverse, parsing the value
 * as UTC and rendering it in the viewer's timezone.
 *
 * Writing the raw wall clock instead puts the row three hours ahead of its real
 * instant, which pushed the 22:00 online sessions past midnight and made them show
 * up on FRIDAY in Cairo (and locked the Thursday attendance page until then). So
 * the wall clock has to be converted here, with the zone's real offset on that
 * date, which also keeps the Egyptian DST switch (last Thursday of October) honest.
 *
 * The result is returned as an ISO string on purpose: node-postgres serializes a JS
 * Date using the SERVER's local offset, so passing a Date would store a different
 * value on a Cairo dev machine than on UTC Railway. A string is passed through to
 * Postgres verbatim and casts identically everywhere.
 */

const INSTITUTION_TIMEZONE = process.env.INSTITUTION_TIMEZONE || "Africa/Cairo";

/** Milliseconds the zone is ahead of UTC at the given instant. */
function zoneOffsetMs(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant);

  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? "0");
  const asIfUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second")
  );
  // Sub-second precision is irrelevant here and would otherwise leak into the offset.
  return asIfUtc - Math.floor(instant.getTime() / 1000) * 1000;
}

/**
 * "2026-10-08" + "22:00" (Cairo) -> "2026-10-08T19:00:00.000Z".
 * The second pass re-reads the offset at the candidate instant so a session sitting
 * on a DST boundary resolves against the offset actually in force at that moment.
 */
export function institutionWallClockToUtc(dateOnly: string, wallClock: string): string {
  const [year, month, day] = dateOnly.slice(0, 10).split("-").map(Number);
  const [hour, minute] = wallClock.split(":").map(Number);
  const asIfUtc = Date.UTC(year, month - 1, day, hour, minute, 0);

  let instant = asIfUtc - zoneOffsetMs(new Date(asIfUtc), INSTITUTION_TIMEZONE);
  instant = asIfUtc - zoneOffsetMs(new Date(instant), INSTITUTION_TIMEZONE);

  return new Date(instant).toISOString();
}

export { INSTITUTION_TIMEZONE };
