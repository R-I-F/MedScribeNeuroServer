import ExcelJS from "exceljs";
import {
  ReportMeta,
  ReportLang,
  ageBandLabel,
  alphaCodeLabel,
  genderLabel,
  t,
} from "./caseAnalyticsReportModel";

/**
 * Excel writer for the Case Analytics export (docs/CASE_ANALYTICS_TOOL_PLAN.md).
 *
 * One sheet per breakdown plus the raw rows, so the department can pivot the data itself. Headers
 * are bilingual because the same file is read by Arabic and English speakers in the same meeting.
 *
 * exceljs has no native chart support, which is why charts live in the PDF export instead of here.
 */

const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF1F2937" },
};

const NOTE_FONT: Partial<ExcelJS.Font> = { italic: true, color: { argb: "FF6B7280" }, size: 10 };

const SHEET_TITLES = {
  summary: { en: "Summary", ar: "ملخص" },
  byYear: { en: "By year", ar: "حسب السنة" },
  byMonth: { en: "By month", ar: "حسب الشهر" },
  byHospital: { en: "By hospital", ar: "حسب المستشفى" },
  byAgeBand: { en: "By age group", ar: "حسب الفئة العمرية" },
  byProcedure: { en: "By procedure", ar: "حسب الإجراء" },
  byAlphaCode: { en: "By procedure family", ar: "حسب مجموعة الإجراء" },
  byMainDiag: { en: "By main diagnosis", ar: "حسب التشخيص الرئيسي" },
  byGender: { en: "By gender", ar: "حسب الجنس" },
  cases: { en: "Cases", ar: "الحالات" },
} as const;

const L = {
  totalCases: { en: "Total cases", ar: "إجمالي الحالات" },
  pediatricCases: { en: "Pediatric cases (under 18)", ar: "حالات الأطفال أقل من 18" },
  adultCases: { en: "Adult cases (18 and above)", ar: "حالات البالغين 18 وأكثر" },
  distinctHospitals: { en: "Hospitals involved", ar: "عدد المستشفيات" },
  distinctProcedures: { en: "Distinct procedures", ar: "عدد الإجراءات المختلفة" },
  firstDate: { en: "Earliest case date", ar: "أقدم تاريخ حالة" },
  lastDate: { en: "Latest case date", ar: "أحدث تاريخ حالة" },
  metric: { en: "Metric", ar: "المؤشر" },
  value: { en: "Value", ar: "القيمة" },
  cases: { en: "Cases", ar: "الحالات" },
  pediatric: { en: "Pediatric", ar: "أطفال" },
  share: { en: "Share of total", ar: "النسبة من الإجمالي" },
  year: { en: "Year", ar: "السنة" },
  month: { en: "Month", ar: "الشهر" },
  hospital: { en: "Hospital / unit", ar: "المستشفى أو الوحدة" },
  ageGroup: { en: "Age group", ar: "الفئة العمرية" },
  procedure: { en: "Procedure", ar: "الإجراء" },
  family: { en: "Procedure family", ar: "مجموعة الإجراء" },
  mainDiag: { en: "Main diagnosis category", ar: "تصنيف التشخيص الرئيسي" },
  gender: { en: "Gender", ar: "الجنس" },
  cptCode: { en: "CPT code", ar: "كود CPT" },
  dataQuality: { en: "Data quality", ar: "جودة البيانات" },
  noProcedure: { en: "Cases with no procedure recorded", ar: "حالات بدون إجراء مسجل" },
  unusableDob: { en: "Cases with an unusable date of birth", ar: "حالات بتاريخ ميلاد غير صالح" },
  outsideRange: {
    en: "Cases dated outside the plausible range",
    ar: "حالات بتاريخ خارج النطاق المعقول",
  },
  noMainDiag: {
    en: "Cases reaching no main diagnosis category",
    ar: "حالات لا تنتمي لأي تصنيف تشخيص",
  },
  procDate: { en: "Procedure date", ar: "تاريخ الإجراء" },
  patient: { en: "Patient", ar: "المريض" },
  dob: { en: "Date of birth", ar: "تاريخ الميلاد" },
  ageYears: { en: "Age (years)", ar: "العمر (سنوات)" },
  doubleCountNote: {
    en:
      "Note: a case whose procedure belongs to several categories is counted under each, so this " +
      "column sums to more than the total case count. Compare against the Summary sheet.",
    ar:
      "ملاحظة: الحالة التي ينتمي إجراؤها لعدة تصنيفات تُحسب في كل تصنيف، لذلك يزيد مجموع هذا " +
      "العمود عن إجمالي الحالات. راجع صفحة الملخص.",
  },
  monthGapNote: {
    en: "Note: limited to the most recent 120 months of the filtered set.",
    ar: "ملاحظة: يقتصر على آخر 120 شهرا من النتائج المفلترة.",
  },
} as const;

type LabelKey = keyof typeof L;

function lbl(key: LabelKey, lang: ReportLang): string {
  return L[key][lang];
}

/** Bilingual header: the caller's language first, the other underneath, so neither reader is second. */
function dual(key: LabelKey, lang: ReportLang): string {
  const other: ReportLang = lang === "en" ? "ar" : "en";
  return `${L[key][lang]}\n${L[key][other]}`;
}

function styleHeader(row: ExcelJS.Row) {
  row.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
  row.fill = HEADER_FILL;
  row.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  row.height = 30;
}

function addTable(
  ws: ExcelJS.Worksheet,
  headers: string[],
  rows: Array<Array<string | number | null>>,
  widths: number[]
) {
  ws.columns = widths.map((w) => ({ width: w }));
  styleHeader(ws.addRow(headers));
  rows.forEach((r) => ws.addRow(r));
  ws.views = [{ state: "frozen", ySplit: 1 }];
}

function share(n: number, total: number): string {
  if (!total) return "0%";
  return `${((n / total) * 100).toFixed(1)}%`;
}

/**
 * Builds the workbook. `summary` is the /caseAnalytics/summary payload and `cases` the full row set.
 */
export async function buildCaseAnalyticsWorkbook(
  meta: ReportMeta,
  summary: any,
  cases: any[]
): Promise<Buffer> {
  const lang = meta.lang;
  const wb = new ExcelJS.Workbook();
  wb.creator = "LIBELUSpro";
  wb.created = new Date();

  const total: number = summary?.totals?.totalCases ?? 0;

  // ---- Summary sheet: what was asked for, then the headline numbers, then data quality ----
  const s = wb.addWorksheet(SHEET_TITLES.summary[lang]);
  s.columns = [{ width: 44 }, { width: 46 }];
  const titleRow = s.addRow([meta.title]);
  titleRow.font = { bold: true, size: 14 };
  s.addRow([`${t("department", lang)}: ${meta.departmentLabel}`]);
  s.addRow([`${t("generatedAt", lang)}: ${meta.generatedAt}`]);
  s.addRow([]);

  // The filter block is deliberately the first thing in the file.
  meta.filterLines.forEach((line) => {
    const r = s.addRow([line.label, line.value]);
    r.getCell(1).font = { bold: true, size: 10 };
    r.getCell(2).alignment = { wrapText: true };
  });
  s.addRow([]);

  styleHeader(s.addRow([dual("metric", lang), dual("value", lang)]));
  const tt = summary?.totals ?? {};
  (
    [
      ["totalCases", tt.totalCases],
      ["pediatricCases", tt.pediatricCases],
      ["adultCases", tt.adultCases],
      ["distinctHospitals", tt.distinctHospitals],
      ["distinctProcedures", tt.distinctProcedures],
      ["firstDate", tt.firstDate],
      ["lastDate", tt.lastDate],
    ] as Array<[LabelKey, any]>
  ).forEach(([k, v]) => s.addRow([lbl(k, lang), v ?? 0]));

  s.addRow([]);
  const dqHeader = s.addRow([lbl("dataQuality", lang)]);
  dqHeader.font = { bold: true, size: 12 };
  const dq = summary?.dataQuality ?? {};
  (
    [
      ["noProcedure", dq.casesWithNoProcedureRecorded],
      ["unusableDob", dq.casesWithUnusableDob],
      ["outsideRange", dq.casesOutsidePlausibleDateRange],
      ["noMainDiag", dq.casesWithNoMainDiag],
    ] as Array<[LabelKey, any]>
  ).forEach(([k, v]) => s.addRow([lbl(k, lang), v ?? 0]));

  // ---- By year ----
  const yearRows = (summary?.byYear ?? []).map((r: any) => [
    r.year,
    r.cases,
    r.pediatric,
    share(r.cases, total),
  ]);
  addTable(
    wb.addWorksheet(SHEET_TITLES.byYear[lang]),
    [dual("year", lang), dual("cases", lang), dual("pediatric", lang), dual("share", lang)],
    yearRows,
    [14, 14, 14, 16]
  );

  // ---- By month ----
  const monthWs = wb.addWorksheet(SHEET_TITLES.byMonth[lang]);
  addTable(
    monthWs,
    [dual("month", lang), dual("cases", lang)],
    (summary?.byMonth ?? []).map((r: any) => [r.bucket, r.cases]),
    [16, 14]
  );
  monthWs.addRow([]);
  monthWs.addRow([lbl("monthGapNote", lang)]).font = NOTE_FONT;

  // ---- By hospital ----
  addTable(
    wb.addWorksheet(SHEET_TITLES.byHospital[lang]),
    [
      dual("hospital", lang),
      dual("cases", lang),
      dual("pediatric", lang),
      dual("share", lang),
    ],
    (summary?.byHospital ?? []).map((r: any) => [
      lang === "ar" ? r.arabName || r.engName : r.engName,
      r.cases,
      r.pediatric,
      share(r.cases, total),
    ]),
    [46, 14, 14, 16]
  );

  // ---- By age group ----
  addTable(
    wb.addWorksheet(SHEET_TITLES.byAgeBand[lang]),
    [dual("ageGroup", lang), dual("cases", lang), dual("share", lang)],
    (summary?.byAgeBand ?? []).map((r: any) => [
      ageBandLabel(r.band, lang),
      r.cases,
      share(r.cases, total),
    ]),
    [34, 14, 16]
  );

  // ---- By procedure ----
  addTable(
    wb.addWorksheet(SHEET_TITLES.byProcedure[lang]),
    [
      dual("procedure", lang),
      dual("family", lang),
      dual("cptCode", lang),
      dual("cases", lang),
      dual("share", lang),
    ],
    (summary?.byProcedure ?? []).map((r: any) => [
      lang === "ar" ? r.arTitle || r.title : r.title,
      r.alphaCode,
      r.numCode,
      r.cases,
      share(r.cases, total),
    ]),
    [48, 16, 16, 12, 16]
  );

  // ---- By procedure family ----
  addTable(
    wb.addWorksheet(SHEET_TITLES.byAlphaCode[lang]),
    [dual("family", lang), dual("cases", lang), dual("share", lang)],
    (summary?.byAlphaCode ?? []).map((r: any) => [
      alphaCodeLabel(r.alphaCode, lang),
      r.cases,
      share(r.cases, total),
    ]),
    [30, 14, 16]
  );

  // ---- By main diagnosis: the one sheet that double-counts, and says so ----
  const mdWs = wb.addWorksheet(SHEET_TITLES.byMainDiag[lang]);
  addTable(
    mdWs,
    [dual("mainDiag", lang), dual("cases", lang)],
    (summary?.byMainDiag ?? []).map((r: any) => [
      lang === "ar" ? r.arTitle || r.title : r.title,
      r.cases,
    ]),
    [48, 14]
  );
  mdWs.addRow([]);
  const noteRow = mdWs.addRow([lbl("doubleCountNote", lang)]);
  noteRow.font = NOTE_FONT;
  noteRow.alignment = { wrapText: true };
  mdWs.addRow([lbl("noMainDiag", lang), summary?.dataQuality?.casesWithNoMainDiag ?? 0]);

  // ---- By gender ----
  addTable(
    wb.addWorksheet(SHEET_TITLES.byGender[lang]),
    [dual("gender", lang), dual("cases", lang), dual("share", lang)],
    (summary?.byGender ?? []).map((r: any) => [
      genderLabel(r.gender, lang),
      r.cases,
      share(r.cases, total),
    ]),
    [20, 14, 16]
  );

  // ---- Raw cases, so the department can pivot it themselves ----
  addTable(
    wb.addWorksheet(SHEET_TITLES.cases[lang]),
    [
      dual("procDate", lang),
      dual("patient", lang),
      dual("dob", lang),
      dual("ageYears", lang),
      dual("ageGroup", lang),
      dual("gender", lang),
      dual("hospital", lang),
      dual("procedure", lang),
      dual("family", lang),
      dual("cptCode", lang),
    ],
    (cases ?? []).map((c: any) => [
      c.procDate,
      lang === "ar" ? c.patientNameAr || c.patientName : c.patientNameEn || c.patientName,
      c.patientDob,
      c.ageYears ?? null,
      ageBandLabel(c.ageBand, lang),
      genderLabel(c.gender, lang),
      lang === "ar" ? c.hospitalAr || c.hospitalEn : c.hospitalEn,
      lang === "ar" ? c.procedureAr || c.procedureEn : c.procedureEn,
      c.alphaCode,
      c.numCode,
    ]),
    [14, 26, 14, 12, 26, 12, 40, 44, 14, 14]
  );

  const out = await wb.xlsx.writeBuffer();
  return Buffer.from(out);
}
