import { injectable, inject } from "inversify";
import PDFDocument from "pdfkit";
import { ReportsService } from "./reports.service";
import {
  ISupervisorSubmissionStats,
  ICandidateSubmissionStats,
  IHospitalProcedureStats,
  IReportFilters,
  ICanceledEventReportItem,
} from "./reports.interface";
import { ISubDoc } from "../sub/interfaces/sub.interface";
import { ISupervisorDoc } from "../supervisor/supervisor.interface";
import { ICandDoc } from "../cand/cand.interface";
import { ICalSurgDoc } from "../calSurg/calSurg.interface";
import { IHospitalDoc } from "../hospital/hospital.interface";
import * as path from "path";
import * as fs from "fs";

@injectable()
export class ReportsProvider {
  constructor(@inject(ReportsService) private reportsService: ReportsService) {}

  // Color constants
  private readonly MED_COLOR = "#19203f";
  private readonly SCRIBE_COLOR = "#1991c8";
  private readonly APPROVED_COLOR = "hsl(142, 76%, 36%)";
  private readonly PENDING_COLOR = "hsl(45, 93%, 47%)";
  private readonly REJECTED_COLOR = "hsl(0, 84%, 60%)";

  // Helper: Parse HSL string and convert to RGB
  private parseHslToRgb(hslString: string): [number, number, number] {
    // Parse "hsl(142, 76%, 36%)" format
    const match = hslString.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    if (!match) {
      return [0, 0, 0]; // Default to black if parsing fails
    }

    const h = parseInt(match[1]);
    const s = parseInt(match[2]);
    const l = parseInt(match[3]);

    return this.hslToRgb(h, s, l);
  }

  // Helper: Convert HSL to RGB
  private hslToRgb(h: number, s: number, l: number): [number, number, number] {
    s /= 100;
    l /= 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;

    if (0 <= h && h < 60) {
      r = c; g = x; b = 0;
    } else if (60 <= h && h < 120) {
      r = x; g = c; b = 0;
    } else if (120 <= h && h < 180) {
      r = 0; g = c; b = x;
    } else if (180 <= h && h < 240) {
      r = 0; g = x; b = c;
    } else if (240 <= h && h < 300) {
      r = x; g = 0; b = c;
    } else if (300 <= h && h < 360) {
      r = c; g = 0; b = x;
    }
    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);
    return [r, g, b];
  }

  // Helper: Convert RGB to hex color string
  private rgbToHex(r: number, g: number, b: number): string {
    const toHex = (n: number) => {
      const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  // Helper: Get logo paths
  private getLogoPaths(): { medScribe: string | null; neurosurgery: string | null } {
    // Use process.cwd() for runtime path resolution (works in both dev and production)
    const basePath = process.env.LOGO_BASE_PATH || process.cwd();
    const medScribePath = process.env.LOGO_PATH || path.join(basePath, "assets", "logo", "MedScribe_logo.png");
    const neurosurgeryPath = process.env.NEUROSURGERY_LOGO_PATH || path.join(basePath, "assets", "logo", "Neurosurgery_logo.png");
    
    return {
      medScribe: fs.existsSync(medScribePath) ? medScribePath : null,
      neurosurgery: fs.existsSync(neurosurgeryPath) ? neurosurgeryPath : null
    };
  }


  // Helper: Add header with branding
  private addHeader(
    doc: InstanceType<typeof PDFDocument>,
    title: string,
    subtitle: string,
    pageNumber?: number
  ): void {
    const textX = 50;
    const textY = 50;

    // Add title (left-aligned)
    doc.fillColor("#000000")
       .fontSize(16)
       .font("Helvetica-Bold");
    doc.text(title, textX, textY);

    // Add generated date/time (right-aligned)
    const dateTime = new Date().toLocaleString();
    doc.fontSize(10)
       .font("Helvetica")
       .fillColor("#666666");
    const dateTimeWidth = doc.widthOfString(dateTime);
    doc.text(dateTime, doc.page.width - 50 - dateTimeWidth, textY);

    // Add subtitle
    doc.fontSize(12)
       .font("Helvetica")
       .fillColor("#666666")
       .text(subtitle, textX, textY + 20);

    // Add separator line
    doc.moveTo(50, textY + 35)
       .lineTo(doc.page.width - 50, textY + 35)
       .strokeColor("#cccccc")
       .lineWidth(1)
       .stroke();
  }

  // Helper: Add footer with logos
  private addFooter(
    doc: InstanceType<typeof PDFDocument>
  ): void {
    // Ensure we're on a valid page and footer area is within bounds
    const pageHeight = doc.page.height;
    const pageWidth = doc.page.width;
    const footerY = pageHeight - 50;
    
    // Validate footer position is within page bounds
    if (footerY < 0 || footerY > pageHeight) {
      return; // Skip footer if position is invalid
    }
    
    // Save current position to restore later
    const savedX = doc.x;
    const savedY = doc.y;
    
    try {
      const leftMargin = 50;
      const rightMargin = 50;
      
      // Draw horizontal line above footer
      const lineY = footerY - 5; // 5px above footer content
      doc.strokeColor("#CCCCCC") // Light gray color
         .lineWidth(0.5)
         .moveTo(leftMargin, lineY)
         .lineTo(pageWidth - rightMargin, lineY)
         .stroke();
      
      const logos = this.getLogoPaths();
      const logoSize = 30;
      const neurosurgeryLogoSize = 45; // 1.5x bigger than regular logo

      // Calculate the vertical center for all footer elements (based on Neurosurgery logo)
      const footerCenterY = footerY + (neurosurgeryLogoSize / 2);

      // Left side: MedScribe logo + "MedScribe" text
      if (logos.medScribe) {
        try {
          // Center MedScribe logo vertically with Neurosurgery logo
          const logoX = leftMargin;
          const logoY = footerCenterY - (logoSize / 2);
          
          // Add logo
          doc.image(logos.medScribe, logoX, logoY, { 
            width: logoSize, 
            height: logoSize,
            fit: [logoSize, logoSize]
          });
          
          // Add "MedScribe" text beside logo, centered vertically
          const textX = logoX + logoSize + 8;
          const textY = footerCenterY - 6; // Center vertically with logo
          
          doc.fontSize(12)
             .font("Helvetica-Bold");
          
          // Add "Med" text in dark blue
          doc.fillColor(this.MED_COLOR);
          const medWidth = doc.widthOfString("Med");
          doc.text("Med", textX, textY, { lineBreak: false });
          
          // Add "Scribe" text in light blue
          doc.fillColor(this.SCRIBE_COLOR)
             .text("Scribe", textX + medWidth, textY, { lineBreak: false });
        } catch (err) {
          // Logo not found, continue without it
        }
      }

      // Right side: English text + Neurosurgery logo
      if (logos.neurosurgery) {
        try {
          // English text
          const text1 = "Faculty of Medicine Qasr Al Aini - Cairo University";
          const text2 = "Department of Neurosurgery";
          
          // Position Neurosurgery logo on the right edge (using larger size)
          const logoX = pageWidth - rightMargin - neurosurgeryLogoSize;
          const logoY = footerY;
          const logoCenterY = footerCenterY;
          
          // Set font for text measurement
          doc.fontSize(8)
             .font("Helvetica");
          
          // Measure text widths
          const text1Width = doc.widthOfString(text1);
          const text2Width = doc.widthOfString(text2);
          const maxTextWidth = Math.max(text1Width, text2Width);
          
          // Calculate text block height (2 lines with 10px spacing)
          const lineHeight = 10;
          const textBlockHeight = lineHeight * 2; // Two lines
          
          // Position text to the left of logo with 10px gap
          // Center the text block vertically with the logo
          const textX = logoX - maxTextWidth - 10;
          const textY1 = logoCenterY - (textBlockHeight / 2);
          const textY2 = textY1 + lineHeight;
          
          // Ensure text doesn't overlap with left section
          const leftSectionEnd = leftMargin + logoSize + 120;
          if (textX >= leftSectionEnd) {
            // Draw text using absolute positioning
            doc.fillColor("#000000");
            try {
              // First line - absolute position, no line break
              doc.text(text1, textX, textY1, { lineBreak: false });
              
              // Second line - absolute position directly below, no line break
              doc.text(text2, textX, textY2, { lineBreak: false });
            } catch (textErr) {
              console.error("Error rendering footer text:", textErr);
            }
          }
          
          // Draw Neurosurgery logo to the right of text (1.5x bigger)
          doc.image(logos.neurosurgery, logoX, logoY, { 
            width: neurosurgeryLogoSize, 
            height: neurosurgeryLogoSize,
            fit: [neurosurgeryLogoSize, neurosurgeryLogoSize]
          });
        } catch (err) {
          console.error("Error adding footer:", err);
        }
      }
    } finally {
      // Restore document position to prevent affecting document flow
      doc.x = savedX;
      doc.y = savedY;
    }
  }

  // Helper: Add page with footer
  private addPageWithFooter(
    doc: InstanceType<typeof PDFDocument>
  ): void {
    doc.addPage();
    this.addFooter(doc);
  }

  // Generate Supervisors Submission Count Report
  public async generateSupervisorsSubmissionCountReport(
    filters: IReportFilters
  ): Promise<Buffer> | never {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on("data", (chunk) => chunks.push(chunk));


      return new Promise((resolve, reject) => {
        doc.on("end", () => {
          resolve(Buffer.concat(chunks));
        });

        doc.on("error", (err) => {
          reject(new Error(err.message));
        });

        // Add header
        this.addHeader(
          doc,
          "Supervisors Submission Count Analysis",
          "Submission Count Analysis"
        );
        
        // Add footer to first page
        this.addFooter(doc);

        // Fetch data
        this.reportsService
          .getAllSupervisors()
          .then(async (supervisors) => {
            // Filter out Tester_Supervisor (case-insensitive)
            const filteredSupervisors = supervisors.filter(
              (s) =>
                !s.fullName?.toLowerCase().includes("tester_supervisor") &&
                !s.email?.toLowerCase().includes("tester_supervisor")
            );

            if (filteredSupervisors.length === 0) {
              doc.moveDown(2)
                 .fontSize(14)
                 .font("Helvetica")
                 .fillColor("#000000")
                 .text("No data available", { align: "center" });
              doc.end();
              return;
            }

            // Calculate stats for each supervisor
            const stats: ISupervisorSubmissionStats[] = [];
            for (const supervisor of filteredSupervisors) {
              const submissions = await this.reportsService.getSubmissionsBySupervisorId(
                // Use id (UUID) instead of _id (supervisors now use MariaDB)
                (supervisor as any).id || (supervisor as any)._id?.toString() || supervisor.id,
                filters.startDate,
                filters.endDate
              );

              const approved = submissions.filter((s) => s.subStatus === "approved").length;
              const pending = submissions.filter((s) => s.subStatus === "pending").length;
              const rejected = submissions.filter((s) => s.subStatus === "rejected").length;
              const total = submissions.length;

              stats.push({
                supervisor,
                approved,
                pending,
                rejected,
                total,
              });
            }

            // Sort by total (descending)
            stats.sort((a, b) => b.total - a.total);

            // Generate bar chart
            this.addBarChart(doc, stats, "supervisor");

            // Add table on new page
            this.addPageWithFooter(doc);
            this.addHeader(
              doc,
              "Supervisors Submission Count Analysis",
              "Submission Count Analysis"
            );
            this.addSubmissionStatsTable(doc, stats, "supervisor");

            doc.end();
          })
          .catch((err) => {
            console.error("Error generating supervisors report:", err);
            reject(new Error(err?.message || err || "Unknown error occurred"));
          });
      });
    } catch (err: any) {
      console.error("Error in generateSupervisorsSubmissionCountReport:", err);
      throw new Error(err?.message || err || "Unknown error occurred");
    }
  }

  // Generate Candidates Submission Count Report
  public async generateCandidatesSubmissionCountReport(
    filters: IReportFilters
  ): Promise<Buffer> | never {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on("data", (chunk) => chunks.push(chunk));


      return new Promise((resolve, reject) => {
        doc.on("end", () => {
          resolve(Buffer.concat(chunks));
        });

        doc.on("error", (err) => {
          reject(new Error(err.message));
        });

        // Add header
        this.addHeader(
          doc,
          "Candidates Submission Count Analysis",
          "Submission Count Analysis"
        );
        
        // Add footer to first page
        this.addFooter(doc);

        // Fetch data
        this.reportsService
          .getAllCandidates()
          .then(async (candidates) => {
            // Filter out tester accounts (case-insensitive)
            const filteredCandidates = candidates.filter(
              (c) =>
                !c.email?.toLowerCase().includes("tester") &&
                !c.fullName?.toLowerCase().includes("tester")
            );

            if (filteredCandidates.length === 0) {
              doc.moveDown(2)
                 .fontSize(14)
                 .font("Helvetica")
                 .fillColor("#000000")
                 .text("No data available", { align: "center" });
              doc.end();
              return;
            }

            // Calculate stats for each candidate
            const stats: ICandidateSubmissionStats[] = [];
            for (const candidate of filteredCandidates) {
              // Use id (UUID) instead of _id (candidates now use MariaDB)
              const candidateId = (candidate as any).id || (candidate as any)._id?.toString() || candidate.id;
              const submissions = await this.reportsService.getSubmissionsByCandidateId(
                candidateId,
                filters.startDate,
                filters.endDate
              );

              const approved = submissions.filter((s) => s.subStatus === "approved").length;
              const pending = submissions.filter((s) => s.subStatus === "pending").length;
              const rejected = submissions.filter((s) => s.subStatus === "rejected").length;
              const total = submissions.length;

              stats.push({
                candidate,
                approved,
                pending,
                rejected,
                total,
              });
            }

            // Sort by total (descending)
            stats.sort((a, b) => b.total - a.total);

            // Generate bar chart
            this.addBarChart(doc, stats, "candidate");

            // Add table on new page
            this.addPageWithFooter(doc);
            this.addHeader(
              doc,
              "Candidates Submission Count Analysis",
              "Submission Count Analysis"
            );
            this.addSubmissionStatsTable(doc, stats, "candidate");

            doc.end();
          })
          .catch((err) => {
            console.error("Error generating candidates report:", err);
            reject(new Error(err?.message || err || "Unknown error occurred"));
          });
      });
    } catch (err: any) {
      console.error("Error in generateCandidatesSubmissionCountReport:", err);
      throw new Error(err?.message || err || "Unknown error occurred");
    }
  }

  // Generate Hospital Analysis Report
  public async generateHospitalAnalysisReport(
    filters: IReportFilters
  ): Promise<Buffer> | never {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on("data", (chunk) => chunks.push(chunk));


      return new Promise((resolve, reject) => {
        doc.on("end", () => {
          resolve(Buffer.concat(chunks));
        });

        doc.on("error", (err) => {
          reject(new Error(err.message));
        });

        // Add header
        this.addHeader(
          doc,
          "Hospital-Based Procedure Analysis",
          "Calendar Procedures Analysis"
        );
        
        // Add footer to first page
        this.addFooter(doc);

        // Fetch data
        Promise.all([
          this.reportsService.getAllCalendarProcedures({
            hospitalId: filters.hospitalId,
            month: filters.month,
            year: filters.year,
            startDate: filters.startDate,
            endDate: filters.endDate,
          }),
          this.reportsService.getAllHospitals(),
          this.reportsService.getAllSubmissions(),
        ])
          .then(([calSurgs, hospitals, submissions]) => {
            // Summary section
            const totalProcedures = calSurgs.length;
            const totalSubmissions = submissions.length;

            doc.moveDown(1)
               .fontSize(14)
               .font("Helvetica-Bold")
               .fillColor("#000000")
               .text("Summary", 50, doc.y);

            doc.moveDown(0.5)
               .fontSize(12)
               .font("Helvetica")
               .text(`Total Procedures: ${totalProcedures} | Total Submissions: ${totalSubmissions}`, 50, doc.y);

            // Group procedures by hospital
            const hospitalMap = new Map<string, {
              hospital: IHospitalDoc;
              procedures: Map<string, number>;
            }>();

            calSurgs.forEach((calSurg) => {
              const hospital = calSurg.hospital as any;
              const arabProc = calSurg.arabProc as any;

              if (!hospital || !arabProc) return;

              // Handle both id (MariaDB) and _id (MongoDB) formats
              const hospitalId = (hospital as any).id || (hospital as any)._id?.toString() || (hospital as any)._id;
              const key = filters.groupBy === "alphaCode" 
                ? arabProc.alphaCode 
                : arabProc.title;

              if (!hospitalMap.has(hospitalId)) {
                hospitalMap.set(hospitalId, {
                  hospital: hospital,
                  procedures: new Map<string, number>(),
                });
              }

              const entry = hospitalMap.get(hospitalId)!;
              const currentCount = entry.procedures.get(key) || 0;
              entry.procedures.set(key, currentCount + 1);
            });

            // Generate sections for hospitals with procedures
            const hospitalsWithProcedures = Array.from(hospitalMap.values());
            
            if (hospitalsWithProcedures.length > 0) {
              doc.moveDown(1)
                 .fontSize(14)
                 .font("Helvetica-Bold")
                 .text("Hospitals with Procedures", 50, doc.y);

              hospitalsWithProcedures.forEach((entry) => {
                // Check if we need a new page
                if (doc.y > doc.page.height - 200) {
                  this.addPageWithFooter(doc);
                  this.addHeader(doc, "Hospital-Based Procedure Analysis", "Calendar Procedures Analysis");
                }

                const hospitalName = entry.hospital.engName || entry.hospital.arabName || "Unknown Hospital";
                const hospitalStats: IHospitalProcedureStats = {
                  hospital: entry.hospital,
                  procedures: Array.from(entry.procedures.entries())
                    .map(([key, frequency]) => ({
                      [filters.groupBy === "alphaCode" ? "alphaCode" : "title"]: key,
                      frequency,
                    }))
                    .sort((a, b) => b.frequency - a.frequency),
                };

                // Add hospital section
                this.addHospitalSection(doc, hospitalStats, filters.groupBy || "title");
              });
            }

            // List hospitals with no procedures
            const hospitalsWithProceduresIds = new Set(
              hospitalsWithProcedures.map((e) => {
                const hId = (e.hospital as any).id || (e.hospital as any)._id?.toString() || (e.hospital as any)._id;
                return hId ? hId.toString() : '';
              })
            );
            const hospitalsWithNoProcedures = hospitals.filter(
              (h) => {
                const hId = (h as any).id || (h as any)._id?.toString() || (h as any)._id;
                return hId ? !hospitalsWithProceduresIds.has(hId.toString()) : true;
              }
            );

            if (hospitalsWithNoProcedures.length > 0) {
              if (doc.y > doc.page.height - 150) {
                this.addPageWithFooter(doc);
                this.addHeader(doc, "Hospital-Based Procedure Analysis", "Calendar Procedures Analysis");
              }

              doc.moveDown(1)
                 .fontSize(14)
                 .font("Helvetica-Bold")
                 .text("Hospitals with No Procedures", 50, doc.y);

              const hospitalNames = hospitalsWithNoProcedures
                .map((h) => h.engName || h.arabName || "Unknown")
                .join(", ");

              doc.moveDown(0.5)
                 .fontSize(12)
                 .font("Helvetica")
                 .text(
                   `The following hospitals have no procedures uploaded: ${hospitalNames}`,
                   50,
                   doc.y,
                   { width: doc.page.width - 100 }
                 );
            }

            doc.end();
          })
          .catch((err) => {
            console.error("Error generating supervisors report:", err);
            reject(new Error(err?.message || err || "Unknown error occurred"));
          });
      });
    } catch (err: any) {
      console.error("Error in generateHospitalAnalysisReport:", err);
      throw new Error(err?.message || err || "Unknown error occurred");
    }
  }

  public async generateCanceledEventsReport(
    filters: Pick<IReportFilters, "startDate" | "endDate">
  ): Promise<Buffer> | never {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on("data", (chunk) => chunks.push(chunk));

      return new Promise((resolve, reject) => {
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", (err) => reject(new Error(err.message)));

        // Header + footer
        this.addHeader(doc, "Canceled Events Report", "All canceled events and details");
        this.addFooter(doc);

        this.reportsService
          .getCanceledEventsReportData(filters.startDate, filters.endDate)
          .then((items: ICanceledEventReportItem[]) => {
            if (!items.length) {
              doc.moveDown(2)
                .fontSize(14)
                .font("Helvetica")
                .fillColor("#000000")
                .text("No canceled events found for the selected filters.", { align: "center" });
              doc.end();
              return;
            }

            // Detailed-only pages (no summary/table)
            this.reportsService
              .getEventCountsForPeriod(filters.startDate, filters.endDate)
              .then((counts) => {
                doc
                  .moveDown(1)
                  .fontSize(12)
                  .font("Helvetica-Bold")
                  .text(`Canceled events: ${counts.canceled} / Total events: ${counts.total}`);

                doc
                  .moveDown(0.5)
                  .fontSize(10)
                  .font("Helvetica")
                  .fillColor("#000000");

                for (const item of items) {
                  if (doc.y > doc.page.height - 120) {
                    this.addPageWithFooter(doc);
                    this.addHeader(doc, "Canceled Events Report", "Detailed canceled events");
                    doc.moveDown(0.5).fontSize(10).font("Helvetica").fillColor("#000000");
                  }

                  const e: any = item.event;
                  doc
                    .font("Helvetica-Bold")
                    .text(`${new Date(e.dateTime).toLocaleString()} • ${e.type} • ${item.resource?.title || "N/A"}`);
                  doc.font("Helvetica");
                  doc.text(`Status: ${e.status}`);
                  doc.text(`Location: ${e.location}`);
                  doc.text(`Resource UID: ${item.resource?.google_uid || "N/A"}`);
                  doc.text(`Presenter: ${item.presenter?.fullName || "N/A"} (${item.presenter?.email || "N/A"})`);
                  doc.text(`Attendance count: ${Array.isArray(e.attendance) ? e.attendance.length : 0}`);
                  doc.moveDown(0.8);
                }

                doc.end();
              })
              .catch((err) => reject(new Error(err?.message || err || "Unknown error occurred")));
          })
          .catch((err) => reject(new Error(err?.message || err || "Unknown error occurred")));
      });
    } catch (err: any) {
      throw new Error(err?.message || err || "Unknown error occurred");
    }
  }

  // Helper: Add bar chart
  private addBarChart(
    doc: InstanceType<typeof PDFDocument>,
    stats: ISupervisorSubmissionStats[] | ICandidateSubmissionStats[],
    type: "supervisor" | "candidate"
  ): void {
    const chartStartY = doc.y + 20;
    const leftMargin = 50;
    const rightMargin = 50;
    const nameColumnWidth = 180;
    const barStartX = leftMargin + nameColumnWidth + 20;
    const maxBarWidth = doc.page.width - barStartX - rightMargin - 80; // 80 for total label
    const barHeight = 20;
    const maxValue = Math.max(...stats.map((s) => s.total), 1);

    // Chart title
    doc.fontSize(14)
       .font("Helvetica-Bold")
       .text("Submission Count by Status", leftMargin, chartStartY);

    // Legend
    const legendY = chartStartY + 30;
    const legendX = leftMargin;
    const legendItemWidth = 90;

    // Approved (Green) - hsl(142, 76%, 36%)
    const [r1, g1, b1] = this.parseHslToRgb("hsl(142, 76%, 36%)");
    const approvedColor = this.rgbToHex(r1, g1, b1);
    doc.fillColor(approvedColor)
       .rect(legendX, legendY, 15, 15)
       .fill();
    doc.fillColor("#000000")
       .fontSize(10)
       .font("Helvetica")
       .text("Approved", legendX + 20, legendY);

    // Pending (Yellow) - hsl(45, 93%, 47%)
    const [r2, g2, b2] = this.parseHslToRgb("hsl(45, 93%, 47%)");
    const pendingColor = this.rgbToHex(r2, g2, b2);
    doc.fillColor(pendingColor)
       .rect(legendX + legendItemWidth, legendY, 15, 15)
       .fill();
    doc.fillColor("#000000")
       .fontSize(10)
       .font("Helvetica")
       .text("Pending", legendX + legendItemWidth + 20, legendY);

    // Rejected (Red) - hsl(0, 84%, 60%)
    const [r3, g3, b3] = this.parseHslToRgb("hsl(0, 84%, 60%)");
    const rejectedColor = this.rgbToHex(r3, g3, b3);
    doc.fillColor(rejectedColor)
       .rect(legendX + legendItemWidth * 2, legendY, 15, 15)
       .fill();
    doc.fillColor("#000000")
       .fontSize(10)
       .font("Helvetica")
       .text("Rejected", legendX + legendItemWidth * 2 + 20, legendY);

    // Bars
    let currentY = legendY + 40;
    stats.forEach((stat) => {
      if (currentY > doc.page.height - 100) {
        this.addPageWithFooter(doc);
        this.addHeader(doc, type === "supervisor" ? "Supervisors Submission Count Analysis" : "Candidates Submission Count Analysis", "Submission Count Analysis");
        // Redraw legend on new page
        const newLegendY = 150;
        const newLegendX = leftMargin;
        const newLegendItemWidth = 90;
        
        // Approved (Green)
        doc.fillColor(approvedColor)
           .rect(newLegendX, newLegendY, 15, 15)
           .fill();
        doc.fillColor("#000000")
           .fontSize(10)
           .font("Helvetica")
           .text("Approved", newLegendX + 20, newLegendY);
        
        // Pending (Yellow)
        doc.fillColor(pendingColor)
           .rect(newLegendX + newLegendItemWidth, newLegendY, 15, 15)
           .fill();
        doc.fillColor("#000000")
           .fontSize(10)
           .font("Helvetica")
           .text("Pending", newLegendX + newLegendItemWidth + 20, newLegendY);
        
        // Rejected (Red)
        doc.fillColor(rejectedColor)
           .rect(newLegendX + newLegendItemWidth * 2, newLegendY, 15, 15)
           .fill();
        doc.fillColor("#000000")
           .fontSize(10)
           .font("Helvetica")
           .text("Rejected", newLegendX + newLegendItemWidth * 2 + 20, newLegendY);
        
        currentY = newLegendY + 40;
      }

      const name = type === "supervisor"
        ? (stat as ISupervisorSubmissionStats).supervisor.fullName || (stat as ISupervisorSubmissionStats).supervisor.email || "Unknown"
        : (stat as ICandidateSubmissionStats).candidate.fullName || (stat as ICandidateSubmissionStats).candidate.email || "Unknown";

      // Truncate name if too long
      doc.fontSize(10)
         .font("Helvetica");
      const displayName = doc.widthOfString(name) > nameColumnWidth
        ? name.substring(0, 25) + "..."
        : name;

      doc.fillColor("#000000")
         .text(displayName, leftMargin, currentY, { width: nameColumnWidth });

      let barX = barStartX;

      // Approved bar (green)
      if (stat.approved > 0) {
        const approvedWidth = (stat.approved / maxValue) * maxBarWidth;
        doc.fillColor(approvedColor)
           .rect(barX, currentY + 5, approvedWidth, barHeight)
           .fill();
        barX += approvedWidth;
      }

      // Pending bar (yellow)
      if (stat.pending > 0) {
        const pendingWidth = (stat.pending / maxValue) * maxBarWidth;
        doc.fillColor(pendingColor)
           .rect(barX, currentY + 5, pendingWidth, barHeight)
           .fill();
        barX += pendingWidth;
      }

      // Rejected bar (red)
      if (stat.rejected > 0) {
        const rejectedWidth = (stat.rejected / maxValue) * maxBarWidth;
        doc.fillColor(rejectedColor)
           .rect(barX, currentY + 5, rejectedWidth, barHeight)
           .fill();
      }

      // Total label
      doc.fillColor("#000000")
         .fontSize(10)
         .font("Helvetica")
         .text(`Total: ${stat.total}`, barStartX + maxBarWidth + 10, currentY + 8);

      currentY += 30;
    });

    doc.y = currentY;
  }

  // Helper: Add submission stats table
  private addSubmissionStatsTable(
    doc: InstanceType<typeof PDFDocument>,
    stats: ISupervisorSubmissionStats[] | ICandidateSubmissionStats[],
    type: "supervisor" | "candidate"
  ): void {
    const tableStartY = doc.y + 30; // Added top margin
    const colWidths = [200, 80, 80, 80, 80];
    const rowHeight = 25;
    let currentY = tableStartY;

    // Table header
    doc.fontSize(12)
       .font("Helvetica-Bold")
       .fillColor("#000000");

    const headers = type === "supervisor"
      ? ["Supervisor Name", "Approved", "Pending", "Rejected", "Total"]
      : ["Candidate Name", "Approved", "Pending", "Rejected", "Total"];

    let x = 50;
    headers.forEach((header, i) => {
      doc.text(header, x, currentY, { width: colWidths[i] });
      x += colWidths[i];
    });

    // Draw header underline
    doc.moveTo(50, currentY + rowHeight)
       .lineTo(50 + colWidths.reduce((a, b) => a + b, 0), currentY + rowHeight)
       .strokeColor("#000000")
       .lineWidth(1)
       .stroke();

    // Add margin after header line before first data row
    currentY += rowHeight + 10;

    // Table rows
    doc.fontSize(10)
       .font("Helvetica")
       .fillColor("#000000");

    stats.forEach((stat) => {
      if (currentY > doc.page.height - 100) {
        this.addPageWithFooter(doc);
        this.addHeader(doc, type === "supervisor" ? "Supervisors Submission Count Analysis" : "Candidates Submission Count Analysis", "Submission Count Analysis");
        currentY = 150;
        
        // Redraw header
        x = 50;
        doc.fontSize(12)
           .font("Helvetica-Bold");
        headers.forEach((header, i) => {
          doc.text(header, x, currentY, { width: colWidths[i] });
          x += colWidths[i];
        });
        doc.moveTo(50, currentY + rowHeight)
           .lineTo(50 + colWidths.reduce((a, b) => a + b, 0), currentY + rowHeight)
           .strokeColor("#000000")
           .lineWidth(1)
           .stroke();
        // Add margin after header line before first data row
        currentY += rowHeight + 10;
        doc.fontSize(10)
           .font("Helvetica");
      }

      const name = type === "supervisor"
        ? (stat as ISupervisorSubmissionStats).supervisor.fullName || (stat as ISupervisorSubmissionStats).supervisor.email || "Unknown"
        : (stat as ICandidateSubmissionStats).candidate.fullName || (stat as ICandidateSubmissionStats).candidate.email || "Unknown";

      x = 50;
      const values = [name, stat.approved.toString(), stat.pending.toString(), stat.rejected.toString(), stat.total.toString()];
      values.forEach((value, i) => {
        doc.text(value, x, currentY, { width: colWidths[i] });
        x += colWidths[i];
      });

      currentY += rowHeight;
    });

    doc.y = currentY;
  }

  // Helper: Add hospital section
  private addHospitalSection(
    doc: InstanceType<typeof PDFDocument>,
    hospitalStats: IHospitalProcedureStats,
    groupBy: "title" | "alphaCode"
  ): void {
    const hospitalName = hospitalStats.hospital.engName || hospitalStats.hospital.arabName || "Unknown Hospital";
    const arabName = hospitalStats.hospital.arabName;

    // Hospital header
    doc.moveDown(1)
       .fontSize(14)
       .font("Helvetica-Bold")
       .fillColor("#000000")
       .text(hospitalName, 50, doc.y);

    if (arabName && arabName !== hospitalName) {
      doc.fontSize(12)
         .font("Helvetica")
         .fillColor("#666666")
         .text(arabName, 50, doc.y);
    }

    // Bar chart for procedures
    const chartStartY = doc.y + 20;
    const chartWidth = doc.page.width - 100;
    const maxFrequency = Math.max(...hospitalStats.procedures.map((p) => p.frequency), 1);

    // Chart title
    doc.fontSize(12)
       .font("Helvetica-Bold")
       .fillColor("#000000")
       .text("Procedure Frequency", 50, chartStartY);

    // Bars
    let currentY = chartStartY + 30;
    hospitalStats.procedures.slice(0, 10).forEach((proc) => {
      if (currentY > doc.page.height - 100) {
        this.addPageWithFooter(doc);
        this.addHeader(doc, "Hospital-Based Procedure Analysis", "Calendar Procedures Analysis");
        currentY = 150;
      }

      const label = groupBy === "alphaCode" ? proc.alphaCode || "N/A" : proc.title || "N/A";
      doc.fontSize(10);
      const labelWidth = doc.widthOfString(label);
      const truncatedLabel = labelWidth > 200 ? label.substring(0, 30) + "..." : label;

      doc.fontSize(10)
         .font("Helvetica")
         .text(truncatedLabel, 50, currentY, { width: 200 });

      const barWidth = (proc.frequency / maxFrequency) * (chartWidth - 250);
      doc.rect(260, currentY + 5, barWidth, 15)
         .fillColor("#1991c8")
         .fill();

      doc.fillColor("#000000")
         .text(`${proc.frequency}`, 270 + barWidth, currentY + 8);

      currentY += 25;
    });

    doc.y = currentY;

    // Table
    doc.moveDown(1);
    const tableStartY = doc.y;
    const colWidths = [400, 100];
    const rowHeight = 20;
    currentY = tableStartY;

    // Table header
    doc.fontSize(12)
       .font("Helvetica-Bold")
       .fillColor("#000000")
       .text(groupBy === "alphaCode" ? "Alpha Code" : "Procedure Title", 50, currentY, { width: colWidths[0] })
       .text("Count", 450, currentY, { width: colWidths[1] });

    doc.moveTo(50, currentY + rowHeight)
       .lineTo(550, currentY + rowHeight)
       .strokeColor("#000000")
       .lineWidth(1)
       .stroke();

    // Add margin after header line before first data row
    currentY += rowHeight + 10;

    // Table rows
    doc.fontSize(10)
       .font("Helvetica")
       .fillColor("#000000");

    hospitalStats.procedures.forEach((proc) => {
      if (currentY > doc.page.height - 100) {
        this.addPageWithFooter(doc);
        this.addHeader(doc, "Hospital-Based Procedure Analysis", "Calendar Procedures Analysis");
        currentY = 150;
      }

      const label = groupBy === "alphaCode" ? proc.alphaCode || "N/A" : proc.title || "N/A";
      doc.text(label, 50, currentY, { width: colWidths[0] })
         .text(proc.frequency.toString(), 450, currentY, { width: colWidths[1] });

      currentY += rowHeight;
    });

    doc.y = currentY;
  }
}

