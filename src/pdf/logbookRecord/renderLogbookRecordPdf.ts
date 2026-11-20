/**
 * Logbook Record PDF: the long-form companion to the E-Certificate.
 *
 * Design (agreed 2026-11-20, replacing a first striped, clipped layout):
 *   - A ruled ledger. Every column is separated by a thin vertical rule and every entry by a
 *     horizontal rule, so a reader can always tell which text belongs to which cell. No zebra
 *     striping (it adds noise to a gridded table and the evidence that it helps is weak).
 *   - Nothing is clipped. Cells wrap to as many lines as they need; an entry grows taller instead.
 *   - Codes are bold and their names regular, with the name wrapping under itself (hanging
 *     indent), one code per line.
 *   - A surgical case is one framed block: the main row, then a lightly tinted "details" band
 *     inside the same frame, spanning the Diagnosis to Status columns. The band can never run
 *     across another case's columns.
 *   - The main diagnosis category is a small grey label at the top of the Diagnosis cell, not a
 *     column of its own.
 *   - Running header, footer and "Page X of Y" are drawn in a final pass over buffered pages with
 *     the bottom margin lifted, so the footer can never create extra pages.
 *
 * A4 landscape. Institute admins only (the route is gated; no access logic lives here).
 */
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { hasArabic, arabicLine, arabicParagraph } from "../arabicText";
import { REPORT_ROLE_ORDER } from "../reportRoles";
import { FOOTER_TEXT } from "../reportLayout";
import { formatInstitutionDateTime } from "../../utils/institutionDateFormat";
import type {
  LogbookRecordData,
  SurgicalEntry,
  AcademicEntry,
  ClinicalEntry,
  CodedItem,
  DetailPair,
} from "./logbookRecord.data";

export interface LogbookRecordRenderOptions {
  institutionName: string;
  generatedAt: Date;
  documentRef: string;
}

type Doc = InstanceType<typeof PDFDocument>;
type Align = "left" | "right" | "center";

interface Col {
  label: string;
  width: number;
  align?: Align;
}

/** One paragraph inside a cell. With `code`, prints "CODE name" with the name hanging-indented. */
interface Item {
  text: string;
  code?: string;
  bold?: boolean;
  color?: string;
  size?: number;
}
type Cell = string | Item | Item[];

interface Row {
  cells: Cell[];
  /** Case details, drawn as a band inside the same frame from column `bandFrom` to the end. */
  band?: DetailPair[];
}

const ARABIC_FONT_PATH = path.resolve(process.cwd(), "assets", "fonts", "Cairo-Regular.ttf");

const M = 30; // page margin
const HEADER_H = 44; // running header (pages after the cover)
const FOOTER_H = 34;
const BODY = 7.6;
const SMALL = 6.3;
const BAND = 7;
const LINE_GAP = 1.2;
const PAD_X = 4;
const PAD_Y = 3.6;
const ITEM_GAP = 2;
const CODE_GAP = 5;
const HEAD_ROW_H = 17;

const C = {
  ink: "#111827",
  text: "#1f2937",
  muted: "#6b7280",
  grid: "#c3cad4",
  blockRule: "#7d8796",
  headFill: "#1e3a5f",
  headRule: "#4a6488",
  headText: "#ffffff",
  accent: "#1e3a5f",
  groupFill: "#e6edf5",
  bandFill: "#f5f7fa",
  approved: "#15803d",
  pending: "#b45309",
  rejected: "#b91c1c",
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2025-01-12" -> "12 Jan 2025" */
function fmtDate(d: string | null | undefined): string {
  if (!d || !/^\d{4}-\d{2}-\d{2}/.test(d)) return "-";
  return `${d.slice(8, 10)} ${MONTHS[Number(d.slice(5, 7)) - 1]} ${d.slice(0, 4)}`;
}

/** "doctor of medicine (md)" -> "Doctor of Medicine (MD)". */
function capitalizeWords(s: string): string {
  return s
    .toLowerCase()
    .replace(/\b\p{L}/gu, (c) => c.toUpperCase())
    .replace(/\(([a-z]{1,5})\)/gi, (_m, code: string) => `(${code.toUpperCase()})`)
    .replace(/\b(Of|And|In)\b/g, (w) => w.toLowerCase());
}

function statusLabel(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "-";
}

function statusColor(s: string): string {
  if (s === "approved") return C.approved;
  if (s === "rejected") return C.rejected;
  return C.pending;
}

function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

const coded = (list: CodedItem[]): Item[] => list.map((d) => ({ code: d.code || undefined, text: d.name }));

export async function renderLogbookRecordPdf(
  data: LogbookRecordData,
  opts: LogbookRecordRenderOptions
): Promise<Buffer> {
  const doc: Doc = new PDFDocument({
    size: "A4",
    layout: "landscape",
    margins: { top: M, bottom: M, left: M, right: M },
    bufferPages: true,
    info: {
      Title: `Logbook Record - ${data.candidate.fullName}`,
      Author: "LibelusPro",
      Subject: "Complete record of surgical, academic and clinical experience",
    },
  });
  const hasArabicFont = fs.existsSync(ARABIC_FONT_PATH);
  if (hasArabicFont) doc.registerFont("Ar", ARABIC_FONT_PATH);

  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  const W = doc.page.width;
  const H = doc.page.height;
  const left = M;
  const right = W - M;
  const contentW = right - left;
  const contentTop = M + HEADER_H;
  const maxY = H - M - FOOTER_H;
  let y = contentTop;

  const cand = data.candidate;
  const candName = cand.fullName ? cand.fullName.replace(/\b\p{L}/gu, (c) => c.toUpperCase()) : "-";
  const deptName = cand.departmentName || "-";
  const generatedStr = formatInstitutionDateTime(opts.generatedAt);
  const sectionPages: { title: string; page: number }[] = [];
  let bandOverflows = 0;

  // ================= text primitives =================
  const setFont = (bold: boolean, size: number, arabic: boolean) => {
    if (arabic && hasArabicFont) doc.font("Ar");
    else doc.font(bold ? "Helvetica-Bold" : "Helvetica");
    doc.fontSize(size);
  };

  /** Clip to one line with an ellipsis (used only for headers/footers, never for table data). */
  const fit = (t: string, w: number): string => {
    if (doc.widthOfString(t) <= w) return t;
    let lo = 0;
    let hi = t.length;
    while (lo < hi) {
      const mid = Math.ceil((lo + hi) / 2);
      if (doc.widthOfString(t.slice(0, mid).trimEnd() + "…") <= w) lo = mid;
      else hi = mid - 1;
    }
    return t.slice(0, lo).trimEnd() + "…";
  };

  /** One single line at an exact position (page furniture). Never moves the layout cursor. */
  const line = (
    t: string,
    x: number,
    yy: number,
    w: number,
    o: { bold?: boolean; size?: number; color?: string; align?: Align } = {}
  ) => {
    const s = t ?? "";
    const ar = hasArabic(s);
    setFont(!!o.bold, o.size ?? BODY, ar);
    doc.fillColor(o.color ?? C.text);
    const clipped = fit(s, w);
    doc.text(ar ? arabicLine(clipped) : clipped, x, yy, { width: w, lineBreak: false, align: o.align ?? "left" });
  };

  const newPage = () => {
    doc.addPage({ size: "A4", layout: "landscape", margins: { top: M, bottom: M, left: M, right: M } });
    y = contentTop;
  };
  const ensure = (h: number): boolean => {
    if (y + h > maxY) {
      newPage();
      return true;
    }
    return false;
  };

  // ================= wrapped cell content =================
  const toItems = (c: Cell): Item[] => {
    if (typeof c === "string") return [{ text: c }];
    if (Array.isArray(c)) return c;
    return [c];
  };

  const codeWidth = (item: Item): number => {
    if (!item.code) return 0;
    setFont(true, item.size ?? BODY, false);
    return doc.widthOfString(item.code) + CODE_GAP;
  };

  const prep = (t: string) => (hasArabic(t) ? arabicParagraph(t) : t);

  const measureItem = (item: Item, w: number): number => {
    const size = item.size ?? BODY;
    const cw = codeWidth(item);
    setFont(!!item.bold, size, hasArabic(item.text));
    const textW = Math.max(10, w - cw);
    const h = item.text ? doc.heightOfString(prep(item.text), { width: textW, lineGap: LINE_GAP }) : 0;
    return Math.max(h, doc.currentLineHeight(true));
  };

  const drawItem = (item: Item, x: number, yy: number, w: number, align: Align): number => {
    const size = item.size ?? BODY;
    const cw = codeWidth(item);
    if (item.code) {
      setFont(true, size, false);
      doc.fillColor(C.ink);
      doc.text(item.code, x, yy, { width: cw, lineBreak: false });
    }
    setFont(!!item.bold, size, hasArabic(item.text));
    doc.fillColor(item.color ?? C.text);
    const textW = Math.max(10, w - cw);
    if (item.text) doc.text(prep(item.text), x + cw, yy, { width: textW, lineGap: LINE_GAP, align });
    return measureItem(item, w);
  };

  const cellHeight = (cell: Cell, w: number): number => {
    const items = toItems(cell);
    return items.reduce((a, it) => a + measureItem(it, w - 2 * PAD_X), 0) + ITEM_GAP * Math.max(0, items.length - 1);
  };

  const bandText = (band: DetailPair[]) => band.map((p) => (p.value ? `${p.label}: ${p.value}` : p.label)).join("     ·     ");

  /**
   * Height of the details band. Arabic runs are measured as one paragraph. Latin runs are drawn as
   * bold labels plus regular values, which heightOfString cannot measure in one call, so the line
   * count comes from the exact mixed width with a margin for word-wrap waste (measuring the whole
   * string in bold reserved an empty second line on many cases).
   */
  const bandHeight = (band: DetailPair[] | undefined, w: number): number => {
    if (!band || band.length === 0) return 0;
    const tw = w - 2 * PAD_X;
    const t = bandText(band);
    if (hasArabic(t)) {
      setFont(false, BAND, true);
      return doc.heightOfString(arabicParagraph(t), { width: tw, lineGap: LINE_GAP }) + 2 * PAD_Y;
    }
    // Greedy word wrap over the mixed bold/regular words, the same way pdfkit breaks lines.
    const words: { w: number; space: number }[] = [];
    band.forEach((p, i) => {
      const parts: [string, boolean][] = [
        [p.value ? `${p.label}:` : p.label, true],
        [p.value || "", false],
        [i === band.length - 1 ? "" : "·", false],
      ];
      for (const [text, bold] of parts) {
        setFont(bold, BAND, false);
        const space = doc.widthOfString(" ");
        for (const word of text.split(/\s+/).filter(Boolean)) words.push({ w: doc.widthOfString(word), space });
      }
    });
    let lines = 1;
    let cur = 0;
    let prevDot = false;
    for (const word of words) {
      // The middle-dot separator has five spaces on each side.
      const isDot = word.w < 4;
      const gap = cur === 0 ? 0 : word.space * (isDot || prevDot ? 5 : 1);
      if (cur > 0 && cur + gap + word.w > tw) {
        lines += 1;
        cur = word.w;
      } else {
        cur += gap + word.w;
      }
      prevDot = isDot;
    }
    setFont(false, BAND, false);
    const lineH = doc.currentLineHeight(true);
    return lines * lineH + (lines - 1) * LINE_GAP + 2 * PAD_Y + 1;
  };

  /** Label bold, value regular, pairs separated by a middle dot; Arabic falls back to one run. */
  const drawBand = (band: DetailPair[], x: number, yy: number, w: number) => {
    const tw = w - 2 * PAD_X;
    const tx = x + PAD_X;
    const ty = yy + PAD_Y;
    const all = bandText(band);
    if (hasArabic(all)) {
      setFont(false, BAND, true);
      doc.fillColor(C.text).text(arabicParagraph(all), tx, ty, { width: tw, lineGap: LINE_GAP });
      return;
    }
    band.forEach((p, i) => {
      const last = i === band.length - 1;
      const label = p.value ? `${p.label}: ` : p.label;
      setFont(true, BAND, false);
      doc.fillColor(C.ink);
      if (i === 0) doc.text(label, tx, ty, { width: tw, lineGap: LINE_GAP, continued: true });
      else doc.text(label, { continued: true });
      setFont(false, BAND, false);
      doc.fillColor(C.text);
      const tail = (p.value || "") + (last ? "" : "     ·     ");
      doc.text(tail || " ", { continued: !last });
    });
  };

  // ================= ruled table engine =================
  const colXs = (cols: Col[]): number[] => {
    const xs = [left];
    for (const c of cols) xs.push(xs[xs.length - 1] + c.width);
    return xs;
  };

  const drawHeaderRow = (cols: Col[]) => {
    const xs = colXs(cols);
    doc.rect(left, y, contentW, HEAD_ROW_H).fill(C.headFill);
    cols.forEach((col, i) => {
      line(col.label, xs[i] + PAD_X, y + 5, col.width - 2 * PAD_X, {
        bold: true,
        size: BODY,
        color: C.headText,
        align: col.align,
      });
    });
    doc.lineWidth(0.5).strokeColor(C.headRule);
    for (let i = 1; i < cols.length; i++) doc.moveTo(xs[i], y).lineTo(xs[i], y + HEAD_ROW_H).stroke();
    y += HEAD_ROW_H;
  };

  const rowHeights = (cols: Col[], row: Row, bandFrom: number) => {
    const main = Math.max(...cols.map((c, i) => cellHeight(row.cells[i] ?? "", c.width))) + 2 * PAD_Y;
    const bandW = cols.slice(bandFrom).reduce((a, c) => a + c.width, 0);
    const band = bandHeight(row.band, bandW);
    return { main: Math.max(main, 15), band };
  };

  /** One entry: cells, grid rules, optional details band, and a heavier rule under the block. */
  const drawRow = (cols: Col[], row: Row, bandFrom: number) => {
    const xs = colXs(cols);
    const { main, band } = rowHeights(cols, row, bandFrom);
    const total = main + band;

    if (band > 0) doc.rect(xs[bandFrom], y + main, right - xs[bandFrom], band).fill(C.bandFill);

    cols.forEach((col, i) => {
      let cy = y + PAD_Y;
      for (const item of toItems(row.cells[i] ?? "")) {
        cy += drawItem(item, xs[i] + PAD_X, cy, col.width - 2 * PAD_X, col.align ?? "left") + ITEM_GAP;
      }
    });
    if (band > 0 && row.band) {
      drawBand(row.band, xs[bandFrom], y + main, right - xs[bandFrom]);
      // pdfkit leaves doc.y under the last drawn line: past the frame means the estimate was short.
      if (doc.y > y + main + band + 0.5) bandOverflows += 1;
    }

    doc.lineWidth(0.5).strokeColor(C.grid);
    // Outer frame sides and the column rules. Rules left of the band run the full block height.
    doc.moveTo(left, y).lineTo(left, y + total).stroke();
    doc.moveTo(right, y).lineTo(right, y + total).stroke();
    for (let i = 1; i < cols.length; i++) {
      const bottom = band > 0 && i > bandFrom ? y + main : y + total;
      doc.moveTo(xs[i], y).lineTo(xs[i], bottom).stroke();
    }
    if (band > 0) doc.moveTo(xs[bandFrom], y + main).lineTo(right, y + main).stroke();

    y += total;
    doc.lineWidth(band > 0 ? 0.8 : 0.5).strokeColor(band > 0 ? C.blockRule : C.grid);
    doc.moveTo(left, y).lineTo(right, y).stroke();
  };

  /** Rows with the header repeated after every page break. An entry is never split across pages. */
  const drawRows = (cols: Col[], rows: Row[], bandFrom = cols.length) => {
    for (const row of rows) {
      const { main, band } = rowHeights(cols, row, bandFrom);
      if (ensure(main + band)) drawHeaderRow(cols);
      drawRow(cols, row, bandFrom);
    }
  };

  /** Group band (a year) kept together with the header row and the first entry. */
  const drawGroupBand = (cols: Col[], label: string, firstRow: Row | undefined, bandFrom = cols.length) => {
    const first = firstRow ? rowHeights(cols, firstRow, bandFrom) : { main: 0, band: 0 };
    ensure(20 + HEAD_ROW_H + first.main + first.band);
    doc.rect(left, y, contentW, 17).fill(C.groupFill);
    line(label, left + PAD_X + 2, y + 4.8, contentW - 10, { bold: true, size: 8.6, color: C.accent });
    y += 19;
    drawHeaderRow(cols);
  };

  const drawSubtotal = (label: string) => {
    ensure(18);
    line(label, left, y + 4, contentW, { bold: true, size: 7.4, color: C.accent, align: "right" });
    y += 22;
  };

  const drawTable = (title: string | null, cols: Col[], rows: Row[], note?: string) => {
    const first = rows[0] ? rowHeights(cols, rows[0], cols.length) : { main: 16, band: 0 };
    ensure((title ? 18 : 0) + (note ? 12 : 0) + HEAD_ROW_H + first.main);
    if (title) {
      line(title, left, y, contentW, { bold: true, size: 9.5, color: C.ink });
      y += 15;
    }
    if (note) {
      line(note, left, y, contentW, { size: 7, color: C.muted });
      y += 11;
    }
    drawHeaderRow(cols);
    if (rows.length === 0) drawRow(cols, { cells: [{ text: "No entries.", color: C.muted }] }, cols.length);
    else drawRows(cols, rows);
    y += 14;
  };

  const sectionStart = (title: string, subtitle: string) => {
    newPage();
    sectionPages.push({ title, page: doc.bufferedPageRange().count });
    doc.rect(left, y, 3.5, 30).fill(C.accent);
    line(title, left + 10, y + 1, contentW - 10, { bold: true, size: 15, color: C.ink });
    line(subtitle, left + 10, y + 20, contentW - 10, { size: 8, color: C.muted });
    y += 42;
  };

  const emptyNote = (t: string) => {
    line(t, left, y, contentW, { size: 8.5, color: C.muted });
    y += 18;
  };

  const num = (n: number, bold = false): Item => ({ text: String(n), bold });

  const roleColumns = (firstLabel: string, firstWidth: number, roles: string[]): Col[] => {
    const rest = (contentW - firstWidth) / (roles.length + 1);
    return [
      { label: firstLabel, width: firstWidth },
      ...roles.map((r) => ({ label: r, width: rest, align: "right" as Align })),
      { label: "Total", width: rest, align: "right" as Align },
    ];
  };

  const statusColumns = (firstLabel: string): Col[] => [
    { label: firstLabel, width: contentW - 4 * 90 },
    { label: "Approved", width: 90, align: "right" },
    { label: "Pending", width: 90, align: "right" },
    { label: "Rejected", width: 90, align: "right" },
    { label: "Total", width: 90, align: "right" },
  ];

  const statusRows = (counts: Map<string, Record<string, number>>, sortByTotal = true): Row[] => {
    const entries = Array.from(counts.entries()).map(([k, v]) => ({
      k,
      a: v.approved ?? 0,
      p: v.pending ?? 0,
      r: v.rejected ?? 0,
    }));
    if (sortByTotal) entries.sort((x, z) => z.a + z.p + z.r - (x.a + x.p + x.r) || x.k.localeCompare(z.k));
    return entries.map((e) => ({ cells: [e.k, num(e.a), num(e.p), num(e.r), num(e.a + e.p + e.r, true)] }));
  };

  const bump = (map: Map<string, Record<string, number>>, key: string, field: string) => {
    const rec = map.get(key) ?? {};
    rec[field] = (rec[field] ?? 0) + 1;
    map.set(key, rec);
  };

  // ================= numbers used on the cover =================
  const surg = data.surgical;
  const approved = surg.filter((s) => s.status === "approved");
  const countBy = (arr: SurgicalEntry[], st: string) => arr.filter((s) => s.status === st).length;
  const rolesApproved = new Map<string, number>();
  for (const s of approved) rolesApproved.set(s.role, (rolesApproved.get(s.role) ?? 0) + 1);
  const dated = surg.map((s) => s.procDate).filter((d): d is string => !!d).sort();
  const academic = data.academic;
  const clinical = data.clinical;
  const totalPoints = academic ? academic.reduce((a, e) => a + e.points, 0) : 0;

  // ================= cover page =================
  {
    doc.rect(0, 0, W, 92).fill(C.headFill);
    line("Logbook Record", left, 26, contentW / 2, { bold: true, size: 26, color: C.headText });
    line("Complete record of surgical, academic and clinical experience", left, 60, contentW / 2, {
      size: 10,
      color: "#cbd5e1",
    });
    line(opts.institutionName, left + contentW / 2, 30, contentW / 2, { bold: true, size: 11, color: C.headText, align: "right" });
    line(deptName, left + contentW / 2, 47, contentW / 2, { size: 10, color: "#cbd5e1", align: "right" });
    line(`Reference ${opts.documentRef}`, left + contentW / 2, 63, contentW / 2, { size: 8, color: "#cbd5e1", align: "right" });

    y = 116;
    line(candName, left, y, contentW, { bold: true, size: 20, color: C.ink });
    y += 30;

    const idPairs: [string, string][] = [
      ["Registration number", cand.regNum || "-"],
      ["Degree", cand.regDeg ? capitalizeWords(cand.regDeg) : "-"],
      ["Rank", cand.rank ? capitalizeWords(cand.rank) : "-"],
      ["Department", deptName],
      ["Registered on LibelusPro", fmtDate(cand.createdAt)],
      ["Record period", dated.length ? `${fmtDate(dated[0])} to ${fmtDate(dated[dated.length - 1])}` : "-"],
    ];
    const colW = contentW / 3;
    idPairs.forEach(([k, v], i) => {
      const cx = left + (i % 3) * colW;
      const cy = y + Math.floor(i / 3) * 30;
      line(k.toUpperCase(), cx, cy, colW - 12, { size: 6.8, color: C.muted, bold: true });
      line(v, cx, cy + 10, colW - 12, { size: 10, color: C.ink });
    });
    y += 70;

    const tiles = (items: [string, string][]) => {
      const gap = 8;
      const tw = (contentW - gap * (items.length - 1)) / items.length;
      items.forEach(([label, value], i) => {
        const tx = left + i * (tw + gap);
        doc.roundedRect(tx, y, tw, 46, 4).lineWidth(0.6).strokeColor(C.grid).stroke();
        line(value, tx + 10, y + 8, tw - 20, { bold: true, size: 17, color: C.accent });
        line(label, tx + 10, y + 31, tw - 20, { size: 7.2, color: C.muted });
      });
      y += 54;
    };
    line("SURGICAL EXPERIENCE", left, y, contentW, { bold: true, size: 7.5, color: C.muted });
    y += 12;
    tiles([
      ["Surgical entries", String(surg.length)],
      ["Approved", String(approved.length)],
      ["Pending review", String(countBy(surg, "pending"))],
      ["Rejected", String(countBy(surg, "rejected"))],
      ["Hospitals", String(new Set(surg.map((s) => s.hospital)).size)],
      ["Supervisors", String(new Set(surg.map((s) => s.supervisor)).size)],
    ]);
    tiles(REPORT_ROLE_ORDER.map((r) => [`${r} (approved)`, String(rolesApproved.get(r) ?? 0)] as [string, string]));
    if (academic || clinical) {
      line("ACADEMIC AND CLINICAL EXPERIENCE", left, y, contentW, { bold: true, size: 7.5, color: C.muted });
      y += 12;
      const items: [string, string][] = [];
      if (academic) {
        items.push(["Academic points", String(totalPoints)]);
        items.push(["Academic events attended", String(academic.length)]);
        items.push(["Events presented", String(data.presented?.length ?? 0)]);
      }
      if (clinical) {
        items.push(["Clinical entries", String(clinical.length)]);
        items.push(["Clinical approved", String(clinical.filter((c) => c.status === "approved").length)]);
      }
      tiles(items);
    }

    const contentsY = y + 2;
    line("CONTENTS", left, contentsY, contentW / 2, { bold: true, size: 7.5, color: C.muted });
    const howX = left + contentW / 2 + 10;
    line("HOW TO READ THIS RECORD", howX, contentsY, contentW / 2 - 10, { bold: true, size: 7.5, color: C.muted });
    doc.font("Helvetica").fontSize(7.4).fillColor(C.text);
    doc.text(
      "Entries are listed by operation or activity date and grouped by year, with a subtotal under each year. " +
        "Every entry the candidate submitted is included with its review status: approved entries were reviewed " +
        "by the named supervisor, pending entries are awaiting review, and rejected entries were declined by the " +
        "supervisor. Patients appear as initials, age at operation and sex only. Diagnoses carry ICD-11 codes and " +
        "procedures CPT codes; the grey label above a diagnosis is its category. The tinted band inside a case " +
        "frame carries that case's details.",
      howX,
      contentsY + 12,
      { width: contentW / 2 - 10, lineGap: 1.5 }
    );
    (doc as any)._lrContentsY = contentsY + 12;
  }

  // ================= 1. surgical experience =================
  sectionStart(
    "1. Surgical experience",
    `${plural(surg.length, "entry", "entries")}, in order of operation date and grouped by year. All review statuses are shown.`
  );
  const surgCols: Col[] = [
    { label: "#", width: 22, align: "right" },
    { label: "Date", width: 48 },
    { label: "Patient", width: 58 },
    { label: "Diagnosis (ICD-11)", width: 190 },
    { label: "Procedure (CPT)", width: 200 },
    { label: "Role", width: 58 },
    { label: "Supervisor", width: 82 },
    { label: "Hospital", width: 80 },
    { label: "Status", width: 44 },
  ];
  const SURG_BAND_FROM = 3; // the details band spans Diagnosis to Status
  if (surg.length === 0) {
    emptyNote("No surgical entries recorded.");
  } else {
    const byYear = new Map<string, SurgicalEntry[]>();
    for (const s of surg) {
      const k = s.year ? String(s.year) : "Undated";
      byYear.set(k, [...(byYear.get(k) ?? []), s]);
    }
    let n = 0;
    for (const [year, list] of byYear) {
      const rows: Row[] = list.map((s) => {
        n += 1;
        return {
          cells: [
            String(n),
            fmtDate(s.procDate),
            [
              { text: s.patientInitials || "-", bold: true },
              { text: [s.patientAge, s.patientSex].filter(Boolean).join(", ") || "-", color: C.muted },
            ],
            [{ text: s.mainDiag.toUpperCase(), size: SMALL, bold: true, color: C.muted }, ...coded(s.diagnoses)],
            coded(s.procedures),
            s.role,
            s.supervisor,
            s.hospital,
            { text: statusLabel(s.status), bold: true, color: statusColor(s.status) },
          ],
          band: s.details.length ? s.details : undefined,
        };
      });
      const a = countBy(list, "approved");
      const p = countBy(list, "pending");
      const r = countBy(list, "rejected");
      drawGroupBand(surgCols, `${year}   |   ${plural(list.length, "entry", "entries")}`, rows[0], SURG_BAND_FROM);
      drawRows(surgCols, rows, SURG_BAND_FROM);
      drawSubtotal(`${year} subtotal: ${plural(list.length, "entry", "entries")} (approved ${a}, pending ${p}, rejected ${r})`);
    }
  }

  // ================= 2. surgical summary =================
  sectionStart("2. Surgical summary", "Approved entries only, unless the table says otherwise.");
  {
    const roles = [...REPORT_ROLE_ORDER];
    if (approved.some((s) => !REPORT_ROLE_ORDER.includes(s.role))) roles.push("Other");
    const roleOf = (s: SurgicalEntry) => (REPORT_ROLE_ORDER.includes(s.role) ? s.role : "Other");
    const SEP = "\u0001";
    const crossTab = (keyOf: (s: SurgicalEntry) => string[], limit?: number): Row[] => {
      const m = new Map<string, Record<string, number>>();
      for (const s of approved) for (const k of keyOf(s)) bump(m, k, roleOf(s));
      let list = Array.from(m.entries()).map(([k, v]) => ({ k, v, t: Object.values(v).reduce((a, b) => a + b, 0) }));
      list.sort((x, z) => z.t - x.t || x.k.localeCompare(z.k));
      if (limit) list = list.slice(0, limit);
      return list.map((e) => {
        const [code, name] = e.k.includes(SEP) ? e.k.split(SEP) : ["", e.k];
        return {
          cells: [{ code: code || undefined, text: name }, ...roles.map((r) => num(e.v[r] ?? 0)), num(e.t, true)],
        };
      });
    };
    drawTable("Cases by main diagnosis and role", roleColumns("Main diagnosis", 250, roles), crossTab((s) => [s.mainDiag]));
    drawTable(
      "Most frequent procedures by role (top 30)",
      roleColumns("Procedure (CPT)", 300, roles),
      crossTab((s) => s.procedures.filter((p) => p.name !== "-").map((p) => `${p.code}${SEP}${p.name}`), 30),
      "A case with several procedures counts once under each of them."
    );
    const byHospital = new Map<string, Record<string, number>>();
    const bySupervisor = new Map<string, Record<string, number>>();
    const byYearStatus = new Map<string, Record<string, number>>();
    for (const s of surg) {
      bump(byHospital, s.hospital, s.status);
      bump(bySupervisor, s.supervisor, s.status);
      bump(byYearStatus, s.year ? String(s.year) : "Undated", s.status);
    }
    drawTable("Entries by hospital (all statuses)", statusColumns("Hospital"), statusRows(byHospital));
    drawTable("Entries by supervisor (all statuses)", statusColumns("Supervisor"), statusRows(bySupervisor));
    const yearRows = statusRows(new Map(Array.from(byYearStatus.entries()).sort(([x], [z]) => x.localeCompare(z))), false);
    drawTable("Entries by operation year (all statuses)", statusColumns("Year"), yearRows);
  }

  // ================= 3. academic experience =================
  let sectionNo = 3;
  if (academic) {
    sectionStart(
      `${sectionNo}. Academic experience`,
      `${plural(academic.length, "event")} attended, ${plural(totalPoints, "point")}. Grouped by academic year (September to August).`
    );
    sectionNo += 1;
    const acadCols: Col[] = [
      { label: "#", width: 22, align: "right" },
      { label: "Date", width: 52 },
      { label: "Type", width: 62 },
      { label: "Lecture no.", width: 50 },
      { label: "Title", width: 330 },
      { label: "Presenter", width: 140 },
      { label: "Location", width: 70 },
      { label: "Points", width: 32, align: "right" },
      { label: "Flag", width: 24 },
    ];
    if (academic.length === 0) {
      emptyNote("No academic attendance recorded.");
    } else {
      const byAy = new Map<string, AcademicEntry[]>();
      for (const e of academic) byAy.set(e.academicYear, [...(byAy.get(e.academicYear) ?? []), e]);
      let n = 0;
      for (const [ay, list] of byAy) {
        const rows: Row[] = list.map((e) => {
          n += 1;
          return {
            cells: [
              String(n),
              fmtDate(e.date),
              e.type,
              e.lectureNumber ?? "",
              e.title,
              e.presenter,
              e.location,
              { text: String(e.points), color: e.points < 0 ? C.rejected : undefined },
              e.flagged ? { text: "Yes", bold: true, color: C.rejected } : "",
            ],
          };
        });
        const pts = list.reduce((a, e) => a + e.points, 0);
        drawGroupBand(acadCols, `Academic year ${ay}   |   ${plural(list.length, "event")}`, rows[0]);
        drawRows(acadCols, rows);
        drawSubtotal(`${ay} subtotal: ${plural(list.length, "event")}, ${plural(pts, "point")}`);
      }
    }

    const presRows: Row[] = (data.presented ?? []).map((p, i) => ({
      cells: [String(i + 1), fmtDate(p.date), p.type, p.title, p.status, num(p.attendance)],
    }));
    drawTable(
      "Presented by the candidate",
      [
        { label: "#", width: 22, align: "right" },
        { label: "Date", width: 60 },
        { label: "Type", width: 80 },
        { label: "Title", width: 440 },
        { label: "Status", width: 90 },
        { label: "Attendance", width: 90, align: "right" },
      ],
      presRows
    );

    const typeCount = (t: string) => academic.filter((e) => e.type === t).length;
    drawTable(
      "Academic summary",
      [
        { label: "Measure", width: contentW - 120 },
        { label: "Value", width: 120, align: "right" },
      ],
      [
        { cells: ["Total academic points", num(totalPoints, true)] },
        { cells: ["Events attended", num(academic.length)] },
        { cells: ["Lectures", num(typeCount("Lecture"))] },
        { cells: ["Journal clubs", num(typeCount("Journal club"))] },
        { cells: ["Conferences", num(typeCount("Conference"))] },
        { cells: ["Flagged attendance", num(academic.filter((e) => e.flagged).length)] },
        { cells: ["Events presented", num(data.presented?.length ?? 0)] },
      ]
    );

    if (data.topicCoverage && data.topicCoverage.length > 0) {
      drawTable(
        "Curriculum coverage by topic",
        [
          { label: "Topic", width: contentW - 300 },
          { label: "Lectures attended", width: 100, align: "right" },
          { label: "Lectures in curriculum", width: 100, align: "right" },
          { label: "Coverage", width: 100, align: "right" },
        ],
        data.topicCoverage.map((t) => ({
          cells: [
            t.topic,
            num(t.attended),
            num(t.total),
            t.total > 0 ? `${Math.round((t.attended / t.total) * 100)}%` : "-",
          ],
        })),
        "Distinct curriculum lectures of the candidate's department attended at least once. Flagged attendance is not counted."
      );
    }
  }

  // ================= 4. clinical experience =================
  if (clinical) {
    sectionStart(
      `${sectionNo}. Clinical experience`,
      `${plural(clinical.length, "entry", "entries")}, in order of activity date and grouped by year. All review statuses are shown.`
    );
    sectionNo += 1;
    const clinCols: Col[] = [
      { label: "#", width: 22, align: "right" },
      { label: "Date", width: 52 },
      { label: "Activity type", width: 80 },
      { label: "Description", width: 270 },
      { label: "Supervisor", width: 110 },
      { label: "Status", width: 56 },
      { label: "Reviewed on", width: 60 },
      { label: "Supervisor comment", width: 132 },
    ];
    if (clinical.length === 0) {
      emptyNote("No clinical entries recorded.");
    } else {
      const byYear = new Map<string, ClinicalEntry[]>();
      for (const c of clinical) {
        const k = c.year ? String(c.year) : "Undated";
        byYear.set(k, [...(byYear.get(k) ?? []), c]);
      }
      let n = 0;
      for (const [year, list] of byYear) {
        const rows: Row[] = list.map((c) => {
          n += 1;
          return {
            cells: [
              String(n),
              fmtDate(c.date),
              c.type,
              c.description || "-",
              c.supervisor,
              { text: statusLabel(c.status), bold: true, color: statusColor(c.status) },
              fmtDate(c.reviewedOn),
              c.comment || "",
            ],
          };
        });
        const a = list.filter((c) => c.status === "approved").length;
        const p = list.filter((c) => c.status === "pending").length;
        const r = list.filter((c) => c.status === "rejected").length;
        drawGroupBand(clinCols, `${year}   |   ${plural(list.length, "entry", "entries")}`, rows[0]);
        drawRows(clinCols, rows);
        drawSubtotal(`${year} subtotal: ${plural(list.length, "entry", "entries")} (approved ${a}, pending ${p}, rejected ${r})`);
      }
      const byType = new Map<string, Record<string, number>>();
      const bySup = new Map<string, Record<string, number>>();
      for (const c of clinical) {
        bump(byType, c.type, c.status);
        bump(bySup, c.supervisor, c.status);
      }
      drawTable("Clinical entries by activity type", statusColumns("Activity type"), statusRows(byType));
      drawTable("Clinical entries by supervisor", statusColumns("Supervisor"), statusRows(bySup));
    }
  }

  // ================= closing block =================
  ensure(120);
  y += 10;
  doc.moveTo(left, y).lineTo(right, y).lineWidth(0.8).strokeColor(C.accent).stroke();
  y += 12;
  doc.font("Helvetica").fontSize(8).fillColor(C.text);
  doc.text(
    `Generated from LibelusPro records on ${generatedStr}. Approved entries were reviewed by the named supervisor; ` +
      "pending and rejected entries are listed for completeness. This record reflects the data at the time it was generated.",
    left,
    y,
    { width: contentW, lineGap: 1.5 }
  );
  y = doc.y + 34;
  const sigW = (contentW - 40) / 3;
  ["Programme director", "Signature", "Date"].forEach((label, i) => {
    const sx = left + i * (sigW + 20);
    doc.moveTo(sx, y).lineTo(sx + sigW, y).lineWidth(0.6).strokeColor(C.muted).stroke();
    line(label, sx, y + 4, sigW, { size: 7.5, color: C.muted });
  });

  // ================= final pass: running header, footer, contents =================
  const range = doc.bufferedPageRange();
  const total = range.count;
  const footerLine2 = FOOTER_TEXT.replace(/\n/g, "   |   ");
  for (let i = 0; i < total; i++) {
    doc.switchToPage(range.start + i);
    const savedBottom = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;

    if (i > 0) {
      line("Logbook Record", left, M + 2, 140, { bold: true, size: 11.5, color: C.accent });
      line(candName, left + 112, M + 4.5, contentW / 2 - 112, { size: 8.5, color: C.ink });
      line(`${deptName}   |   ${opts.institutionName}`, left + contentW / 2, M + 4.5, contentW / 2, {
        size: 8,
        color: C.muted,
        align: "right",
      });
      doc.moveTo(left, M + 22).lineTo(right, M + 22).lineWidth(1).strokeColor(C.accent).stroke();
    }

    const fy = H - M - FOOTER_H + 10;
    doc.moveTo(left, fy).lineTo(right, fy).lineWidth(0.6).strokeColor(C.grid).stroke();
    line(`Logbook Record ${opts.documentRef}   |   ${candName}   |   Generated ${generatedStr}`, left, fy + 6, contentW - 90, {
      size: 7,
      color: C.muted,
    });
    line(footerLine2, left, fy + 16, contentW - 90, { size: 6.6, color: C.muted });
    line(`Page ${i + 1} of ${total}`, right - 90, fy + 6, 90, { size: 7.5, color: C.ink, bold: true, align: "right" });

    if (i === 0) {
      let cy = (doc as any)._lrContentsY as number;
      for (const s of sectionPages) {
        line(s.title, left, cy, contentW / 2 - 70, { size: 8.5, color: C.ink });
        line(`page ${s.page}`, left + contentW / 2 - 70, cy, 50, { size: 8.5, color: C.muted, align: "right" });
        cy += 13;
      }
    }
    doc.page.margins.bottom = savedBottom;
  }

  if (bandOverflows > 0) {
    console.warn(`[logbook-record] ${bandOverflows} details band(s) ran past their frame for candidate ${cand.id}`);
  }
  doc.end();
  return done;
}
