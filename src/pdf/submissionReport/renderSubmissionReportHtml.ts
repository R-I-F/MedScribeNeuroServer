/**
 * Renders the submission report as a single HTML page for browser debugging.
 * Same content/structure as the PDF so you can inspect layout with DevTools and tweak CSS.
 * Dev-only; used by scripts/render-submission-report-debug.ts.
 */

import type { SubmissionReportViewModel } from "./submissionReport.types";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function orDash(s: string | null | undefined): string {
  if (s == null || s === "") return "—";
  return String(s).trim();
}

function toTitleCase(s: string | null | undefined): string {
  if (s == null || typeof s !== "string" || !s.trim()) return "—";
  return s
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function displayTitleCase(s: string | null | undefined): string {
  const raw = orDash(s);
  if (raw === "—") return raw;
  return toTitleCase(raw);
}

function sectionRow(label: string, value: string): string {
  return `
    <div class="row">
      <span class="label">${escapeHtml(label)}</span>
      <span class="value">${escapeHtml(value)}</span>
    </div>`;
}

export function renderSubmissionReportHtml(
  data: SubmissionReportViewModel,
  institutionName: string,
  department?: string,
  logoDataUrl?: string
): string {
  const subtitle = department ? `${institutionName} - ${displayTitleCase(department)}` : institutionName;
  const statusClass =
    data.subStatus === "approved"
      ? "status-approved"
      : data.subStatus === "rejected"
        ? "status-rejected"
        : "status-pending";

  const logoImg = logoDataUrl
    ? `<img src="${escapeHtml(logoDataUrl)}" alt="" class="logo" />`
    : "";

  let body = `
  <div class="page">
  <header class="header">
    <div class="header-row">
      <div class="header-center">
        <h1 class="header-title">Surgical Case Report</h1>
        <p class="header-subtitle">${escapeHtml(subtitle)}</p>
      </div>
      <div class="header-right">
        <div class="header-right-col">
          <div class="header-right-row">
            ${logoImg}
            <span class="brand-word">LIBELUS</span><span class="brand-pro">Pro</span>
          </div>
          <p class="brand-tagline">The Inteligent Lofbook for Medical Practice & Training</p>
          <p class="brand-url">www.libeluspro.com</p>
        </div>
      </div>
    </div>
    <div class="header-divider"></div>
  </header>

  <div class="body">
    <div class="row status-row">
      <span class="label">Approval status</span>
      <span class="status-badge ${statusClass}">${escapeHtml(data.subStatus.toUpperCase())}</span>
    </div>

    <section class="section">
      <h2 class="section-title">Candidate</h2>
      ${sectionRow("Full name", displayTitleCase(data.candidate.fullName))}
      ${sectionRow("Rank", displayTitleCase(data.candidate.rank))}
    </section>

    <section class="section">
      <h2 class="section-title">Supervisor</h2>
      ${sectionRow("Full name", displayTitleCase(data.supervisor.fullName))}
      ${sectionRow("Position", displayTitleCase(data.supervisor.position))}
    </section>

    <section class="section">
      <h2 class="section-title">Procedure Details</h2>
      ${sectionRow("Procedure date", orDash(data.calSurg.procDate))}
      ${sectionRow("Hospital", orDash(data.calSurg.hospitalName))}
      ${sectionRow("Procedure", orDash(data.calSurg.arabProcTitle))}
      ${sectionRow("Procedure code", orDash(data.calSurg.arabProcNumCode))}
      ${sectionRow("Patient name", orDash(data.calSurg.patientName))}
      ${sectionRow("Patient DOB", orDash(data.calSurg.patientDob))}
      ${sectionRow(
        "Patient age at procedure",
        (() => {
          const dob = orDash(data.calSurg.patientDob);
          const proc = orDash(data.calSurg.procDate);
          // Simple dd/mm/yyyy parser mirroring PDF helper
          const parse = (s: string): Date | null => {
            if (!/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return null;
            const [dd, mm, yyyy] = s.split("/").map(Number);
            const d = new Date(yyyy, mm - 1, dd);
            return Number.isNaN(d.getTime()) ? null : d;
          };
          const dobDate = parse(dob);
          const procDate = parse(proc);
          if (!dobDate || !procDate) return "—";
          let age = procDate.getFullYear() - dobDate.getFullYear();
          const m = procDate.getMonth() - dobDate.getMonth();
          if (m < 0 || (m === 0 && procDate.getDate() < dobDate.getDate())) age -= 1;
          if (age < 0 || age > 130) return "—";
          return age + " years";
        })()
      )}
      ${sectionRow("Gender", orDash(data.calSurg.gender))}
    </section>

    <section class="section">
      <h2 class="section-title">Main Diagnosis</h2>
      <p class="value-block">${escapeHtml(displayTitleCase(data.mainDiagnosis))}</p>
    </section>`;

  if (data.icds && data.icds.length > 0) {
    body += `
    <section class="section">
      <h2 class="section-title">ICD (Diagnoses)</h2>
      ${data.icds
        .map(
          (icd) =>
            `<div class="list-item"><span class="value">${escapeHtml(orDash(icd.code))} — ${escapeHtml(displayTitleCase(icd.name))}</span></div>`
        )
        .join("")}
    </section>`;
  }

  if (data.cpts && data.cpts.length > 0) {
    body += `
    <section class="section">
      <h2 class="section-title">CPT (Procedures)</h2>
      ${data.cpts
        .map((cpt) => {
          const rawNum = orDash(cpt.numCode);
          const cptCode =
            rawNum === "—"
              ? rawNum
              : rawNum.split("-")[0].trim() || rawNum;
          let item = `<div class="list-item"><span class="value">${escapeHtml(displayTitleCase(cpt.title))} — Alpha code: ${escapeHtml(
            orDash(cpt.alphaCode)
          )}, CPT code: ${escapeHtml(cptCode)}</span>`;
          if (cpt.description && cpt.description !== "—") {
            item += `<span class="value value-indent">${escapeHtml(orDash(cpt.description))}</span>`;
          }
          return item + "</div>";
        })
        .join("")}
    </section>`;
  }

  body += `
    <section class="section">
      <h2 class="section-title">Submission Details</h2>
      ${sectionRow("Timestamp", orDash(data.timeStamp))}
      ${sectionRow("Role in surgery", displayTitleCase(data.roleInSurg))}
      ${data.assRoleDesc ? sectionRow("Assistant role description", displayTitleCase(data.assRoleDesc)) : ""}
      ${sectionRow("Other surgeon rank", displayTitleCase(data.otherSurgRank))}
      ${sectionRow("Other surgeon name", displayTitleCase(data.otherSurgName))}
      ${sectionRow("Revision surgery", data.isItRevSurg ? "Yes" : "No")}
      ${data.preOpClinCond ? sectionRow("Pre-op clinical condition", displayTitleCase(data.preOpClinCond)) : ""}
      ${sectionRow("Instruments used", displayTitleCase(data.insUsed))}
      ${sectionRow("Consumables used", displayTitleCase(data.consUsed))}
      ${data.consDetails ? sectionRow("Consumables details", displayTitleCase(data.consDetails)) : ""}
    </section>`;

  if (data.region || data.approach || data.pos || data.spOrCran) {
    body += `
    <section class="section">
      <h2 class="section-title">Anatomy & Approach</h2>
      ${data.region ? sectionRow("Region", displayTitleCase(data.region)) : ""}
      ${data.approach ? sectionRow("Approach", displayTitleCase(data.approach)) : ""}
      ${data.pos ? sectionRow("Position", displayTitleCase(data.pos)) : ""}
      ${data.spOrCran ? sectionRow("Spinal / Cranial", displayTitleCase(data.spOrCran)) : ""}
    </section>`;
  }

  if (data.surgNotes || data.IntEvents) {
    body += `
    <section class="section">
      <h2 class="section-title">Notes & Events</h2>
      ${data.surgNotes ? `<div class="value-block"><span class="label">Surgical notes</span><span class="value">${escapeHtml(data.surgNotes)}</span></div>` : ""}
      ${data.IntEvents ? `<div class="value-block"><span class="label">Intraoperative events</span><span class="value">${escapeHtml(data.IntEvents)}</span></div>` : ""}
    </section>`;
  }

  if (data.review || data.reviewedAt) {
    body += `
    <section class="section">
      <h2 class="section-title">Review</h2>
      ${data.review ? `<div class="value-block"><span class="label">Review comment</span><span class="value">${escapeHtml(data.review)}</span></div>` : ""}
      ${data.reviewedAt ? sectionRow("Reviewed at", data.reviewedAt) : ""}
    </section>`;
  }

  body += `
  </div>

  <footer class="footer">
    <div class="footer-divider"></div>
    <p class="footer-row">Page 1 of 1</p>
  </footer>
  </div>`;

  /* Professional report styles – match PDF, refined palette and spacing */
  const css = `
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #f1f5f9; }
  .page {
    width: 595pt;
    min-height: 842pt;
    margin: 0 auto;
    background: #ffffff;
    padding: 56pt 48pt 56pt 48pt;
    font-size: 9pt;
    font-family: Helvetica, Arial, sans-serif;
    color: #0f172a;
  }
  .header {
    margin: -56pt -48pt 0 -48pt;
    padding: 24pt 48pt 14pt 48pt;
  }
  .header-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10pt; }
  .header-center { flex: 1; min-width: 0; }
  .header-title { font-size: 18pt; font-weight: bold; margin: 0 0 4pt 0; letter-spacing: 0.3pt; color: #0f172a; }
  .header-subtitle { font-size: 10pt; color: #64748b; margin: 0; letter-spacing: 0.2pt; }
  .header-right { display: flex; align-items: flex-end; }
  .header-right-col { display: flex; flex-direction: column; align-items: flex-start; }
  .header-right-row { display: flex; align-items: flex-end; gap: 4pt; }
  .logo { width: 15pt; height: 15pt; display: block; object-fit: contain; }
  .brand-tagline { font-size: 5pt; color: #94a3b8; margin: 1pt 0 0 0; }
  .brand-url { font-size: 6pt; color: #64748b; margin: 0.5pt 0 0 0; }
  .brand-word {
    font-weight: bold; font-size: 9pt; letter-spacing: 0.5pt;
    background: linear-gradient(90deg, #0d9488 0%, #3b82f6 40%, #1e3a5f 100%);
    -webkit-background-clip: text; background-clip: text; color: transparent;
  }
  .brand-pro {
    font-weight: bold; font-size: 6pt; color: #1e3a5f;
    margin-left: -1pt; display: inline-block; vertical-align: baseline;
  }
  .header-divider { border-bottom: 1pt solid #e2e8f0; margin-top: 6pt; }
  .body { }
  .section { margin-bottom: 14pt; }
  .section-title {
    font-size: 9pt; font-weight: bold; color: #0f172a;
    letter-spacing: 0.8pt; padding-bottom: 4pt;
    border-bottom: 1pt solid #e2e8f0;
    margin: 0 0 6pt 0; line-height: 12pt;
  }
  .row { display: flex; margin-bottom: 4pt; margin-top: 0; align-items: flex-start; }
  .row.status-row { margin-bottom: 12pt; }
  .label {
    width: 140pt; flex-shrink: 0;
    font-weight: bold; color: #64748b; font-size: 9pt;
    line-height: 12pt; margin: 0; padding: 0;
  }
  .value {
    width: 320pt; color: #0f172a; font-size: 9pt;
    line-height: 12pt; margin: 0; padding: 0;
    word-break: break-word;
  }
  .value-block { margin-bottom: 4pt; margin-top: 0; color: #0f172a; font-size: 9pt; line-height: 12pt; }
  .value-block .label { display: block; width: 140pt; margin-bottom: 2pt; }
  .value-block .value { display: block; width: 320pt; }
  .value-indent { padding-left: 12pt; margin-top: 2pt; font-size: 8pt; display: block; line-height: 12pt; }
  .list-item { margin-bottom: 4pt; margin-top: 0; padding-left: 12pt; line-height: 12pt; }
  .status-badge { padding: 3pt 8pt; border-radius: 3pt; font-size: 7pt; font-weight: bold; letter-spacing: 0.5pt; }
  .status-approved { background: #ecfdf5; color: #047857; }
  .status-pending { background: #fffbeb; color: #b45309; }
  .status-rejected { background: #fef2f2; color: #b91c1c; }
  .footer {
    margin: 0 -48pt -56pt -48pt;
    padding: 0 48pt 24pt 48pt;
  }
  .footer-divider { border-top: 1pt solid #e2e8f0; margin-bottom: 10pt; }
  .footer-row { margin: 0; text-align: right; font-size: 7pt; color: #94a3b8; letter-spacing: 0.2pt; }
  `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Submission Report – ${escapeHtml(data.submissionId)}</title>
  <style>${css}</style>
</head>
<body>
${body}
</body>
</html>`;
}
