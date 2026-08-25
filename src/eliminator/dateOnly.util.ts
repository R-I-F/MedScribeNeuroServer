/**
 * Normalizes a Postgres "date" column value to a plain "YYYY-MM-DD" string,
 * independent of the running process's timezone.
 *
 * Two different shapes can show up depending on the query path:
 *  - TypeORM Repository/QueryBuilder reads "date" columns as a string already
 *    (TypeORM's own DateUtils formats it that way specifically to sidestep
 *    this pitfall).
 *  - Raw `dataSource.query()` / `manager.query()` goes straight through
 *    node-postgres's default type parser, which constructs a native `Date`
 *    via LOCAL date components (`new Date(year, month, day)`) - NOT a UTC
 *    instant. Reading it back with UTC getters (e.g. `.toISOString()`) can
 *    shift the calendar day whenever the process isn't running in UTC
 *    (confirmed while verifying the eliminator seed migration on this dev
 *    machine: a plain `.toISOString()` reported Sep 23 for a stored Sep 24
 *    row). The correct inverse is LOCAL getters, matching how it was built.
 */
export function toDateOnlyString(value: string | Date): string {
  if (value instanceof Date) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return String(value).slice(0, 10);
}
