import { AgeBand, CaseAnalyticsFilters, UNRECORDED_PROC } from "./caseAnalytics.provider";

/**
 * Shared label and metadata model for the Case Analytics exports (docs/CASE_ANALYTICS_TOOL_PLAN.md).
 *
 * Both the Excel writer and the PDF writer build on this, so the two files can never disagree about
 * a band label, a filter description, or what was actually asked for.
 */

export type ReportLang = "en" | "ar";

export const AGE_BAND_LABELS: Record<AgeBand, { en: string; ar: string }> = {
  under1: { en: "Under 1 year", ar: "أقل من سنة" },
  age1to2: { en: "1 to 2 years", ar: "من سنة إلى سنتين" },
  age3to12: { en: "3 to 12 years", ar: "من 3 إلى 12 سنة" },
  age13to17: { en: "13 to 17 years", ar: "من 13 إلى 17 سنة" },
  age18to39: { en: "18 to 39 years", ar: "من 18 إلى 39 سنة" },
  age40to59: { en: "40 to 59 years", ar: "من 40 إلى 59 سنة" },
  age60plus: { en: "60 years and above", ar: "60 سنة وأكثر" },
  unknown: { en: "Unknown (unusable date of birth)", ar: "غير معروف، تاريخ ميلاد غير صالح" },
};

export const GENDER_LABELS: Record<string, { en: string; ar: string }> = {
  male: { en: "Male", ar: "ذكر" },
  female: { en: "Female", ar: "أنثى" },
};

/** The alphaCode sentinel is not a code, so it needs a human label wherever codes are listed. */
export const UNRECORDED_LABEL = {
  en: "No procedure recorded",
  ar: "لم يتم تسجيل إجراء",
};

export function ageBandLabel(band: string, lang: ReportLang): string {
  const l = AGE_BAND_LABELS[band as AgeBand];
  return l ? l[lang] : band;
}

export function alphaCodeLabel(code: string, lang: ReportLang): string {
  return code === UNRECORDED_PROC ? UNRECORDED_LABEL[lang] : code;
}

export function genderLabel(g: string, lang: ReportLang): string {
  const l = GENDER_LABELS[g];
  return l ? l[lang] : g;
}

export interface FilterOptionLists {
  department?: { id: string; code: string; name: string; arName: string } | null;
  departmentLocked?: boolean;
  hospitals: Array<{ id: string; engName: string; arabName: string }>;
  procedures: Array<{ id: string; title: string; arTitle: string | null }>;
  mainDiags: Array<{ id: string; title: string; arTitle: string | null }>;
}

export interface ReportMeta {
  lang: ReportLang;
  generatedAt: string;
  departmentLabel: string;
  /** Human-readable "what was asked for", one line per active filter. Empty = nothing narrowed. */
  filterLines: Array<{ label: string; value: string }>;
  title: string;
  fileStem: string;
}

const T = {
  title: { en: "Surgical Case Statistics", ar: "إحصائيات الحالات الجراحية" },
  department: { en: "Department", ar: "القسم" },
  allDepartments: { en: "All departments", ar: "كل الأقسام" },
  dateFrom: { en: "Date from", ar: "من تاريخ" },
  dateTo: { en: "Date to", ar: "إلى تاريخ" },
  allDates: { en: "All dates on record", ar: "كل التواريخ المسجلة" },
  hospitals: { en: "Hospitals / units", ar: "المستشفيات والوحدات" },
  procedures: { en: "Procedures", ar: "الإجراءات" },
  alphaCodes: { en: "Procedure families", ar: "مجموعات الإجراءات" },
  mainDiags: { en: "Main diagnosis categories", ar: "تصنيفات التشخيص الرئيسي" },
  ageBands: { en: "Age groups", ar: "الفئات العمرية" },
  gender: { en: "Gender", ar: "الجنس" },
  all: { en: "All", ar: "الكل" },
  generatedAt: { en: "Generated", ar: "تاريخ الإنشاء" },
} as const;

export function t(key: keyof typeof T, lang: ReportLang): string {
  return T[key][lang];
}

/** Resolves a list of ids to their display names, keeping the caller's order stable. */
function namesFor(
  ids: string[] | null | undefined,
  rows: Array<{ id: string; [k: string]: any }>,
  enKey: string,
  arKey: string,
  lang: ReportLang
): string | null {
  if (!ids || !ids.length) return null;
  const byId = new Map(rows.map((r) => [r.id, r]));
  return ids
    .map((id) => {
      const row = byId.get(id);
      if (!row) return id;
      const primary = lang === "ar" ? row[arKey] : row[enKey];
      return String(primary || row[enKey] || row[arKey] || id);
    })
    .join(", ");
}

/**
 * Builds the export header block. Every active filter is listed explicitly, because these files get
 * forwarded: a partial extract that does not say what it excluded reads as a whole-department total.
 */
export function buildReportMeta(
  filters: CaseAnalyticsFilters,
  options: FilterOptionLists,
  lang: ReportLang,
  now: Date = new Date()
): ReportMeta {
  const dept = options.department;
  const departmentLabel = dept
    ? lang === "ar"
      ? dept.arName || dept.name
      : dept.name
    : t("allDepartments", lang);

  const lines: Array<{ label: string; value: string }> = [];

  if (filters.from || filters.to) {
    if (filters.from) lines.push({ label: t("dateFrom", lang), value: filters.from });
    if (filters.to) lines.push({ label: t("dateTo", lang), value: filters.to });
  } else {
    lines.push({ label: t("dateFrom", lang), value: t("allDates", lang) });
  }

  const hosp = namesFor(filters.hospitalIds, options.hospitals, "engName", "arabName", lang);
  if (hosp) lines.push({ label: t("hospitals", lang), value: hosp });

  const procs = namesFor(filters.procCptIds, options.procedures, "title", "arTitle", lang);
  if (procs) lines.push({ label: t("procedures", lang), value: procs });

  if (filters.alphaCodes?.length) {
    lines.push({
      label: t("alphaCodes", lang),
      value: filters.alphaCodes.map((c) => alphaCodeLabel(c, lang)).join(", "),
    });
  }

  const mds = namesFor(filters.mainDiagIds, options.mainDiags, "title", "arTitle", lang);
  if (mds) lines.push({ label: t("mainDiags", lang), value: mds });

  if (filters.ageBands?.length) {
    lines.push({
      label: t("ageBands", lang),
      value: filters.ageBands.map((b) => ageBandLabel(b, lang)).join(", "),
    });
  }

  if (filters.gender) {
    lines.push({ label: t("gender", lang), value: genderLabel(filters.gender, lang) });
  }

  const stamp = now.toISOString().slice(0, 19).replace("T", " ");
  const fileDate = now.toISOString().slice(0, 10);
  const deptCode = dept?.code ?? "all";

  return {
    lang,
    generatedAt: `${stamp} UTC`,
    departmentLabel,
    filterLines: lines,
    title: t("title", lang),
    fileStem: `${deptCode}-surgical-case-statistics-${fileDate}`,
  };
}
