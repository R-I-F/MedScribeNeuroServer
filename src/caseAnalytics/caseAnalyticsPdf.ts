import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { REPORT_LAYOUT, drawReportFooter } from "../pdf/reportLayout";
import { arabicLine, arabicParagraph } from "../pdf/arabicText";
import {
  ReportMeta,
  ReportLang,
  ageBandLabel,
  alphaCodeLabel,
  genderLabel,
  t,
} from "./caseAnalyticsReportModel";

/**
 * PDF writer for the Case Analytics export (docs/CASE_ANALYTICS_TOOL_PLAN.md).
 *
 * Charts are hand-drawn bars, matching how the rest of this codebase draws charts, so the export
 * adds no charting dependency. Arabic goes through src/pdf/arabicText.ts, because pdfkit shapes
 * Arabic but has no bidi engine (see that file for the three corrections).
 *
 * Two pdfkit traps are handled here explicitly:
 *   - Drawing a footer below the page's bottom margin silently breaks to a new page (a 34 page
 *     document came out at 103). Footers are drawn at the end over buffered pages with
 *     margins.bottom forced to 0 for the duration.
 *   - bufferedPageRange() must be read before doc.end().
 */

const ARABIC_FONT_FAMILY = "Cairo";
const ARABIC_FONT_PATH = path.resolve(process.cwd(), "assets", "fonts", "Cairo-Regular.ttf");

const COLORS = {
  ink: "#111827",
  muted: "#6b7280",
  rule: "#e5e7eb",
  bar: "#4f46e5",
  barAlt: "#818cf8",
  barMuted: "#c7d2fe",
  cardBg: "#f9fafb",
  warn: "#b45309",
};

const L = {
  totalCases: { en: "Total cases", ar: "إجمالي الحالات" },
  pediatric: { en: "Pediatric (under 18)", ar: "أطفال أقل من 18" },
  adult: { en: "Adult (18+)", ar: "بالغون 18 وأكثر" },
  hospitals: { en: "Hospitals", ar: "المستشفيات" },
  procedures: { en: "Procedures", ar: "الإجراءات" },
  dateRange: { en: "Date range in data", ar: "المدى الزمني للبيانات" },
  filtersApplied: { en: "Filters applied", ar: "عوامل التصفية المطبقة" },
  casesPerYear: { en: "Cases per year", ar: "الحالات لكل سنة" },
  casesPerMonth: { en: "Cases per month (most recent 24)", ar: "الحالات شهريا، آخر 24 شهرا" },
  byAgeGroup: { en: "Cases by age group", ar: "الحالات حسب الفئة العمرية" },
  byHospital: { en: "Cases by hospital or unit", ar: "الحالات حسب المستشفى أو الوحدة" },
  byProcedure: { en: "Top procedures", ar: "أكثر الإجراءات" },
  byFamily: { en: "Cases by procedure family", ar: "الحالات حسب مجموعة الإجراء" },
  byMainDiag: { en: "Cases by main diagnosis category", ar: "الحالات حسب تصنيف التشخيص الرئيسي" },
  byGender: { en: "Cases by gender", ar: "الحالات حسب الجنس" },
  dataQuality: { en: "Data quality", ar: "جودة البيانات" },
  noProcedure: { en: "No procedure recorded", ar: "بدون إجراء مسجل" },
  unusableDob: { en: "Unusable date of birth", ar: "تاريخ ميلاد غير صالح" },
  outsideRange: { en: "Dated outside the plausible range", ar: "تاريخ خارج النطاق المعقول" },
  noMainDiag: { en: "No main diagnosis category", ar: "بدون تصنيف تشخيص رئيسي" },
  cases: { en: "Cases", ar: "الحالات" },
  share: { en: "Share", ar: "النسبة" },
  doubleCountNote: {
    en:
      "A case whose procedure belongs to several categories is counted under each, so these " +
      "figures sum to more than the total case count above. They are category sizes, not a split " +
      "of the total.",
    ar:
      "الحالة التي ينتمي إجراؤها لعدة تصنيفات تحسب في كل تصنيف، لذلك يزيد مجموع هذه الأرقام عن " +
      "إجمالي الحالات أعلاه. هذه أحجام التصنيفات وليست تقسيما للإجمالي.",
  },
  adoptionNote: {
    en:
      "Coverage note: the logbook was still being adopted before 2025, so earlier years under-count " +
      "real activity. Year on year comparisons that start before 2025 will overstate growth.",
    ar:
      "ملاحظة عن التغطية: كان استخدام السجل لا يزال في مرحلة الانتشار قبل عام 2025، لذلك تقل أرقام " +
      "السنوات الأقدم عن النشاط الفعلي. المقارنة السنوية التي تبدأ قبل 2025 تبالغ في تقدير النمو.",
  },
  quality: {
    en: "These cases are included in the totals above and are listed here so nothing is hidden.",
    ar: "هذه الحالات مدرجة في الإجماليات أعلاه ومذكورة هنا حتى لا يخفى شيء.",
  },
} as const;

type Key = keyof typeof L;

interface Ctx {
  doc: InstanceType<typeof PDFDocument>;
  lang: ReportLang;
  left: number;
  right: number;
  width: number;
  bottom: number;
  regular: string;
  bold: string;
  /** Applies the Arabic single-line corrections when needed; a no-op for English. */
  s: (v: unknown) => string;
  rtl: boolean;
}

function buildCtx(doc: InstanceType<typeof PDFDocument>, lang: ReportLang): Ctx {
  let regular = "Helvetica";
  let bold = "Helvetica-Bold";
  if (lang === "ar" && fs.existsSync(ARABIC_FONT_PATH)) {
    doc.registerFont(ARABIC_FONT_FAMILY, ARABIC_FONT_PATH);
    // Cairo-Regular ships no bold face, so emphasis in Arabic comes from size and colour.
    regular = ARABIC_FONT_FAMILY;
    bold = ARABIC_FONT_FAMILY;
  }
  const left = REPORT_LAYOUT.pageMargin;
  const right = doc.page.width - REPORT_LAYOUT.pageMargin;
  return {
    doc,
    lang,
    left,
    right,
    width: right - left,
    bottom: doc.page.height - REPORT_LAYOUT.footerYFromBottom - 24,
    regular,
    bold,
    s: (v: unknown) => (lang === "ar" ? arabicLine(String(v ?? "")) : String(v ?? "")),
    rtl: lang === "ar",
  };
}

function lbl(k: Key, lang: ReportLang): string {
  return L[k][lang];
}

function share(n: number, total: number): string {
  if (!total) return "0%";
  return `${((n / total) * 100).toFixed(1)}%`;
}

/** Starts a fresh page when the next block would not fit. Footers are drawn later, in one pass. */
function ensureSpace(c: Ctx, needed: number) {
  if (c.doc.y + needed <= c.bottom) return;
  c.doc.addPage();
  c.doc.y = REPORT_LAYOUT.pageMargin;
}

function sectionTitle(c: Ctx, text: string) {
  ensureSpace(c, 46);
  c.doc.font(c.bold).fontSize(12).fillColor(COLORS.ink);
  c.doc.text(c.s(text), c.left, c.doc.y, {
    width: c.width,
    align: c.rtl ? "right" : "left",
    lineBreak: false,
  });
  c.doc.moveDown(0.35);
  const y = c.doc.y;
  c.doc.moveTo(c.left, y).lineTo(c.right, y).strokeColor(COLORS.rule).lineWidth(1).stroke();
  c.doc.y = y + 10;
}

function note(c: Ctx, text: string, color = COLORS.muted) {
  const body = c.lang === "ar" ? arabicParagraph(text) : text;
  const h = c.doc.font(c.regular).fontSize(8.5).heightOfString(body, { width: c.width });
  ensureSpace(c, h + 8);
  c.doc.fillColor(color);
  c.doc.text(body, c.left, c.doc.y, { width: c.width, align: c.rtl ? "right" : "left" });
  c.doc.moveDown(0.5);
}

/** Headline figures as a row of boxed cards. */
function statCards(c: Ctx, cards: Array<{ label: string; value: string }>) {
  const perRow = 3;
  const gap = 10;
  const w = (c.width - gap * (perRow - 1)) / perRow;
  const h = 44;

  for (let i = 0; i < cards.length; i += perRow) {
    const row = cards.slice(i, i + perRow);
    ensureSpace(c, h + gap);
    const y = c.doc.y;
    row.forEach((card, j) => {
      // In Arabic the cards read right to left, so the first card sits at the right edge.
      const slot = c.rtl ? perRow - 1 - j : j;
      const x = c.left + slot * (w + gap);
      c.doc.roundedRect(x, y, w, h, 4).fillColor(COLORS.cardBg).fill();
      c.doc.font(c.regular).fontSize(7.5).fillColor(COLORS.muted);
      c.doc.text(c.s(card.label), x + 8, y + 7, {
        width: w - 16,
        align: c.rtl ? "right" : "left",
        lineBreak: false,
      });
      // A long value (a date range) must shrink rather than wrap: wrapping spills out of the card.
      const size = card.value.length > 16 ? 10 : card.value.length > 12 ? 12 : 15;
      c.doc.font(c.bold).fontSize(size).fillColor(COLORS.ink);
      c.doc.text(c.s(card.value), x + 8, y + 20 + (15 - size) * 0.4, {
        width: w - 16,
        align: c.rtl ? "right" : "left",
        lineBreak: false,
        ellipsis: true,
      });
    });
    c.doc.y = y + h + gap;
  }
}

/** Vertical bars, for a time axis where the label is short. */
function verticalBars(
  c: Ctx,
  data: Array<{ label: string; value: number }>,
  opts: { height?: number } = {}
) {
  if (!data.length) return;
  const h = opts.height ?? 120;
  ensureSpace(c, h + 34);
  const top = c.doc.y;
  const max = Math.max(...data.map((d) => d.value), 1);
  const slot = c.width / data.length;
  const barW = Math.max(Math.min(slot * 0.62, 34), 2);

  // Baseline.
  c.doc
    .moveTo(c.left, top + h)
    .lineTo(c.right, top + h)
    .strokeColor(COLORS.rule)
    .lineWidth(1)
    .stroke();

  data.forEach((d, i) => {
    const barH = Math.max((d.value / max) * (h - 14), d.value > 0 ? 1 : 0);
    const x = c.left + i * slot + (slot - barW) / 2;
    const y = top + h - barH;
    c.doc.rect(x, y, barW, barH).fillColor(i === data.length - 1 ? COLORS.barAlt : COLORS.bar).fill();

    // Value above the bar, only when the slot is wide enough to read.
    if (slot > 22) {
      c.doc.font(c.regular).fontSize(6.5).fillColor(COLORS.muted);
      c.doc.text(String(d.value), c.left + i * slot, y - 9, {
        width: slot,
        align: "center",
        lineBreak: false,
      });
    }
    c.doc.font(c.regular).fontSize(6.5).fillColor(COLORS.muted);
    c.doc.text(d.label, c.left + i * slot, top + h + 4, {
      width: slot,
      align: "center",
      lineBreak: false,
    });
  });

  c.doc.y = top + h + 20;
}

/** Horizontal bars plus value and share, for long labels (hospital, procedure, category). */
function horizontalBars(
  c: Ctx,
  data: Array<{ label: string; value: number; valueText?: string }>,
  total: number,
  opts: { labelWidth?: number; showShare?: boolean; valueWidth?: number } = {}
) {
  if (!data.length) return;
  const labelW = opts.labelWidth ?? 190;
  const showShare = opts.showShare !== false;
  const valueW = opts.valueWidth ?? (showShare ? 74 : 40);
  const trackW = c.width - labelW - valueW - 16;
  const max = Math.max(...data.map((d) => d.value), 1);
  const rowH = 15;

  data.forEach((d) => {
    ensureSpace(c, rowH + 2);
    const y = c.doc.y;
    // Arabic reads right to left, so the label column sits on the right and bars grow leftward.
    const labelX = c.rtl ? c.right - labelW : c.left;
    const trackX = c.rtl ? c.left + valueW + 8 : c.left + labelW + 8;
    const valueX = c.rtl ? c.left : c.right - valueW;

    c.doc.font(c.regular).fontSize(8).fillColor(COLORS.ink);
    c.doc.text(c.s(d.label), labelX, y + 3, {
      width: labelW,
      align: c.rtl ? "right" : "left",
      lineBreak: false,
      ellipsis: true,
    });

    const barW = Math.max((d.value / max) * trackW, d.value > 0 ? 1.5 : 0);
    const barX = c.rtl ? trackX + trackW - barW : trackX;
    c.doc.rect(trackX, y + 4, trackW, 7).fillColor(COLORS.cardBg).fill();
    c.doc.rect(barX, y + 4, barW, 7).fillColor(COLORS.bar).fill();

    c.doc.font(c.regular).fontSize(8).fillColor(COLORS.muted);
    const valueText =
      d.valueText ?? (showShare ? `${d.value}   ${share(d.value, total)}` : String(d.value));
    c.doc.text(c.rtl ? c.s(valueText) : valueText, valueX, y + 3, {
      width: valueW,
      align: c.rtl ? "left" : "right",
      lineBreak: false,
    });

    c.doc.y = y + rowH;
  });
  c.doc.moveDown(0.4);
}

/**
 * Renders the report. `summary` is the /caseAnalytics/summary payload.
 * Resolves to the finished PDF as a Buffer.
 */
export function buildCaseAnalyticsPdf(meta: ReportMeta, summary: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: REPORT_LAYOUT.pageMargin,
      bufferPages: true,
      info: { Title: meta.title, Author: "LIBELUSpro" },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (d: Buffer) => chunks.push(d));
    doc.on("error", reject);
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    try {
      const c = buildCtx(doc, meta.lang);
      const lang = meta.lang;
      const total: number = summary?.totals?.totalCases ?? 0;
      const tt = summary?.totals ?? {};
      const dq = summary?.dataQuality ?? {};
      const align = c.rtl ? ("right" as const) : ("left" as const);

      // ----- Title block -----
      doc.y = REPORT_LAYOUT.pageMargin;
      doc.font(c.bold).fontSize(18).fillColor(COLORS.ink);
      doc.text(c.s(meta.title), c.left, doc.y, { width: c.width, align, lineBreak: false });
      doc.moveDown(0.3);
      doc.font(c.regular).fontSize(10).fillColor(COLORS.muted);
      doc.text(c.s(`${t("department", lang)}: ${meta.departmentLabel}`), c.left, doc.y, {
        width: c.width,
        align,
        lineBreak: false,
      });
      doc.moveDown(0.2);
      doc.fontSize(8.5);
      doc.text(c.s(`${t("generatedAt", lang)}: ${meta.generatedAt}`), c.left, doc.y, {
        width: c.width,
        align,
        lineBreak: false,
      });
      doc.moveDown(0.8);

      // ----- What was asked for. First thing in the document, deliberately: these files get
      // forwarded, and an extract that does not state its filters reads as a whole-department total.
      sectionTitle(c, lbl("filtersApplied", lang));
      meta.filterLines.forEach((line) => {
        const text = `${line.label}: ${line.value}`;
        const body = lang === "ar" ? arabicParagraph(text) : text;
        const h = doc.font(c.regular).fontSize(9).heightOfString(body, { width: c.width });
        ensureSpace(c, h + 4);
        doc.fillColor(COLORS.ink);
        doc.text(body, c.left, doc.y, { width: c.width, align });
        doc.moveDown(0.15);
      });
      doc.moveDown(0.5);

      // ----- Headline figures -----
      statCards(c, [
        { label: lbl("totalCases", lang), value: String(total) },
        {
          label: lbl("pediatric", lang),
          value: `${tt.pediatricCases ?? 0} (${share(tt.pediatricCases ?? 0, total)})`,
        },
        {
          label: lbl("adult", lang),
          value: `${tt.adultCases ?? 0} (${share(tt.adultCases ?? 0, total)})`,
        },
        { label: lbl("hospitals", lang), value: String(tt.distinctHospitals ?? 0) },
        { label: lbl("procedures", lang), value: String(tt.distinctProcedures ?? 0) },
        {
          label: lbl("dateRange", lang),
          // A neutral separator: an Arabic connector between two Latin dates would fight the
          // bidi ordering inside one text run.
          value: `${tt.firstDate ?? "-"} / ${tt.lastDate ?? "-"}`,
        },
      ]);

      // ----- Per year -----
      const byYear = summary?.byYear ?? [];
      if (byYear.length) {
        sectionTitle(c, lbl("casesPerYear", lang));
        // A single-year selection makes a one-bar column chart, which says nothing the row below
        // does not. Only draw the column chart when there is actually a trend to see.
        if (byYear.length > 1) {
          verticalBars(
            c,
            byYear.map((r: any) => ({ label: String(r.year), value: r.cases })),
            { height: 110 }
          );
        }
        horizontalBars(
          c,
          byYear.map((r: any) => ({
            label: String(r.year),
            value: r.cases,
            // Pediatric rides in the value column rather than the label, so the Arabic label stays
            // a clean right-to-left run with no embedded Latin.
            valueText: `${r.cases}   ${share(r.cases, total)}   ${lbl("pediatric", lang)}: ${r.pediatric}`,
          })),
          total,
          { labelWidth: 60, valueWidth: 190 }
        );
        note(c, lbl("adoptionNote", lang), COLORS.warn);
      }

      // ----- Per month, most recent 24 -----
      const months = (summary?.byMonth ?? []).slice(-24);
      if (months.length > 1) {
        sectionTitle(c, lbl("casesPerMonth", lang));
        verticalBars(
          c,
          months.map((r: any) => ({ label: String(r.bucket).slice(2), value: r.cases })),
          { height: 100 }
        );
      }

      // ----- Age groups: the axis the trainee-capacity question turns on -----
      const byAge = (summary?.byAgeBand ?? []).filter((r: any) => r.cases > 0);
      if (byAge.length) {
        sectionTitle(c, lbl("byAgeGroup", lang));
        horizontalBars(
          c,
          byAge.map((r: any) => ({ label: ageBandLabel(r.band, lang), value: r.cases })),
          total,
          { labelWidth: 200 }
        );
      }

      // ----- Hospitals -----
      const byHosp = summary?.byHospital ?? [];
      if (byHosp.length) {
        sectionTitle(c, lbl("byHospital", lang));
        horizontalBars(
          c,
          byHosp.map((r: any) => ({
            label: lang === "ar" ? r.arabName || r.engName : r.engName,
            value: r.cases,
          })),
          total,
          { labelWidth: 250 }
        );
      }

      // ----- Procedures, top 20 -----
      const byProc = (summary?.byProcedure ?? []).slice(0, 20);
      if (byProc.length) {
        sectionTitle(c, lbl("byProcedure", lang));
        horizontalBars(
          c,
          byProc.map((r: any) => ({
            label: lang === "ar" ? r.arTitle || r.title : r.title,
            value: r.cases,
          })),
          total,
          { labelWidth: 250 }
        );
      }

      // ----- Procedure families -----
      const byAlpha = summary?.byAlphaCode ?? [];
      if (byAlpha.length) {
        sectionTitle(c, lbl("byFamily", lang));
        horizontalBars(
          c,
          byAlpha.map((r: any) => ({
            label: alphaCodeLabel(r.alphaCode, lang),
            value: r.cases,
          })),
          total,
          { labelWidth: 200 }
        );
      }

      // ----- Main diagnosis: the one section that double-counts, and says so on the page -----
      const byMd = summary?.byMainDiag ?? [];
      if (byMd.length) {
        sectionTitle(c, lbl("byMainDiag", lang));
        note(c, lbl("doubleCountNote", lang), COLORS.warn);
        horizontalBars(
          c,
          byMd.map((r: any) => ({
            label: lang === "ar" ? r.arTitle || r.title : r.title,
            value: r.cases,
          })),
          total,
          { labelWidth: 250, showShare: false }
        );
      }

      // ----- Gender -----
      const byGender = summary?.byGender ?? [];
      if (byGender.length) {
        sectionTitle(c, lbl("byGender", lang));
        horizontalBars(
          c,
          byGender.map((r: any) => ({ label: genderLabel(r.gender, lang), value: r.cases })),
          total,
          { labelWidth: 200 }
        );
      }

      // ----- Data quality, always printed, even when every counter is zero -----
      sectionTitle(c, lbl("dataQuality", lang));
      horizontalBars(
        c,
        [
          { label: lbl("noProcedure", lang), value: dq.casesWithNoProcedureRecorded ?? 0 },
          { label: lbl("unusableDob", lang), value: dq.casesWithUnusableDob ?? 0 },
          { label: lbl("outsideRange", lang), value: dq.casesOutsidePlausibleDateRange ?? 0 },
          { label: lbl("noMainDiag", lang), value: dq.casesWithNoMainDiag ?? 0 },
        ],
        total,
        { labelWidth: 250 }
      );
      note(c, lbl("quality", lang));

      // ----- Footers, in one pass over the buffered pages.
      // Read the range BEFORE doc.end(), and zero the bottom margin so drawing below it cannot
      // silently spawn extra pages.
      const range = doc.bufferedPageRange();
      for (let i = 0; i < range.count; i++) {
        doc.switchToPage(range.start + i);
        const savedBottom = doc.page.margins.bottom;
        doc.page.margins.bottom = 0;
        doc.font("Helvetica");
        drawReportFooter(doc, c.left, c.right, i + 1);
        doc.page.margins.bottom = savedBottom;
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
