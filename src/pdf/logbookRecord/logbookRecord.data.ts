/**
 * Data for the Logbook Record PDF: one candidate's complete surgical, academic and clinical
 * experience, entry by entry.
 *
 * Every query is scoped to the one candidate (no institution-wide loads) and read-only.
 * Dates are formatted in SQL so the server's own time zone can never shift them:
 *   - `cal_surgs.procDate`, `patientDob` and `clinical_sub.dateCA` are DATE columns (no zone).
 *   - `events.dateTime` is a `timestamp without time zone` holding a UTC instant (see
 *     src/eliminator/institutionTime.util.ts), so it is converted UTC -> institution zone.
 */
import { DataSource } from "typeorm";
import { INSTITUTION_TIMEZONE } from "../../utils/institutionDateFormat";
import { getReportRoleLabel } from "../reportRoles";

export interface LogbookCandidate {
  id: string;
  fullName: string;
  regNum: string | null;
  rank: string | null;
  regDeg: string | null;
  departmentId: string | null;
  departmentName: string | null;
  createdAt: string | null; // YYYY-MM-DD
}

/** A code with its name, printed as a bold code and a wrapped name. `code` is "" for free text. */
export interface CodedItem {
  code: string;
  name: string;
}

/** One labelled case detail ("Approach: retrosigmoid"). `value` "" prints the label alone. */
export interface DetailPair {
  label: string;
  value: string;
}

/**
 * CPT code as printed on documents. Our `proc_cpts.numCode` carries an internal "-NN" variant
 * suffix ("61510-01", "0274T-00") that is not part of the CPT code, so it is removed.
 */
export function publicCptCode(numCode: unknown): string {
  return String(numCode ?? "").trim().replace(/-\d+$/, "");
}

/** "none", "n/a", "-" and blanks are not worth printing as a case detail. */
function isEmptyAnswer(v: unknown): boolean {
  const s = String(v ?? "").trim().toLowerCase();
  return s === "" || s === "none" || s === "n/a" || s === "na" || s === "-" || s === "nil";
}

export interface SurgicalEntry {
  id: string;
  procDate: string | null; // YYYY-MM-DD
  year: number | null;
  hospital: string;
  patientInitials: string;
  patientAge: string; // "34 y", "8 mo", "<1 mo", or ""
  patientSex: string; // "M" | "F" | ""
  mainDiag: string;
  diagnoses: CodedItem[]; // { code: "8B02", name: "chronic subdural haematoma" }
  procedures: CodedItem[]; // { code: "61312", name: "craniotomy ..." } (internal "-NN" suffix removed)
  role: string; // display label
  supervisor: string;
  status: "approved" | "pending" | "rejected";
  details: DetailPair[]; // answers, revision flag, equipment, consumables; "none" answers dropped
}

export interface AcademicEntry {
  date: string | null; // YYYY-MM-DD, institution zone
  academicYear: string; // "2025-2026" (September to August)
  type: "Lecture" | "Journal club" | "Conference";
  lectureNumber: string | null;
  title: string;
  topic: string | null;
  lectureId: string | null;
  presenter: string;
  location: string;
  points: number;
  flagged: boolean;
}

export interface PresentedEntry {
  date: string | null;
  type: "Lecture" | "Journal club" | "Conference";
  title: string;
  status: string;
  attendance: number;
}

export interface TopicCoverage {
  topic: string;
  attended: number; // distinct curriculum lectures of this topic the candidate attended
  total: number; // lectures in the topic
}

export interface ClinicalEntry {
  date: string | null;
  year: number | null;
  type: string;
  description: string;
  supervisor: string;
  status: string;
  reviewedOn: string | null;
  comment: string;
}

export interface LogbookRecordData {
  candidate: LogbookCandidate;
  surgical: SurgicalEntry[];
  academic: AcademicEntry[] | null; // null when the institution is not academic
  presented: PresentedEntry[] | null;
  topicCoverage: TopicCoverage[] | null;
  clinical: ClinicalEntry[] | null; // null when the institution is not clinical
}

/** Same rule as EventService.computePointsForAttendance (the dashboard and the E-Certificate). */
export type PointsRule = (
  att: { flagged: boolean },
  event: { type: string; presenterId: string },
  candidateId: string
) => number;

const EVENT_TYPE_LABEL: Record<string, AcademicEntry["type"]> = {
  lecture: "Lecture",
  journal: "Journal club",
  conf: "Conference",
};

const LOCATION_LABEL: Record<string, string> = {
  dept: "Department",
  online: "Online",
};

function clean(v: unknown): string {
  return v == null ? "" : String(v).replace(/\s+/g, " ").trim();
}

function titleCase(s: string): string {
  return s.replace(/\b\p{L}/gu, (c) => c.toUpperCase());
}

/** Category names are stored lower case ("cns tumors"): sentence case, with known acronyms restored. */
const ACRONYMS: Record<string, string> = { cns: "CNS", csf: "CSF", cpb: "CPB", ent: "ENT", gi: "GI", vp: "VP", etv: "ETV" };
function sentenceCase(s: string): string {
  const words = s.split(" ").map((w) => ACRONYMS[w.toLowerCase()] ?? w);
  if (words.length && words[0] === words[0].toLowerCase()) words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
  return words.join(" ");
}

function trimId(v: unknown): string {
  return v == null ? "" : String(v).trim();
}

/**
 * Patient initials only. The stored privacy format is "<first name> <initial> <initial>"
 * (e.g. "Ahmed M Kh"); the first name is reduced to its initial so no name is printed.
 */
export function patientInitials(nameEn: string | null, nameRaw: string | null): string {
  const src = clean(nameEn) || clean(nameRaw);
  if (!src) return "";
  return src
    .split(" ")
    .filter(Boolean)
    .map((t, i) => (i === 0 ? Array.from(t)[0].toUpperCase() : t))
    .join(" ");
}

function ageLabel(years: number | null, months: number | null): string {
  if (years == null || months == null) return "";
  if (years >= 1) return `${years} y`;
  if (months >= 1) return `${months} mo`;
  return "<1 mo";
}

function academicYearOf(date: string | null): string {
  if (!date) return "Undated";
  const y = Number(date.slice(0, 4));
  const m = Number(date.slice(5, 7));
  const start = m >= 9 ? y : y - 1;
  return `${start}-${start + 1}`;
}

export async function loadLogbookRecordData(
  ds: DataSource,
  candidateId: string,
  options: { isAcademic: boolean; isClinical: boolean; pointsRule: PointsRule }
): Promise<LogbookRecordData | null> {
  const candRows = await ds.query(
    `SELECT c."id", c."fullName", c."regNum", c."rank"::text AS "rank", c."regDeg"::text AS "regDeg",
            c."departmentId", d."name" AS "departmentName",
            to_char(c."createdAt", 'YYYY-MM-DD') AS "createdAt"
       FROM "candidates" c
       LEFT JOIN "departments" d ON d."id" = c."departmentId"
      WHERE c."id" = $1`,
    [candidateId]
  );
  if (!candRows[0]) return null;
  const candidate: LogbookCandidate = candRows[0];

  // ---------- Surgical ----------
  // Age is left empty for the known dirty rows (DOB after the operation, or over 110 years).
  const subRows: any[] = await ds.query(
    `SELECT s."id", s."subStatus"::text AS "status", s."roleInSurg", s."insUsed", s."consUsed",
            s."isItRevSurg", s."diagnosisName", s."procedureName",
            to_char(cs."procDate", 'YYYY-MM-DD') AS "procDate",
            cs."patientName", cs."patientNameEn", cs."gender"::text AS "gender",
            CASE WHEN cs."patientDob" <= cs."procDate" AND cs."procDate" - cs."patientDob" < 365 * 110
                 THEN date_part('year', age(cs."procDate", cs."patientDob"))::int END AS "ageYears",
            CASE WHEN cs."patientDob" <= cs."procDate" AND cs."procDate" - cs."patientDob" < 365 * 110
                 THEN (date_part('year', age(cs."procDate", cs."patientDob")) * 12
                       + date_part('month', age(cs."procDate", cs."patientDob")))::int END AS "ageMonths",
            COALESCE(NULLIF(h."engName", ''), h."arabName") AS "hospital",
            md."title" AS "mainDiag",
            sup."fullName" AS "supervisor"
       FROM "submissions" s
       JOIN "cal_surgs" cs ON cs."id" = s."procDocId"
       LEFT JOIN "hospitals" h ON h."id" = cs."hospitalId"
       LEFT JOIN "main_diags" md ON md."id" = s."mainDiagDocId"
       LEFT JOIN "supervisors" sup ON sup."id" = s."supervisorDocId"
      WHERE s."candDocId" = $1 AND s."submissionType"::text = 'candidate'
      ORDER BY cs."procDate" ASC NULLS LAST, s."createdAt" ASC`,
    [candidateId]
  );
  const subIds = subRows.map((r) => r.id);

  const procsBySub = new Map<string, CodedItem[]>();
  const icdsBySub = new Map<string, CodedItem[]>();
  const answersBySub = new Map<string, DetailPair[]>();
  const push = <T>(map: Map<string, T[]>, key: string, value: T) => {
    const list = map.get(key) ?? [];
    list.push(value);
    map.set(key, list);
  };
  if (subIds.length > 0) {
    const procRows: any[] = await ds.query(
      `SELECT sp."submissionId" AS "sid", p."numCode", p."title"
         FROM "submission_proc_cpts" sp
         JOIN "proc_cpts" p ON p."id" = sp."procCptId"
        WHERE sp."submissionId" = ANY($1::uuid[])
        ORDER BY p."numCode"`,
      [subIds]
    );
    for (const r of procRows) push(procsBySub, r.sid, { code: publicCptCode(r.numCode), name: clean(r.title) });

    const icdRows: any[] = await ds.query(
      `SELECT si."submissionId" AS "sid", d."icdCode", d."icdName"
         FROM "submission_icds" si
         JOIN "diagnoses" d ON d."id" = si."icdId"
        WHERE si."submissionId" = ANY($1::uuid[])
        ORDER BY d."icdCode"`,
      [subIds]
    );
    for (const r of icdRows) push(icdsBySub, r.sid, { code: clean(r.icdCode), name: clean(r.icdName) });

    const ansRows: any[] = await ds.query(
      `SELECT a."submissionId" AS "sid", q."label", a."value"
         FROM "submission_question_answers" a
         JOIN "ref_questions" q ON q."id" = a."questionId"
        WHERE a."submissionId" = ANY($1::uuid[])
          AND a."value" IS NOT NULL AND btrim(a."value") <> ''
        ORDER BY q."sortOrder", q."label"`,
      [subIds]
    );
    for (const r of ansRows) {
      if (isEmptyAnswer(r.value)) continue;
      push(answersBySub, r.sid, { label: clean(r.label), value: clean(r.value) });
    }
  }

  const asList = (v: unknown): string[] => {
    if (Array.isArray(v)) return v.map(clean).filter(Boolean);
    if (typeof v === "string" && v.trim().startsWith("[")) {
      try {
        return asList(JSON.parse(v));
      } catch {
        return [clean(v)];
      }
    }
    return clean(v) ? [clean(v)] : [];
  };
  const csv = (v: unknown): string =>
    clean(v)
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean)
      .join(", ");

  const surgical: SurgicalEntry[] = subRows.map((r) => {
    const details: DetailPair[] = [...(answersBySub.get(r.id) ?? [])];
    if (r.isItRevSurg === true) details.push({ label: "Revision surgery", value: "" });
    const eq = csv(r.insUsed);
    if (eq && !isEmptyAnswer(eq)) details.push({ label: "Equipment", value: eq });
    const cons = csv(r.consUsed);
    if (cons && !isEmptyAnswer(cons)) details.push({ label: "Consumables", value: cons });
    // Linked codes when present; otherwise the free-text names the candidate typed (no code).
    const diagnoses = icdsBySub.get(r.id) ?? asList(r.diagnosisName).map((name) => ({ code: "", name }));
    const procedures = procsBySub.get(r.id) ?? asList(r.procedureName).map((name) => ({ code: "", name }));
    const sex = clean(r.gender).toLowerCase();
    const status = ["approved", "pending", "rejected"].includes(r.status) ? r.status : "pending";
    return {
      id: r.id,
      procDate: r.procDate ?? null,
      year: r.procDate ? Number(String(r.procDate).slice(0, 4)) : null,
      hospital: titleCase(clean(r.hospital)) || "-",
      patientInitials: patientInitials(r.patientNameEn, r.patientName),
      patientAge: ageLabel(r.ageYears, r.ageMonths),
      patientSex: sex === "male" ? "M" : sex === "female" ? "F" : "",
      mainDiag: sentenceCase(clean(r.mainDiag)) || "-",
      diagnoses: diagnoses.length ? diagnoses : [{ code: "", name: "-" }],
      procedures: procedures.length ? procedures : [{ code: "", name: "-" }],
      role: getReportRoleLabel(r.roleInSurg),
      supervisor: titleCase(clean(r.supervisor)) || "-",
      status,
      details,
    };
  });

  // ---------- Academic ----------
  let academic: AcademicEntry[] | null = null;
  let presented: PresentedEntry[] | null = null;
  let topicCoverage: TopicCoverage[] | null = null;
  if (options.isAcademic) {
    const attRows: any[] = await ds.query(
      `SELECT a."flagged", e."type"::text AS "type", e."presenterId", e."location",
              to_char((e."dateTime" AT TIME ZONE 'UTC') AT TIME ZONE $2, 'YYYY-MM-DD') AS "date",
              l."id" AS "lectureId", l."lectureNumber", l."title" AS "lectureTitle",
              lt."title" AS "topic", j."journalTitle", cf."confTitle",
              COALESCE(ps."fullName", pc."fullName") AS "presenter"
         FROM "event_attendance" a
         JOIN "events" e ON e."id" = a."eventId"
         LEFT JOIN "lectures" l ON l."id" = e."lectureId"
         LEFT JOIN "lecture_topics" lt ON lt."id" = l."topicId"
         LEFT JOIN "journals" j ON j."id" = e."journalId"
         LEFT JOIN "confs" cf ON cf."id" = e."confId"
         LEFT JOIN "supervisors" ps ON ps."id"::text = btrim(e."presenterId")
         LEFT JOIN "candidates" pc ON pc."id"::text = btrim(e."presenterId")
        WHERE a."candidateId" = $1
        ORDER BY e."dateTime" ASC`,
      [candidateId, INSTITUTION_TIMEZONE]
    );
    academic = attRows.map((r) => {
      const type = EVENT_TYPE_LABEL[r.type] ?? "Lecture";
      const rawTitle = clean(r.lectureTitle) || clean(r.journalTitle) || clean(r.confTitle);
      return {
        date: r.date ?? null,
        academicYear: academicYearOf(r.date ?? null),
        type,
        lectureNumber: r.type === "lecture" ? clean(r.lectureNumber) || null : null,
        title: rawTitle ? (r.type === "conf" ? titleCase(rawTitle) : sentenceCase(rawTitle)) : type,
        topic: clean(r.topic) || null,
        lectureId: r.lectureId ?? null,
        presenter: titleCase(clean(r.presenter)) || "-",
        location: LOCATION_LABEL[clean(r.location).toLowerCase()] ?? (titleCase(clean(r.location)) || "-"),
        points: options.pointsRule(
          { flagged: r.flagged === true },
          { type: r.type, presenterId: trimId(r.presenterId) },
          candidateId
        ),
        flagged: r.flagged === true,
      };
    });

    const presRows: any[] = await ds.query(
      `SELECT e."type"::text AS "type", e."status"::text AS "status",
              to_char((e."dateTime" AT TIME ZONE 'UTC') AT TIME ZONE $2, 'YYYY-MM-DD') AS "date",
              l."title" AS "lectureTitle", j."journalTitle", cf."confTitle",
              (SELECT count(*) FROM "event_attendance" x WHERE x."eventId" = e."id")::int AS "attendance"
         FROM "events" e
         LEFT JOIN "lectures" l ON l."id" = e."lectureId"
         LEFT JOIN "journals" j ON j."id" = e."journalId"
         LEFT JOIN "confs" cf ON cf."id" = e."confId"
        WHERE btrim(e."presenterId") = $1
        ORDER BY e."dateTime" ASC`,
      [candidateId, INSTITUTION_TIMEZONE]
    );
    presented = presRows.map((r) => {
      const type = EVENT_TYPE_LABEL[r.type] ?? "Lecture";
      const rawTitle = clean(r.lectureTitle) || clean(r.journalTitle) || clean(r.confTitle);
      return {
        date: r.date ?? null,
        type,
        title: rawTitle ? (r.type === "conf" ? titleCase(rawTitle) : sentenceCase(rawTitle)) : type,
        status: titleCase(clean(r.status)) || "-",
        attendance: Number(r.attendance) || 0,
      };
    });

    if (candidate.departmentId) {
      const topicRows: any[] = await ds.query(
        `SELECT lt."title" AS "topic", count(l."id")::int AS "total"
           FROM "lecture_topics" lt
           JOIN "lectures" l ON l."topicId" = lt."id"
          WHERE lt."departmentId" = $1
          GROUP BY lt."id", lt."title", lt."sortOrder"
          ORDER BY lt."sortOrder", lt."title"`,
        [candidate.departmentId]
      );
      // Flagged attendance does not count as having attended the lecture.
      const attendedByTopic = new Map<string, Set<string>>();
      for (const a of academic) {
        if (!a.topic || !a.lectureId || a.flagged) continue;
        const set = attendedByTopic.get(a.topic) ?? new Set<string>();
        set.add(a.lectureId);
        attendedByTopic.set(a.topic, set);
      }
      topicCoverage = topicRows.map((t) => ({
        topic: sentenceCase(clean(t.topic)),
        attended: attendedByTopic.get(clean(t.topic))?.size ?? 0,
        total: Number(t.total) || 0,
      }));
    }
  }

  // ---------- Clinical ----------
  let clinical: ClinicalEntry[] | null = null;
  if (options.isClinical) {
    const clinRows: any[] = await ds.query(
      `SELECT to_char(c."dateCA", 'YYYY-MM-DD') AS "date", c."typeCA"::text AS "type",
              c."description", c."subStatus"::text AS "status", c."review",
              to_char((c."reviewedAt" AT TIME ZONE 'UTC') AT TIME ZONE $2, 'YYYY-MM-DD') AS "reviewedOn",
              s."fullName" AS "supervisor"
         FROM "clinical_sub" c
         LEFT JOIN "supervisors" s ON s."id" = c."supervisorDocId"
        WHERE c."candDocId" = $1
        ORDER BY c."dateCA" ASC, c."createdAt" ASC`,
      [candidateId, INSTITUTION_TIMEZONE]
    );
    clinical = clinRows.map((r) => ({
      date: r.date ?? null,
      year: r.date ? Number(String(r.date).slice(0, 4)) : null,
      type: titleCase(clean(r.type)) || "-",
      description: clean(r.description),
      supervisor: titleCase(clean(r.supervisor)) || "-",
      status: clean(r.status) || "pending",
      reviewedOn: r.reviewedOn ?? null,
      comment: clean(r.review),
    }));
  }

  return { candidate, surgical, academic, presented, topicCoverage, clinical };
}
