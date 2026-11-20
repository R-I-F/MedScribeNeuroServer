/**
 * Landscape cover page of the E-Certificate (docs/PLATFORM_ENHANCEMENT_PLAN.md, Stage B).
 *
 * The certificate is SIGNED BY HAND (user decision 2026-11-20): the page leaves empty lines for
 * the programme director's name, signature, the date and a stamp box; nothing is pre-printed
 * there. The QR code and short code let anyone check the document at /verify/<code>.
 * The analytics pages that follow keep their portrait layout.
 */
import type PDFDocument from "pdfkit";
import { hasArabic, arabicLine } from "./arabicText";
import { REPORT_ROLE_ORDER } from "./reportRoles";
import type { CertificateSummary } from "../certificates/certificate.service";

export interface CertificateCoverInfo {
  institutionName: string;
  department: string;
  candidateName: string;
  regNum: string | null;
  degree: string | null;
  rank: string | null;
  periodFrom: string | null; // YYYY-MM-DD
  periodTo: string | null;
  summary: CertificateSummary;
  code: string;
  issuedAt: Date;
  verifyUrl: string;
  qrPng: Buffer;
  kind: "interim" | "final";
  arabicFontPath?: string;
}

const NAVY = "#1e3a5f";
const GOLD = "#b08d3c";
const INK = "#111827";
const MUTED = "#6b7280";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function fmtDate(d: string | null | undefined): string {
  if (!d || !/^\d{4}-\d{2}-\d{2}/.test(d)) return "-";
  return `${Number(d.slice(8, 10))} ${MONTHS[Number(d.slice(5, 7)) - 1]} ${d.slice(0, 4)}`;
}

export function capitalizeWords(s: string): string {
  return s
    .toLowerCase()
    .replace(/\b\p{L}/gu, (c) => c.toUpperCase())
    .replace(/\(([a-z]{1,5})\)/gi, (_m, code: string) => `(${code.toUpperCase()})`)
    .replace(/\b(Of|And|In)\b/g, (w) => w.toLowerCase());
}

/** Adds one landscape A4 page and draws the certificate on it. */
export function drawCertificateCover(doc: InstanceType<typeof PDFDocument>, info: CertificateCoverInfo): void {
  doc.addPage({ size: "A4", layout: "landscape", margin: 0 });
  const W = doc.page.width;
  const H = doc.page.height;
  const cx = W / 2;
  const hasAr = !!info.arabicFontPath;
  if (hasAr) doc.registerFont("CoverAr", info.arabicFontPath!);

  const text = (t: string, x: number, y: number, w: number, o: { size: number; bold?: boolean; color?: string; align?: "left" | "center" | "right"; spacing?: number }) => {
    const ar = hasArabic(t) && hasAr;
    doc.font(ar ? "CoverAr" : o.bold ? "Helvetica-Bold" : "Helvetica").fontSize(o.size).fillColor(o.color ?? INK);
    doc.text(ar ? arabicLine(t) : t, x, y, { width: w, align: o.align ?? "center", lineBreak: false, characterSpacing: o.spacing ?? 0 });
  };

  // Frame: an outer navy rule and a thin gold inner rule.
  doc.rect(18, 18, W - 36, H - 36).lineWidth(2.2).strokeColor(NAVY).stroke();
  doc.rect(26, 26, W - 52, H - 52).lineWidth(0.7).strokeColor(GOLD).stroke();

  if (info.kind === "interim") {
    doc.save();
    doc.rotate(-24, { origin: [cx, H / 2] });
    doc.font("Helvetica-Bold").fontSize(78).fillColor("#e5e7eb");
    doc.text("INTERIM RECORD", 0, H / 2 - 40, { width: W, align: "center", lineBreak: false });
    doc.restore();
  }

  // Header
  text(info.institutionName.toUpperCase(), 60, 52, W - 120, { size: 11, bold: true, color: NAVY, spacing: 1.5 });
  text(info.department, 60, 69, W - 120, { size: 10, color: MUTED });
  text("E-Certificate", 60, 98, W - 120, { size: 34, bold: true, color: NAVY });
  text("Record of surgical, academic and clinical training, verified in LibelusPro", 60, 140, W - 120, { size: 11, color: MUTED });
  doc.moveTo(cx - 60, 162).lineTo(cx + 60, 162).lineWidth(1).strokeColor(GOLD).stroke();

  // Holder
  text("This is to certify that", 60, 178, W - 120, { size: 11, color: MUTED });
  text(info.candidateName, 60, 196, W - 120, { size: 26, bold: true });
  const id = [
    info.regNum ? `Registration number ${info.regNum}` : null,
    info.degree ? capitalizeWords(info.degree) : null,
    info.rank ? capitalizeWords(info.rank) : null,
  ].filter(Boolean).join("   |   ");
  if (id) text(id, 60, 232, W - 120, { size: 10, color: MUTED });
  const period =
    info.periodFrom && info.periodTo
      ? `has recorded the following supervisor-approved experience between ${fmtDate(info.periodFrom)} and ${fmtDate(info.periodTo)}:`
      : "has recorded the following supervisor-approved experience:";
  text(period, 60, 254, W - 120, { size: 11 });

  // Headline numbers
  const s = info.summary;
  // Always: approved cases, academic points, clinical activities (when they apply). Roles fill the
  // remaining places of a six-tile row, largest first.
  const extras: [string, number][] = [];
  if (s.academicPoints !== null) extras.push(["Academic points", s.academicPoints]);
  if (s.clinicalApproved !== null && s.clinicalApproved > 0) extras.push(["Clinical activities", s.clinicalApproved]);
  const roles = REPORT_ROLE_ORDER.filter((r) => (s.byRole[r] ?? 0) > 0)
    .sort((a, b) => (s.byRole[b] ?? 0) - (s.byRole[a] ?? 0))
    .slice(0, Math.max(0, 5 - extras.length))
    .sort((a, b) => REPORT_ROLE_ORDER.indexOf(a) - REPORT_ROLE_ORDER.indexOf(b))
    .map((r) => [`As ${r.toLowerCase()}`, s.byRole[r]] as [string, number]);
  const shown: [string, number][] = [["Approved surgical cases", s.approvedCases], ...roles, ...extras];
  const gap = 12;
  const tileW = Math.min(118, (W - 140 - gap * (shown.length - 1)) / shown.length);
  const rowW = shown.length * tileW + (shown.length - 1) * gap;
  let tx = cx - rowW / 2;
  const ty = 280;
  for (const [label, value] of shown) {
    doc.roundedRect(tx, ty, tileW, 62, 5).lineWidth(0.7).strokeColor("#d1d5db").stroke();
    text(String(value), tx, ty + 10, tileW, { size: 22, bold: true, color: NAVY });
    text(label, tx + 4, ty + 40, tileW - 8, { size: 8, color: MUTED });
    tx += tileW + gap;
  }

  // Hand signature block (left): empty lines and a stamp box.
  const by = H - 150;
  const lineW = 190;
  const sigX = 60;
  const field = (label: string, x: number, y: number, w: number) => {
    doc.moveTo(x, y).lineTo(x + w, y).lineWidth(0.6).strokeColor(MUTED).stroke();
    text(label, x, y + 4, w, { size: 8.5, color: MUTED, align: "left" });
  };
  field("Programme director (name)", sigX, by, lineW);
  field("Signature", sigX, by + 46, lineW);
  field("Date", sigX + lineW + 30, by + 46, 120);
  doc.save();
  doc.rect(sigX + lineW + 30, by - 34, 120, 62).dash(3, { space: 3 }).lineWidth(0.6).strokeColor(MUTED).stroke();
  doc.undash();
  doc.restore();
  text("Stamp", sigX + lineW + 30, by - 34 + 26, 120, { size: 8.5, color: "#9ca3af" });

  // Verification block (right): QR, code, link, issue date.
  const qrSize = 92;
  const qx = W - 60 - qrSize;
  const qy = H - 166;
  doc.image(info.qrPng, qx, qy, { width: qrSize, height: qrSize });
  const vx = qx - 220;
  text("Verify this certificate", vx, qy + 6, 210, { size: 9, color: MUTED, align: "right" });
  text(info.code, vx, qy + 20, 210, { size: 16, bold: true, color: NAVY, align: "right", spacing: 1 });
  text(info.verifyUrl.replace(/^https?:\/\//, ""), vx, qy + 42, 210, { size: 8.5, color: MUTED, align: "right" });
  const issued = info.issuedAt.toISOString().slice(0, 10);
  text(`Issued ${fmtDate(issued)}`, vx, qy + 58, 210, { size: 8.5, color: MUTED, align: "right" });
  text("Scan the code or open the link to check this document is genuine and unchanged.", vx - 60, qy + 74, 270, {
    size: 7.5,
    color: "#9ca3af",
    align: "right",
  });
}
