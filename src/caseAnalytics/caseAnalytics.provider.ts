import { injectable } from "inversify";
import { DataSource } from "typeorm";

/**
 * Case Analytics provider (docs/CASE_ANALYTICS_TOOL_PLAN.md).
 *
 * Reads EXCLUSIVELY from `cal_surgs` (the surgical cases the calendar manager registers) plus its
 * reference joins (`hospitals`, `proc_cpts`, `main_diag_procs`, `main_diags`). No write path.
 *
 * Aggregation happens in Postgres, never in Node. The endpoint this supersedes
 * (`/instituteAdmin/calendarProcedures/analysis/hospital`) loaded every matching row into memory
 * and then skipped any case without a procCpt, which silently dropped 970 of 6,443 cases.
 *
 * Two invariants worth keeping in mind when editing:
 *
 * 1. ONE filtered CTE feeds every breakdown. The mainDiag filter is applied with EXISTS so it can
 *    never fan out rows. Only `byMainDiag` joins the M2M and therefore double-counts, which is a
 *    deliberate, user-approved behaviour (44 of the 100 NS-linked procedures belong to 2 or more
 *    mainDiags, so a craniotomy is simultaneously tumors, trauma, vascular and infection). The
 *    response reports `mainDiagCategorySum` next to `totalCases` so it is visible, not implied.
 *
 * 2. Real data is dirty and is never dropped silently. 16 rows have a dob after the procedure date
 *    and 3 imply an age over 110: those land in the `unknown` age band. 7 rows are dated before
 *    2015 (one reads 0202-07-29), which is why the monthly axis is CLAMPED (see buildMonthlyAxis).
 */

export type AgeBand =
  | "under1"
  | "age1to2"
  | "age3to12"
  | "age13to17"
  | "age18to39"
  | "age40to59"
  | "age60plus"
  | "unknown";

export const AGE_BANDS: AgeBand[] = [
  "under1",
  "age1to2",
  "age3to12",
  "age13to17",
  "age18to39",
  "age40to59",
  "age60plus",
  "unknown",
];

/** The bands that make up the pediatric roll-up the department head asked for. */
const PEDIATRIC_BANDS: AgeBand[] = ["under1", "age1to2", "age3to12", "age13to17"];

/**
 * Sentinel accepted by the alphaCode filter to mean "cases with no procedure recorded at all"
 * (970 of them). Without it those cases would be unreachable by any procedure-side filter.
 */
export const UNRECORDED_PROC = "__unrecorded__";

/** A procDate outside this window is a data-entry error, reported but never dropped. */
const PLAUSIBLE_DATE_FROM = "2015-01-01";

/** Hard cap on gap-filled monthly buckets, so one row dated 0202 cannot generate 21,000 rows. */
const MAX_MONTH_BUCKETS = 120;

export interface CaseAnalyticsFilters {
  from?: string | null;
  to?: string | null;
  hospitalIds?: string[] | null;
  procCptIds?: string[] | null;
  alphaCodes?: string[] | null;
  mainDiagIds?: string[] | null;
  ageBands?: AgeBand[] | null;
  gender?: "male" | "female" | null;
}

interface Scope {
  /** `WITH f AS (...)` text: the filtered case set every breakdown reads. */
  cte: string;
  params: any[];
}

@injectable()
export class CaseAnalyticsProvider {
  /**
   * SQL expression yielding whole years of age at the time of the procedure, or NULL when the
   * dob cannot be trusted (missing, after the procedure, or implying an age over 110).
   */
  private static readonly AGE_YEARS_SQL = `
    CASE
      WHEN cs."patientDob" IS NULL OR cs."patientDob" > cs."procDate" THEN NULL
      WHEN date_part('year', age(cs."procDate", cs."patientDob")) > 110 THEN NULL
      ELSE date_part('year', age(cs."procDate", cs."patientDob"))
    END`;

  private static readonly AGE_BAND_SQL = `
    CASE
      WHEN a.age_years IS NULL      THEN 'unknown'
      WHEN a.age_years < 1          THEN 'under1'
      WHEN a.age_years < 3          THEN 'age1to2'
      WHEN a.age_years < 13         THEN 'age3to12'
      WHEN a.age_years < 18         THEN 'age13to17'
      WHEN a.age_years < 40         THEN 'age18to39'
      WHEN a.age_years < 60         THEN 'age40to59'
      ELSE 'age60plus'
    END`;

  /**
   * Builds the shared filtered-case CTE plus its bound parameters.
   *
   * Semantics: within one filter the values are OR'd, across filters they are AND'd. A NULL array
   * means "this filter is not applied", which is why every array predicate is written as
   * `($n IS NULL OR ...)` rather than relying on an empty array.
   *
   * `departmentId` is the auto-lock and is resolved from the admin's DB row by the controller.
   * NULL means institution-wide (a department-less admin row, or a superAdmin with no admin row).
   */
  private buildScope(f: CaseAnalyticsFilters, departmentId: string | null): Scope {
    const alphaCodes = f.alphaCodes ?? null;
    const wantsUnrecorded = !!alphaCodes && alphaCodes.includes(UNRECORDED_PROC);
    const realAlphaCodes = alphaCodes ? alphaCodes.filter((c) => c !== UNRECORDED_PROC) : null;

    const params: any[] = [
      departmentId, // $1
      f.from ?? null, // $2
      f.to ?? null, // $3
      f.hospitalIds ?? null, // $4
      f.procCptIds ?? null, // $5
      realAlphaCodes && realAlphaCodes.length ? realAlphaCodes : null, // $6
      f.mainDiagIds ?? null, // $7
      f.ageBands ?? null, // $8
      f.gender ?? null, // $9
      wantsUnrecorded, // $10
    ];

    // The alphaCode predicate has to admit the "no procedure recorded" sentinel, which is a NULL
    // procCptId rather than any alphaCode value.
    const alphaPredicate = `(
         ($6::text[] IS NULL AND $10::boolean = false)
      OR ($6::text[] IS NOT NULL AND p."alphaCode" = ANY($6))
      OR ($10::boolean = true AND cs."procCptId" IS NULL)
    )`;

    const cte = `
      WITH a AS (
        SELECT
          cs."id",
          cs."procDate",
          cs."gender",
          cs."hospitalId",
          cs."departmentId",
          cs."procCptId",
          cs."patientName",
          cs."patientNameAr",
          cs."patientNameEn",
          cs."patientDob",
          p."alphaCode",
          p."numCode",
          p."title"   AS proc_title,
          p."arTitle" AS proc_ar_title,
          ${CaseAnalyticsProvider.AGE_YEARS_SQL} AS age_years
        FROM "cal_surgs" cs
        LEFT JOIN "proc_cpts" p ON p."id" = cs."procCptId"
        WHERE ($1::uuid IS NULL OR cs."departmentId" = $1)
          AND ($2::date IS NULL OR cs."procDate" >= $2::date)
          AND ($3::date IS NULL OR cs."procDate" <= $3::date)
          AND ($4::uuid[] IS NULL OR cs."hospitalId" = ANY($4))
          AND ($5::uuid[] IS NULL OR cs."procCptId" = ANY($5))
          AND ${alphaPredicate}
          AND ($9::text IS NULL OR cs."gender"::text = $9)
          AND ($7::uuid[] IS NULL OR EXISTS (
                SELECT 1 FROM "main_diag_procs" mdp
                WHERE mdp."procCptId" = cs."procCptId"
                  AND mdp."mainDiagId" = ANY($7)
              ))
      ),
      f AS (
        SELECT a.*, ${CaseAnalyticsProvider.AGE_BAND_SQL} AS age_band
        FROM a
      ),
      fs AS (
        SELECT * FROM f
        WHERE ($8::text[] IS NULL OR f.age_band = ANY($8))
      )`;

    return { cte, params };
  }

  /**
   * Option lists for the filter panel, scoped to the caller's department.
   *
   * Procedures and alphaCodes are restricted to those that ACTUALLY occur in the department's
   * cases (and carry their case counts), because offering all 1,436 mirrored procedures when only
   * 8 alphaCode families are in use would be noise. mainDiags come from the department's reference
   * mirror, since a category with no cases yet is still a legitimate thing to filter on.
   */
  public async getFilters(dataSource: DataSource, departmentId: string | null) {
    const [hospitals, procedures, alphaCodes, mainDiags, bounds, dept] = await Promise.all([
      dataSource.query(
        `SELECT h."id", h."engName", h."arabName", count(cs."id")::int AS cases
         FROM "hospitals" h
         LEFT JOIN "cal_surgs" cs ON cs."hospitalId" = h."id"
         WHERE ($1::uuid IS NULL OR h."departmentId" = $1)
         GROUP BY h."id", h."engName", h."arabName"
         ORDER BY cases DESC, h."engName"`,
        [departmentId]
      ),
      dataSource.query(
        `SELECT p."id", p."title", p."arTitle", p."alphaCode", p."numCode", count(*)::int AS cases
         FROM "cal_surgs" cs
         JOIN "proc_cpts" p ON p."id" = cs."procCptId"
         WHERE ($1::uuid IS NULL OR cs."departmentId" = $1)
         GROUP BY p."id", p."title", p."arTitle", p."alphaCode", p."numCode"
         ORDER BY cases DESC, p."title"`,
        [departmentId]
      ),
      dataSource.query(
        `SELECT coalesce(p."alphaCode", $2) AS "alphaCode", count(*)::int AS cases
         FROM "cal_surgs" cs
         LEFT JOIN "proc_cpts" p ON p."id" = cs."procCptId"
         WHERE ($1::uuid IS NULL OR cs."departmentId" = $1)
         GROUP BY 1
         ORDER BY cases DESC`,
        [departmentId, UNRECORDED_PROC]
      ),
      dataSource.query(
        `SELECT md."id", md."title", md."arTitle"
         FROM "main_diags" md
         WHERE ($1::uuid IS NULL OR md."departmentId" = $1)
         ORDER BY md."title"`,
        [departmentId]
      ),
      dataSource.query(
        `SELECT min("procDate")::text AS first_date, max("procDate")::text AS last_date
         FROM "cal_surgs"
         WHERE ($1::uuid IS NULL OR "departmentId" = $1)`,
        [departmentId]
      ),
      // The locked department, so the page header and both exports can name whose data this is.
      // NULL departmentId (institution-wide caller) yields no row, which the caller renders as such.
      dataSource.query(
        `SELECT "id", "code", "name", "arName" FROM "departments" WHERE "id" = $1::uuid`,
        [departmentId]
      ),
    ]);

    return {
      department: dept?.[0] ?? null,
      departmentLocked: departmentId !== null,
      hospitals,
      procedures,
      alphaCodes,
      mainDiags,
      ageBands: AGE_BANDS,
      dateBounds: bounds?.[0] ?? { first_date: null, last_date: null },
      unrecordedProcedureKey: UNRECORDED_PROC,
    };
  }

  /**
   * The summary: headline totals, per-year and gap-filled per-month series, and the breakdowns by
   * hospital, age band, alpha family, procedure, main diagnosis and gender, plus a data-quality
   * block that is always present so a caller cannot mistake a partial extract for the full picture.
   */
  public async getSummary(
    dataSource: DataSource,
    filters: CaseAnalyticsFilters,
    departmentId: string | null
  ) {
    const { cte, params } = this.buildScope(filters, departmentId);
    const pediatric = `'${PEDIATRIC_BANDS.join("','")}'`;

    const totalsP = dataSource.query(
      `${cte}
       SELECT
         count(*)::int AS total_cases,
         count(*) FILTER (WHERE age_band IN (${pediatric}))::int AS pediatric_cases,
         count(*) FILTER (WHERE age_band NOT IN (${pediatric}) AND age_band <> 'unknown')::int AS adult_cases,
         count(*) FILTER (WHERE "procCptId" IS NULL)::int AS cases_with_no_procedure_recorded,
         count(*) FILTER (WHERE age_band = 'unknown')::int AS cases_with_unusable_dob,
         count(*) FILTER (WHERE "procDate" < '${PLAUSIBLE_DATE_FROM}'::date OR "procDate" > current_date)::int
           AS cases_outside_plausible_date_range,
         count(DISTINCT "hospitalId")::int AS distinct_hospitals,
         count(DISTINCT "procCptId")::int AS distinct_procedures,
         min("procDate")::text AS first_date,
         max("procDate")::text AS last_date
       FROM fs`,
      params
    );

    const byYearP = dataSource.query(
      `${cte}
       SELECT date_part('year', "procDate")::int AS year,
              count(*)::int AS cases,
              count(*) FILTER (WHERE age_band IN (${pediatric}))::int AS pediatric
       FROM fs
       GROUP BY 1
       ORDER BY 1`,
      params
    );

    // Monthly axis is gap-filled so a chart has no missing columns, but CLAMPED to the most recent
    // MAX_MONTH_BUCKETS months of the filtered set: one row dated 0202 would otherwise ask
    // generate_series for roughly 21,000 buckets.
    const byMonthP = dataSource.query(
      `${cte},
       bounds AS (
         SELECT
           greatest(
             date_trunc('month', min("procDate")),
             date_trunc('month', max("procDate")) - interval '${MAX_MONTH_BUCKETS - 1} months'
           ) AS lo,
           date_trunc('month', max("procDate")) AS hi
         FROM fs
       ),
       axis AS (
         SELECT generate_series(lo, hi, interval '1 month') AS ts FROM bounds WHERE lo IS NOT NULL
       )
       SELECT to_char(axis.ts, 'YYYY-MM') AS bucket,
              count(fs."id")::int AS cases
       FROM axis
       LEFT JOIN fs ON date_trunc('month', fs."procDate") = axis.ts
       GROUP BY axis.ts
       ORDER BY axis.ts`,
      params
    );

    const byHospitalP = dataSource.query(
      `${cte}
       SELECT h."id", h."engName", h."arabName",
              count(fs."id")::int AS cases,
              count(fs."id") FILTER (WHERE fs.age_band IN (${pediatric}))::int AS pediatric
       FROM fs
       JOIN "hospitals" h ON h."id" = fs."hospitalId"
       GROUP BY h."id", h."engName", h."arabName"
       ORDER BY cases DESC`,
      params
    );

    const byAgeBandP = dataSource.query(
      `${cte}
       SELECT age_band AS band, count(*)::int AS cases
       FROM fs
       GROUP BY 1`,
      params
    );

    const byAlphaCodeP = dataSource.query(
      `${cte}
       SELECT coalesce("alphaCode", '${UNRECORDED_PROC}') AS "alphaCode", count(*)::int AS cases
       FROM fs
       GROUP BY 1
       ORDER BY cases DESC`,
      params
    );

    const byProcedureP = dataSource.query(
      `${cte}
       SELECT "procCptId" AS id, proc_title AS title, proc_ar_title AS "arTitle",
              "alphaCode", "numCode", count(*)::int AS cases
       FROM fs
       WHERE "procCptId" IS NOT NULL
       GROUP BY 1, 2, 3, 4, 5
       ORDER BY cases DESC`,
      params
    );

    // The ONLY deliberate double-count: a case whose procedure sits in several mainDiags is
    // counted under each. Scoped by md."departmentId" = fs."departmentId" so a shared procedure
    // cannot drag in another department's categories.
    const byMainDiagP = dataSource.query(
      `${cte}
       SELECT md."id", md."title", md."arTitle", count(DISTINCT fs."id")::int AS cases
       FROM fs
       JOIN "main_diag_procs" mdp ON mdp."procCptId" = fs."procCptId"
       JOIN "main_diags" md ON md."id" = mdp."mainDiagId" AND md."departmentId" = fs."departmentId"
       GROUP BY md."id", md."title", md."arTitle"
       ORDER BY cases DESC`,
      params
    );

    // Cases that reach no mainDiag at all (no procedure recorded, or a procedure linked to none of
    // the department's categories). Reported so the byMainDiag table accounts for every case.
    const noMainDiagP = dataSource.query(
      `${cte}
       SELECT count(*)::int AS cases
       FROM fs
       WHERE NOT EXISTS (
         SELECT 1 FROM "main_diag_procs" mdp
         JOIN "main_diags" md ON md."id" = mdp."mainDiagId" AND md."departmentId" = fs."departmentId"
         WHERE mdp."procCptId" = fs."procCptId"
       )`,
      params
    );

    const byGenderP = dataSource.query(
      `${cte}
       SELECT "gender"::text AS gender, count(*)::int AS cases
       FROM fs
       GROUP BY 1
       ORDER BY cases DESC`,
      params
    );

    const [
      totalsRows,
      byYear,
      byMonth,
      byHospital,
      byAgeBandRows,
      byAlphaCode,
      byProcedure,
      byMainDiag,
      noMainDiagRows,
      byGender,
    ] = await Promise.all([
      totalsP,
      byYearP,
      byMonthP,
      byHospitalP,
      byAgeBandP,
      byAlphaCodeP,
      byProcedureP,
      byMainDiagP,
      noMainDiagP,
      byGenderP,
    ]);

    const t = totalsRows?.[0] ?? {};
    const totalCases: number = t.total_cases ?? 0;

    // Every band present and in a fixed order, so the chart axis never reshuffles between requests.
    const bandCounts = new Map<string, number>(
      (byAgeBandRows ?? []).map((r: any) => [r.band, r.cases])
    );
    const byAgeBand = AGE_BANDS.map((band) => ({ band, cases: bandCounts.get(band) ?? 0 }));

    const mainDiagCategorySum = (byMainDiag ?? []).reduce(
      (sum: number, r: any) => sum + (r.cases ?? 0),
      0
    );

    return {
      totals: {
        totalCases,
        pediatricCases: t.pediatric_cases ?? 0,
        adultCases: t.adult_cases ?? 0,
        distinctHospitals: t.distinct_hospitals ?? 0,
        distinctProcedures: t.distinct_procedures ?? 0,
        firstDate: t.first_date ?? null,
        lastDate: t.last_date ?? null,
      },
      byYear: byYear ?? [],
      byMonth: byMonth ?? [],
      byHospital: byHospital ?? [],
      byAgeBand,
      byAlphaCode: byAlphaCode ?? [],
      byProcedure: byProcedure ?? [],
      byMainDiag: byMainDiag ?? [],
      byGender: byGender ?? [],
      dataQuality: {
        casesWithNoProcedureRecorded: t.cases_with_no_procedure_recorded ?? 0,
        casesWithUnusableDob: t.cases_with_unusable_dob ?? 0,
        casesOutsidePlausibleDateRange: t.cases_outside_plausible_date_range ?? 0,
        casesWithNoMainDiag: noMainDiagRows?.[0]?.cases ?? 0,
        // A case counts under every mainDiag its procedure belongs to, so this sum EXCEEDS
        // totalCases by design. Surfaced so no reader mistakes it for a case total.
        mainDiagCategorySum,
        mainDiagDoubleCounts: mainDiagCategorySum > totalCases,
      },
    };
  }

  /**
   * The underlying rows, for the on-screen table and the Excel raw sheet. Paginated because an
   * unfiltered department pull is thousands of rows, which is exactly the mistake the superseded
   * endpoint made.
   */
  public async getCases(
    dataSource: DataSource,
    filters: CaseAnalyticsFilters,
    departmentId: string | null,
    page = 1,
    pageSize = 100
  ) {
    const { cte, params } = this.buildScope(filters, departmentId);
    const safeSize = Math.min(Math.max(pageSize, 1), 1000);
    const safePage = Math.max(page, 1);
    const offset = (safePage - 1) * safeSize;

    const [countRows, rows] = await Promise.all([
      dataSource.query(`${cte} SELECT count(*)::int AS total FROM fs`, params),
      dataSource.query(
        `${cte}
         SELECT fs."id",
                fs."procDate"::text AS "procDate",
                fs."patientName", fs."patientNameAr", fs."patientNameEn",
                fs."patientDob"::text AS "patientDob",
                fs.age_years::int AS "ageYears",
                fs.age_band AS "ageBand",
                fs."gender"::text AS gender,
                h."engName" AS "hospitalEn", h."arabName" AS "hospitalAr",
                fs.proc_title AS "procedureEn", fs.proc_ar_title AS "procedureAr",
                fs."alphaCode", fs."numCode"
         FROM fs
         JOIN "hospitals" h ON h."id" = fs."hospitalId"
         ORDER BY fs."procDate" DESC, fs."id"
         LIMIT ${safeSize} OFFSET ${offset}`,
        params
      ),
    ]);

    const total: number = countRows?.[0]?.total ?? 0;
    return {
      page: safePage,
      pageSize: safeSize,
      total,
      totalPages: Math.ceil(total / safeSize),
      cases: rows ?? [],
    };
  }

  /** Every matching row, unpaginated, for the export writers. Bounded by an explicit hard cap. */
  public async getAllCasesForExport(
    dataSource: DataSource,
    filters: CaseAnalyticsFilters,
    departmentId: string | null,
    hardCap = 20000
  ) {
    const res = await this.getCases(dataSource, filters, departmentId, 1, Math.min(hardCap, 1000));
    if (res.total <= res.cases.length) return res.cases;

    // Walk the pages rather than lifting the LIMIT, so one bad filter cannot pull an unbounded set.
    const all = [...res.cases];
    const pages = Math.min(res.totalPages, Math.ceil(hardCap / res.pageSize));
    for (let p = 2; p <= pages; p++) {
      const next = await this.getCases(dataSource, filters, departmentId, p, res.pageSize);
      all.push(...next.cases);
    }
    return all;
  }
}
