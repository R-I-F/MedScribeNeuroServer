/**
 * Shared report header and footer used by E-Certificate, Supervisor report, and Submission report PDFs.
 * Single source of truth for layout constants and draw functions.
 */
import type PDFDocument from "pdfkit";

/** Header/footer: content starts below header; footer sits above bottom margin. */
export const REPORT_LAYOUT = {
  headerContentStartY: 150,
  footerYFromBottom: 58,
  footerFontSize: 8,
  footerPageNumWidth: 56,
  pageMargin: 35,
  dividerColor: "#6b7280",
  dividerLineWidth: 0.75,
} as const;

export const FOOTER_TEXT =
  "LIBELUSpro - The Inteligent Lofbook for Medical Practice & Training\nwww.libeluspro.com";

/** Typography used in header/footer */
const REPORT_TYPO_HEADER_FOOTER = {
  brandSize: 20,
  subsectionSize: 10,
  captionSize: 8,
} as const;

const HEADER_FOOTER_COLORS = {
  bodyTextDark: "#111827",
  muted: "#6b7280",
} as const;

function toTitleCase(s: string | undefined | null): string {
  if (s == null || typeof s !== "string") return "—";
  return s.trim().replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Minimal institution info for header */
export interface ReportInstitution {
  name?: string | null;
  department?: string | null;
}

export interface DrawReportHeaderOptions {
  reportTitle?: string;
  candidateName?: string;
  /** For submission reports: show submission ID on the right of the Institution line. */
  submissionId?: string;
  includeReportGenerated?: boolean;
}

/**
 * Draw the standard report header (E-Certificate / Supervisor report style).
 * Sets doc.y to REPORT_LAYOUT.headerContentStartY after the header.
 */
export function drawReportHeader(
  doc: InstanceType<typeof PDFDocument>,
  left: number,
  right: number,
  institution: ReportInstitution,
  options: DrawReportHeaderOptions = {}
): void {
  const { reportTitle = "E-Certificate", candidateName, submissionId, includeReportGenerated = true } = options;
  doc.y = REPORT_LAYOUT.pageMargin + 5;
  const headerY = doc.y;
  doc
    .fontSize(REPORT_TYPO_HEADER_FOOTER.brandSize)
    .font("Helvetica-Bold")
    .fillColor(HEADER_FOOTER_COLORS.bodyTextDark);
  doc.text(reportTitle, left, headerY);
  doc.y = headerY + 26;
  doc.moveDown(0.25);
  if (candidateName) {
    doc
      .fontSize(REPORT_TYPO_HEADER_FOOTER.subsectionSize)
      .font("Helvetica")
      .fillColor(HEADER_FOOTER_COLORS.bodyTextDark);
    doc.text(candidateName, right - 200, doc.y, { width: 200, align: "right", lineBreak: false });
    doc.moveDown(0.5);
  }
  doc
    .fontSize(REPORT_TYPO_HEADER_FOOTER.subsectionSize)
    .font("Helvetica")
    .fillColor(HEADER_FOOTER_COLORS.muted);
  const institutionLineY = doc.y;
  doc.text(`Institution: ${toTitleCase(institution.name)}`, left, institutionLineY);
  if (submissionId) {
    doc.text(submissionId, right - 220, institutionLineY, { width: 220, align: "right", lineBreak: false });
  }
  doc.moveDown(0.25);
  doc.text(`Department: ${toTitleCase(institution.department)}`, left, doc.y);
  if (includeReportGenerated) {
    doc.moveDown(0.25);
    doc.fontSize(REPORT_TYPO_HEADER_FOOTER.captionSize).fillColor(HEADER_FOOTER_COLORS.muted);
    doc.text(`Report generated: ${new Date().toLocaleString()}`, left, doc.y);
    doc.moveDown(0.5);
  } else {
    doc.moveDown(0.35);
  }
  const headerBottom = doc.y + 10;
  doc
    .moveTo(left, headerBottom)
    .lineTo(right, headerBottom)
    .strokeColor(REPORT_LAYOUT.dividerColor)
    .lineWidth(1.5)
    .stroke();
  doc.y = REPORT_LAYOUT.headerContentStartY;
}

/**
 * Draw the standard report footer (divider line, LIBELUSpro text, page number).
 * Does not change doc.y (content position).
 */
export function drawReportFooter(
  doc: InstanceType<typeof PDFDocument>,
  left: number,
  right: number,
  pageNumber: number
): void {
  const footerY = doc.page.height - REPORT_LAYOUT.footerYFromBottom;
  const w = REPORT_LAYOUT.footerPageNumWidth;
  const savedY = doc.y;
  const dividerY = footerY - 16;
  doc
    .moveTo(left, dividerY)
    .lineTo(right, dividerY)
    .strokeColor(REPORT_LAYOUT.dividerColor)
    .lineWidth(1.5)
    .stroke();
  doc
    .fontSize(REPORT_LAYOUT.footerFontSize)
    .font("Helvetica")
    .fillColor(HEADER_FOOTER_COLORS.muted);
  doc.text(FOOTER_TEXT, left, footerY - 10, { width: right - left - w - 10 });
  doc.text(`Page ${pageNumber}`, right - w, footerY - 6, { width: w, align: "right", lineBreak: false });
  doc.y = savedY;
}
