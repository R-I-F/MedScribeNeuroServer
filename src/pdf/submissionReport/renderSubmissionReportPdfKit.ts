/**
 * Renders the submission case report to a PDF buffer using PDFKit.
 * Uses the same header/footer as E-Certificate and Supervisor reports (see pdf/reportLayout.ts).
 * Registers Cairo from assets/fonts/Cairo-Regular.ttf when present for Arabic (procedure title, patient name).
 */
import path from "path";
import fs from "fs";
import PDFDocument from "pdfkit";
import type { SubmissionReportViewModel } from "./submissionReport.types";
import { REPORT_LAYOUT, drawReportHeader, drawReportFooter } from "../reportLayout";
import type { DrawReportHeaderOptions } from "../reportLayout";

const ARABIC_FONT_FAMILY = "Cairo";
const ARABIC_FONT_PATH = path.resolve(process.cwd(), "assets", "fonts", "Cairo-Regular.ttf");

const LABEL_WIDTH = 130;
const CONTENT_WIDTH = 320;
const ROW_HEIGHT = 12;
const DIVIDER_COLOR = "#4b5563"; // slightly darker divider
const BODY_COLOR = "#111827"; // much heavier body text
const MUTED_COLOR = "#374151"; // darker muted text for descriptions
const ARABIC_REGEX = /[\u0600-\u06FF]/;

function titleCase(s: string | undefined | null): string {
  if (s == null || typeof s !== "string") return "—";
  return s.trim().replace(/\b\w/g, (c) => c.toUpperCase());
}

function orDash(s: string | undefined | null): string {
  if (s == null || typeof s !== "string") return "—";
  const t = String(s).trim();
  return t || "—";
}

/** Parse dd/mm/yyyy into Date, or return null if invalid. */
function parseDdMmYyyy(input: string | undefined | null): Date | null {
  if (!input) return null;
  const trimmed = String(input).trim();
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) return null;
  const [dd, mm, yyyy] = trimmed.split("/").map(Number);
  const d = new Date(yyyy, mm - 1, dd);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Calculate age in full years at a given date. */
function calculateAgeAt(dobStr: string | undefined | null, refDateStr: string | undefined | null): string {
  const dob = parseDdMmYyyy(dobStr);
  const ref = parseDdMmYyyy(refDateStr);
  if (!dob || !ref) return "—";
  let age = ref.getFullYear() - dob.getFullYear();
  const m = ref.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < dob.getDate())) {
    age -= 1;
  }
  if (age < 0 || age > 130) return "—";
  return `${age}`;
}

/** Normalize multiline free-text: collapse multiple blank lines to a single blank line. */
function normalizeMultiline(s: string): string {
  // Replace 3+ newlines with 2, then 2+ with 2 – avoids huge vertical gaps
  return s.replace(/\n{3,}/g, "\n\n").replace(/\n{2,}/g, "\n\n");
}

/** For surgical notes, force everything into a single paragraph with no explicit breaks or bullets. */
function normalizeSurgicalNotesToSingleParagraph(s: string): string {
  if (!s) return "";
  // Remove common bullet prefixes at line starts (e.g. "-", "*", "•")
  const withoutBullets = s.replace(/^[\t *\-•]+\s*/gm, "");
  // Replace all newlines and carriage returns with spaces
  const singleLine = withoutBullets.replace(/[\r\n]+/g, " ");
  // Collapse multiple spaces/tabs into a single space
  return singleLine.replace(/\s+/g, " ").trim();
}

/** Strip anything after the first '-' from a CPT numeric code. */
function normalizeCptCode(raw: string | undefined | null): string {
  const value = orDash(raw);
  if (value === "—") return value;
  const [head] = value.split("-");
  return head.trim() || value;
}

function ensureSpace(
  doc: PDFKit.PDFDocument,
  required: number,
  pageHeight: number,
  pageNumber: { current: number },
  left: number,
  right: number,
  institution: { name?: string | null; department?: string | null },
  headerOptions: DrawReportHeaderOptions
): void {
  if (doc.y + required > pageHeight - REPORT_LAYOUT.footerYFromBottom - 20) {
    drawReportFooter(doc, left, right, pageNumber.current);
    doc.addPage({ size: "A4", margin: REPORT_LAYOUT.pageMargin });
    pageNumber.current += 1;
    drawReportHeader(doc, left, right, institution, headerOptions);
  }
}

export type SubmissionReportPdfKitOptions = {
  institutionName: string;
  department?: string;
  /** When true, use Specialist / Consultant labels instead of Candidate / Supervisor. */
  isPractical?: boolean;
};

/**
 * Renders the submission report to a PDF buffer using PDFKit.
 * Pagination is explicit: new page only when content would go below the footer zone.
 */
export async function renderSubmissionReportPdfKit(
  data: SubmissionReportViewModel,
  options: SubmissionReportPdfKitOptions
): Promise<Buffer> {
  const { institutionName, department, isPractical } = options;
  const institution = { name: institutionName, department };
  const practical = Boolean(isPractical);
  const doc = new PDFDocument({ size: "A4", margin: REPORT_LAYOUT.pageMargin });
  let arabicFontFamily: string | undefined;
  if (fs.existsSync(ARABIC_FONT_PATH)) {
    try {
      doc.registerFont(ARABIC_FONT_FAMILY, ARABIC_FONT_PATH);
      arabicFontFamily = ARABIC_FONT_FAMILY;
    } catch {
      // fallback to Helvetica
    }
  }
  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));

  return new Promise((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", (err: Error) => reject(err));

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const left = REPORT_LAYOUT.pageMargin;
    const right = pageWidth - REPORT_LAYOUT.pageMargin;
    const contentWidth = right - left;
    const valueStartX = left + LABEL_WIDTH;

    let pageNumber = { current: 1 };

    const baseFont = arabicFontFamily ?? "Helvetica";
    const baseBoldFont = arabicFontFamily ?? "Helvetica-Bold";

    const headerOptions: DrawReportHeaderOptions = {
      reportTitle: "Surgical Case Report",
      includeReportGenerated: true,
      submissionId: data.submissionId,
    };

    const drawHeader = () => drawReportHeader(doc, left, right, institution, headerOptions);

    const drawSectionTitle = (title: string) => {
      // Heavier weight + native underline for section titles
      doc.fontSize(11).font(baseBoldFont).fillColor(BODY_COLOR);
      doc.text(title, left, doc.y, { underline: true });
      doc.y += 14;
    };

    const drawRow = (label: string, value: string, valueWidth?: number, useArabicFont = false) => {
      const w = valueWidth ?? contentWidth - LABEL_WIDTH;
      const rowY = doc.y;
      const labelFont = useArabicFont && arabicFontFamily ? arabicFontFamily : baseBoldFont;
      doc.fontSize(9).font(labelFont).fillColor(BODY_COLOR);
      doc.text(label, left, rowY, { width: LABEL_WIDTH - 4, lineBreak: false });
      const valueFont = useArabicFont && arabicFontFamily ? arabicFontFamily : baseFont;
      doc.font(valueFont).fillColor(BODY_COLOR);
      const textOptions =
        useArabicFont && arabicFontFamily && ARABIC_REGEX.test(value)
          ? ({ width: w, lineBreak: true, features: ["rtla"] } as PDFKit.Mixins.TextOptions)
          : ({ width: w, lineBreak: true } as PDFKit.Mixins.TextOptions);
      doc.text(value, valueStartX, rowY, textOptions);
      doc.y = rowY + Math.max(ROW_HEIGHT, doc.y - rowY);
    };

    const drawDivider = () => {
      // Avoid drawing a divider so close to the footer that it visually intersects with it
      const bottomLimit = pageHeight - REPORT_LAYOUT.footerYFromBottom - 10;
      if (doc.y >= bottomLimit) {
        return;
      }
      const y = doc.y + 4;
      doc.moveTo(left, y).lineTo(right, y).strokeColor(DIVIDER_COLOR).lineWidth(0.75).stroke();
      doc.y = y + 6;
    };

    // ----- Header (first page)
    drawHeader();

    const candidateHeading = practical ? "Specialist" : "Candidate";
    const supervisorHeading = practical ? "Consultant" : "Supervisor";

    // ----- Candidate / Specialist (with approval status on first row, right aligned)
    ensureSpace(doc, 80, pageHeight, pageNumber, left, right, institution, headerOptions);
    drawSectionTitle(candidateHeading);
    const status = data.subStatus.toUpperCase();
    const statusColor = status === "APPROVED" ? "#15803d" : status === "PENDING" ? "#b45309" : "#374151";
    const fullNameY = doc.y;
    // Label + value
    doc.fontSize(9).font(baseBoldFont).fillColor(BODY_COLOR);
    doc.text("Full name", left, fullNameY, { width: LABEL_WIDTH - 4, lineBreak: false });
    doc.font(baseFont).fillColor(BODY_COLOR);
    doc.text(titleCase(data.candidate.fullName), valueStartX, fullNameY, { width: contentWidth - LABEL_WIDTH, lineBreak: true });
    // Status on the same line, right aligned
    doc.font(baseBoldFont).fillColor(statusColor);
    const statusWidth = 90;
    doc.text(status, right - statusWidth, fullNameY, { width: statusWidth, align: "right", lineBreak: false });
    doc.y = fullNameY + ROW_HEIGHT;

    drawRow("Rank", titleCase(data.candidate.rank));
    drawDivider();

    // ----- Supervisor / Consultant
    ensureSpace(doc, 80, pageHeight, pageNumber, left, right, institution, headerOptions);
    drawSectionTitle(supervisorHeading);
    drawRow("Full name", titleCase(data.supervisor.fullName));
    drawRow("Position", titleCase(data.supervisor.position));
    drawDivider();

    // ----- Procedure Details
    ensureSpace(doc, 220, pageHeight, pageNumber, left, right, institution, headerOptions);
    drawSectionTitle("Procedure Details");
    drawRow("Procedure date", orDash(data.calSurg.procDate));
    drawRow("Hospital", orDash(data.calSurg.hospitalName));
    drawRow("Procedure", orDash(data.calSurg.arabProcTitle), undefined, true);
    drawRow("Procedure code", orDash(data.calSurg.arabProcNumCode));
    drawRow("Patient name", orDash(data.calSurg.patientName), undefined, true);
    drawRow("Patient DOB", orDash(data.calSurg.patientDob));
    const ageAtProc = calculateAgeAt(data.calSurg.patientDob, data.calSurg.procDate);
    drawRow("Patient age at procedure", ageAtProc !== "—" ? `${ageAtProc} years` : "—");
    drawRow("Gender", orDash(data.calSurg.gender));
    drawDivider();

    // ----- Main Diagnosis (may be Arabic)
    ensureSpace(doc, 50, pageHeight, pageNumber, left, right, institution, headerOptions);
    drawSectionTitle("Main Diagnosis");
    const mainDiagRaw = data.mainDiagnosis !== "—" ? data.mainDiagnosis : "—";
    const mainDiagIsArabic = ARABIC_REGEX.test(mainDiagRaw);
    const mainDiagText = mainDiagIsArabic ? mainDiagRaw : titleCase(mainDiagRaw);
    const mainDiagFont = mainDiagIsArabic && arabicFontFamily ? arabicFontFamily : baseFont;
    doc.fontSize(9).font(mainDiagFont).fillColor(BODY_COLOR);
    const mainDiagOptions =
      mainDiagIsArabic && arabicFontFamily
        ? ({ width: contentWidth, features: ["rtla"] } as PDFKit.Mixins.TextOptions)
        : ({ width: contentWidth } as PDFKit.Mixins.TextOptions);
    doc.text(mainDiagText, left, doc.y, mainDiagOptions);
    doc.y += ROW_HEIGHT + 8;
    drawDivider();

    // ----- ICDs
    if (data.icds && data.icds.length > 0) {
      ensureSpace(doc, 30 + data.icds.length * (ROW_HEIGHT + 4), pageHeight, pageNumber, left, right, institution, headerOptions);
      drawSectionTitle("ICD (Diagnoses)");
      for (const icd of data.icds) {
        doc.fontSize(9).font(baseFont).fillColor(BODY_COLOR);
        doc.text(`${orDash(icd.code)} — ${titleCase(icd.name)}`, left + 8, doc.y, { width: contentWidth - 8 });
        doc.y += ROW_HEIGHT;
      }
      drawDivider();
    }

    // ----- CPTs
    if (data.cpts && data.cpts.length > 0) {
      // Conservatively estimate required height using actual text metrics so we don't collide with the footer
      let cptHeight = 24;
      const titleWidth = contentWidth - 8;
      const descWidth = contentWidth - 16;
      doc.fontSize(9).font(baseFont);
      for (const cpt of data.cpts) {
        const normalizedCptCodeForMeasure = normalizeCptCode(cpt.numCode);
        const line = `${titleCase(cpt.title)} — Alpha code: ${orDash(cpt.alphaCode)}, CPT code: ${normalizedCptCodeForMeasure}`;
        cptHeight += doc.heightOfString(line, { width: titleWidth }) + 6;
        if (cpt.description && cpt.description !== "—") {
          doc.fontSize(8).font(baseFont);
          cptHeight += doc.heightOfString(orDash(cpt.description), { width: descWidth }) + 6;
          doc.fontSize(9).font(baseFont);
        }
      }
      ensureSpace(doc, cptHeight + 10, pageHeight, pageNumber, left, right, institution, headerOptions);

      drawSectionTitle("CPT (Procedures)");
      for (const cpt of data.cpts) {
        const normalizedCptCode = normalizeCptCode(cpt.numCode);
        doc.fontSize(9).font(baseFont).fillColor(BODY_COLOR);
        doc.text(
          `${titleCase(cpt.title)} — Alpha code: ${orDash(cpt.alphaCode)}, CPT code: ${normalizedCptCode}`,
          left + 8,
          doc.y,
          { width: titleWidth }
        );
        doc.y += ROW_HEIGHT;
        if (cpt.description && cpt.description !== "—") {
          doc.fontSize(8).font(baseFont).fillColor(MUTED_COLOR);
          doc.text(orDash(cpt.description), left + 16, doc.y, { width: descWidth });
          doc.y += 10;
        }
      }
      drawDivider();
    }

    // ----- Submission Details
    ensureSpace(doc, 280, pageHeight, pageNumber, left, right, institution, headerOptions);
    drawSectionTitle("Submission Details");
    drawRow("Timestamp", orDash(data.timeStamp));
    drawRow("Role in surgery", titleCase(data.roleInSurg));
    if (data.assRoleDesc) drawRow("Assistant role description", titleCase(data.assRoleDesc));
    drawRow("Other surgeon rank", titleCase(data.otherSurgRank));
    drawRow("Other surgeon name", titleCase(data.otherSurgName));
    drawRow("Revision surgery", data.isItRevSurg ? "Yes" : "No");
    if (data.preOpClinCond) drawRow("Pre-op clinical condition", titleCase(data.preOpClinCond));
    drawRow("Instruments used", titleCase(data.insUsed));
    drawRow("Consumables used", titleCase(data.consUsed));
    if (data.consDetails) drawRow("Consumables details", titleCase(data.consDetails));
    drawDivider();

    // ----- Anatomy & Approach (optional)
    if (data.region || data.approach || data.pos || data.spOrCran) {
      ensureSpace(doc, 100, pageHeight, pageNumber, left, right, institution, headerOptions);
      drawSectionTitle("Anatomy & Approach");
      if (data.region) drawRow("Region", titleCase(data.region));
      if (data.approach) drawRow("Approach", titleCase(data.approach));
      if (data.pos) drawRow("Position", titleCase(data.pos));
      if (data.spOrCran) drawRow("Spinal / Cranial", titleCase(data.spOrCran));
      drawDivider();
    }

    // ----- Notes & Events (optional)
    if (data.surgNotes || data.IntEvents) {
      doc.fontSize(9).font(baseFont);
      const normalizedSurgNotes = data.surgNotes ? normalizeSurgicalNotesToSingleParagraph(data.surgNotes) : "";
      const normalizedIntEvents = data.IntEvents ? normalizeMultiline(data.IntEvents) : "";

      // If we're already too close to the footer, move the entire Notes & Events
      // section to the next page to avoid any overlap with the footer area.
      const maxContentY = pageHeight - REPORT_LAYOUT.footerYFromBottom - 220; // need at least ~220pt headroom
      if (doc.y > maxContentY) {
        ensureSpace(doc, pageHeight, pageHeight, pageNumber, left, right, institution, headerOptions);
      }
      drawSectionTitle("Notes & Events");
      if (data.surgNotes) {
        // Underlined sub-heading: Surgical notes
        doc.fontSize(9).font(baseBoldFont).fillColor(BODY_COLOR);
        doc.text("Surgical notes", left, doc.y, { underline: true });
        doc.y += 12;
        // Single continuous paragraph, no explicit breaks or bullets
        doc.font(baseFont).fillColor(BODY_COLOR);
        doc.text(normalizedSurgNotes, left, doc.y, { width: contentWidth });
        // Exactly two standard line breaks before the next sub-heading
        doc.moveDown(2);
      }
      if (data.IntEvents) {
        // Underlined sub-heading: Intraoperative events
        doc.fontSize(9).font(baseBoldFont).fillColor(BODY_COLOR);
        doc.text("Intraoperative events", left, doc.y, { underline: true });
        doc.y += 12;
        doc.font(baseFont).fillColor(BODY_COLOR);
        doc.text(normalizedIntEvents, left, doc.y, { width: contentWidth });
        // Modest spacing after the block before the next section
        doc.moveDown(1);
      }
      // Only draw a divider if there's still plenty of space before the footer.
      // If Notes & Events is the last section on the page, we let the footer divider do the job.
      const notesBottomLimit = pageHeight - REPORT_LAYOUT.footerYFromBottom - 80;
      if (doc.y < notesBottomLimit) {
        drawDivider();
      }
    }

    // ----- Review (optional)
    if (data.review || data.reviewedAt) {
      doc.fontSize(9).font(baseFont);
      const reviewHeight = 30 + (data.review ? doc.heightOfString(data.review, { width: contentWidth }) : 0);
      ensureSpace(doc, Math.min(reviewHeight + 30, 300), pageHeight, pageNumber, left, right, institution, headerOptions);
      drawSectionTitle("Review");
      if (data.review) {
        doc.fontSize(9).font("Helvetica-Bold").fillColor(BODY_COLOR);
        doc.text("Review comment", left, doc.y);
        doc.y += 12;
        doc.font("Helvetica").fillColor(BODY_COLOR);
        doc.text(data.review, left, doc.y, { width: contentWidth });
        doc.y += doc.heightOfString(data.review, { width: contentWidth }) + 10;
      }
      if (data.reviewedAt) drawRow("Reviewed at", data.reviewedAt);
    }

    drawReportFooter(doc, left, right, pageNumber.current);
    doc.end();
  });
}
