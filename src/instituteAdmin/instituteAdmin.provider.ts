import { injectable, inject } from "inversify";
import { DataSource, Repository, In } from "typeorm";
import PDFDocument from "pdfkit";
import { IInstituteAdmin, IInstituteAdminDoc } from "./instituteAdmin.interface";
import { InstituteAdminEntity } from "./instituteAdmin.mDbSchema";
import { SupervisorService } from "../supervisor/supervisor.service";
import { CandService } from "../cand/cand.service";
import { SubService } from "../sub/sub.service";
import { CalSurgService } from "../calSurg/calSurg.service";
import { HospitalService } from "../hospital/hospital.service";
import { ArabProcService } from "../arabProc/arabProc.service";
import { ISupervisorDoc } from "../supervisor/supervisor.interface";
import { ICandDoc } from "../cand/cand.interface";
import { ISubDoc } from "../sub/interfaces/sub.interface";
import { ICalSurgDoc } from "../calSurg/calSurg.interface";
import { IHospitalDoc } from "../hospital/hospital.interface";
import { IArabProcDoc } from "../arabProc/arabProc.interface";
import { CandidateEntity } from "../cand/cand.mDbSchema";
import { SubProvider } from "../sub/sub.provider";
import { EventService } from "../event/event.service";
import { EventProvider } from "../event/event.provider";
import { EventEntity } from "../event/event.mDbSchema";
import { EventAttendanceEntity } from "../event/eventAttendance.mDbSchema";
import { ClinicalSubProvider } from "../clinicalSub/clinicalSub.provider";
import { IInstitution } from "../institution/institution.service";
import { AiAgentService } from "../aiAgent/aiAgent.service";
import { drawReportHeader, drawReportFooter } from "../pdf/reportLayout";

/** Role order for report (matches frontend): Operator → Operator (Assisted) → Assistant → Supervising → Observer */
const REPORT_ROLE_ORDER = ["Operator", "Operator (Assisted)", "Assistant", "Supervising", "Observer"];

/** Raw roleInSurg (lowercase) → display label for report */
const REPORT_ROLE_LABELS: Record<string, string> = {
  operator: "Operator",
  "operator with supervisor scrubbed (assisted)": "Operator (Assisted)",
  assistant: "Assistant",
  "supervising, teaching a junior colleague (scrubbed)": "Supervising",
  "observer (scrubbed)": "Observer",
};

function getReportRoleLabel(roleInSurg: string | undefined): string {
  if (!roleInSurg || typeof roleInSurg !== "string") return "Other";
  return REPORT_ROLE_LABELS[roleInSurg.trim().toLowerCase()] ?? roleInSurg.trim();
}

/** Colors for "Procedures Performed" section progress bars (order matches REPORT_ROLE_ORDER) */
const PROCEDURE_ROLE_COLORS = ["#ea580c", "#0d9488", "#2563eb", "#7c3aed", "#ca8a04"] as const; // Operator, Operator (Assisted), Assistant, Supervising, Observer
const PROCEDURE_TRACK_COLOR = "#e5e7eb";

/** Title-case a string (capitalize first letter of each word). */
function toTitleCase(s: string | undefined | null): string {
  if (s == null || typeof s !== "string") return "—";
  return s.trim().replace(/\b\w/g, (c) => c.toUpperCase());
}

/** PascalCase for filename segment: remove invalid chars, capitalize each word, no spaces. */
function toPascalCaseForFilename(s: string | undefined | null): string {
  if (s == null || typeof s !== "string") return "Unknown";
  const cleaned = s.replace(/[/\\:*?"<>|]/g, " ").replace(/\s+/g, " ").trim();
  return cleaned ? cleaned.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join("") : "Unknown";
}

/** Format ISO/date string as dd/mm/yyyy for reports. */
function formatDateForReport(input: string | Date | undefined | null): string {
  if (!input) return "—";
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return "—";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/** Header/footer: content starts below header; footer sits above bottom margin. */
const REPORT_LAYOUT = {
  headerContentStartY: 136,
  footerYFromBottom: 58,
  footerFontSize: 8,
  footerPageNumWidth: 56,
  pageMargin: 35,
  dividerColor: "#6b7280",
  dividerLineWidth: 0.75,
} as const;

const FOOTER_TEXT = "LIBELUSpro - The Inteligent Lofbook for Medical Practice & Training\nwww.libeluspro.com";

/** Report typography and spacing (design system) */
const REPORT_TYPO = {
  brandSize: 20,
  sectionNumSize: 13,
  sectionTitleSize: 12,
  subsectionSize: 10,
  bodySize: 9,
  captionSize: 8,
  labelSize: 9,
  totalHeroSize: 22,
  spaceAfterBrand: 8,
  spaceSectionIntro: 6,
  spaceBlock: 4,
  spaceField: 3,
  spaceSection: 12,
} as const;

/** Chart colors (hex) per BACKEND_CANDIDATE_REPORT_IMPROVEMENTS.md */
const CHART_COLORS = {
  cptStack: ["#3730a3", "#4f46e5", "#6366f1", "#818cf8", "#a5b4fc"] as const, // indigo 800,600,500,400,300
  icdStack: ["#9d174d", "#db2777", "#ec4899", "#f472b6", "#f9a8d4"] as const, // pink 800,600,500,400,300
  cptSingle: "#6366f1",
  icdSingle: "#ec4899",
  genericBar: "#475569",
  genericBarSecondary: "#334155",
  genericStack: ["#475569", "#64748b", "#94a3b8", "#cbd5e1", "#e2e8f0"] as const, // slate 700,600,400,300,200
  summaryBar: "#0d9488", // teal-600 for summary charts (Annual, Consumables, Equipment)
  summaryStack: ["#0f766e", "#0d9488", "#14b8a6", "#2dd4bf", "#5eead4"] as const, // teal 800,600,500,400,300 for Hospital by Role
  chartBg: "#f3f4f6",
  bodyText: "#374151",
  bodyTextDark: "#111827",
  muted: "#6b7280",
  accent: "#2563eb",
};

@injectable()
export class InstituteAdminProvider {
  private readonly uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  constructor(
    @inject(SupervisorService) private supervisorService: SupervisorService,
    @inject(CandService) private candService: CandService,
    @inject(SubService) private subService: SubService,
    @inject(CalSurgService) private calSurgService: CalSurgService,
    @inject(HospitalService) private hospitalService: HospitalService,
    @inject(ArabProcService) private arabProcService: ArabProcService,
    @inject(SubProvider) private subProvider: SubProvider,
    @inject(EventService) private eventService: EventService,
    @inject(EventProvider) private eventProvider: EventProvider,
    @inject(ClinicalSubProvider) private clinicalSubProvider: ClinicalSubProvider,
    @inject(AiAgentService) private aiAgentService: AiAgentService
  ) {}

  public async createInstituteAdmin(validatedReq: Partial<IInstituteAdmin>, dataSource: DataSource): Promise<IInstituteAdminDoc> | never {
    try {
      const instituteAdminRepository = dataSource.getRepository(InstituteAdminEntity);
      const newInstituteAdmin = instituteAdminRepository.create(validatedReq);
      const savedInstituteAdmin = await instituteAdminRepository.save(newInstituteAdmin);
      return savedInstituteAdmin as unknown as IInstituteAdminDoc;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getAllInstituteAdmins(dataSource: DataSource): Promise<IInstituteAdminDoc[]> | never {
    try {
      const instituteAdminRepository = dataSource.getRepository(InstituteAdminEntity);
      const instituteAdmins = await instituteAdminRepository.find({
        order: { createdAt: "DESC" },
      });
      return instituteAdmins as unknown as IInstituteAdminDoc[];
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getInstituteAdminById(id: string, dataSource: DataSource): Promise<IInstituteAdminDoc | null> | never {
    try {
      const instituteAdminRepository = dataSource.getRepository(InstituteAdminEntity);
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!this.uuidRegex.test(id)) {
        throw new Error("Invalid institute admin ID format");
      }
      const instituteAdmin = await instituteAdminRepository.findOne({
        where: { id },
      });
      return instituteAdmin as unknown as IInstituteAdminDoc | null;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  /** Canonical email: lowercase, trim, dots removed from local part (Gmail-style equivalence). */
  private static canonicalEmail(email: string): string {
    const n = (email || "").trim().toLowerCase();
    const at = n.indexOf("@");
    if (at <= 0) return n;
    return n.slice(0, at).replace(/\./g, "") + n.slice(at);
  }

  public async getInstituteAdminByEmail(email: string, dataSource: DataSource): Promise<IInstituteAdminDoc | null> | never {
    try {
      const instituteAdminRepository = dataSource.getRepository(InstituteAdminEntity);
      const normalized = (email || "").trim().toLowerCase();
      if (!normalized) return null;
      const canonical = InstituteAdminProvider.canonicalEmail(email);
      const instituteAdmin = await instituteAdminRepository
        .createQueryBuilder("i")
        .where(
          "LOWER(TRIM(i.email)) = :normalized OR (CONCAT(REPLACE(SUBSTRING_INDEX(LOWER(TRIM(i.email)), '@', 1), '.', ''), '@', SUBSTRING_INDEX(LOWER(TRIM(i.email)), '@', -1)) = :canonical)",
          { normalized, canonical }
        )
        .getOne();
      return instituteAdmin as unknown as IInstituteAdminDoc | null;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async updateInstituteAdmin(validatedReq: Partial<IInstituteAdmin> & { id: string }, dataSource: DataSource): Promise<IInstituteAdminDoc | null> | never {
    try {
      const instituteAdminRepository = dataSource.getRepository(InstituteAdminEntity);
      const { id, ...updateData } = validatedReq;
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!this.uuidRegex.test(id)) {
        throw new Error("Invalid institute admin ID format");
      }
      await instituteAdminRepository.update(id, updateData);
      const updatedInstituteAdmin = await instituteAdminRepository.findOne({
        where: { id },
      });
      return updatedInstituteAdmin as unknown as IInstituteAdminDoc | null;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async deleteInstituteAdmin(id: string, dataSource: DataSource): Promise<boolean> | never {
    try {
      const instituteAdminRepository = dataSource.getRepository(InstituteAdminEntity);
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!this.uuidRegex.test(id)) {
        throw new Error("Invalid institute admin ID format");
      }
      const result = await instituteAdminRepository.delete(id);
      return (result.affected ?? 0) > 0;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  // Dashboard endpoints business logic
  public async getAllSupervisors(dataSource: DataSource): Promise<ISupervisorDoc[]> | never {
    try {
      return await this.supervisorService.getAllSupervisors(dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getSupervisorSubmissions(
    supervisorId: string,
    status: "approved" | "pending" | "rejected" | undefined,
    dataSource: DataSource
  ): Promise<ISubDoc[]> | never {
    try {
      // Validate UUID format (supervisor now uses MariaDB UUID)
      if (!this.uuidRegex.test(supervisorId)) {
        throw new Error("Invalid supervisor ID format");
      }

      // Verify supervisor exists
      const supervisor = await this.supervisorService.getSupervisorById({ id: supervisorId }, dataSource);
      if (!supervisor) {
        throw new Error("Supervisor not found");
      }

      // Get submissions with optional status filter
      if (status) {
        return await this.subService.getSubsBySupervisorIdAndStatus(supervisorId, status, dataSource);
      } else {
        return await this.subService.getSubsBySupervisorId(supervisorId, dataSource);
      }
    } catch (err: any) {
      throw new Error(err);
    }
  }

  /**
   * Generate a PDF report of all supervisors for the current institution.
   * Same layout as candidate report: E-Certificate header, footer, line dividers, typography.
   */
  public async generateSupervisorsReportPdf(
    dataSource: DataSource,
    institution: IInstitution
  ): Promise<{ buffer: Buffer; suggestedFilename: string }> {
    const supervisors = await this.supervisorService.getAllSupervisors(dataSource);
    const buffer = await this.buildSupervisorsReportPdfBuffer(supervisors as any[], institution);
    const suggestedFilename = `Supervisors - Ecertificate - ${toPascalCaseForFilename(institution.name)} - ${toPascalCaseForFilename(institution.department)}.pdf`;
    return { buffer, suggestedFilename };
  }

  public async getAllCandidates(dataSource: DataSource): Promise<ICandDoc[]> | never {
    try {
      return await this.candService.getAllCandidates(dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getCandidateSubmissions(candidateId: string, dataSource: DataSource): Promise<ISubDoc[]> | never {
    try {
      // Validate UUID format (candidate now uses MariaDB UUID)
      if (!this.uuidRegex.test(candidateId)) {
        throw new Error("Invalid candidate ID format");
      }

      // Verify candidate exists
      const candidate = await this.candService.getCandById(candidateId, dataSource);
      if (!candidate) {
        throw new Error("Candidate not found");
      }

      return await this.subService.getSubsByCandidateId(candidateId, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getCandidateSubmissionById(
    candidateId: string,
    submissionId: string,
    dataSource: DataSource
  ): Promise<ISubDoc | null> | never {
    try {
      // Validate UUID formats
      if (!this.uuidRegex.test(submissionId)) {
        throw new Error("Invalid submission ID format");
      }
      if (!this.uuidRegex.test(candidateId)) {
        throw new Error("Invalid candidate ID format");
      }

      // Get populated submission
      const submission = await this.subService.getSubById(submissionId, dataSource);
      if (!submission) {
        return null;
      }

      // Extract candidate ID - handle both populated (object) and unpopulated (ObjectId/UUID) cases
      let submissionCandidateId: string;
      const candidateDoc = submission.candDocId as any;
      if (candidateDoc && typeof candidateDoc === 'object') {
        // Populated document - check for id (MariaDB) or _id (MongoDB)
        if (candidateDoc.id) {
          submissionCandidateId = candidateDoc.id;
        } else if (candidateDoc._id) {
          submissionCandidateId = candidateDoc._id.toString();
        } else {
          throw new Error("Submission not found or does not belong to the specified candidate");
        }
      } else if (candidateDoc) {
        // Unpopulated ObjectId/UUID - convert directly
        submissionCandidateId = candidateDoc.toString();
      } else {
        throw new Error("Submission not found or does not belong to the specified candidate");
      }

      // Convert candidateId to same format for comparison
      if (this.uuidRegex.test(candidateId)) {
        // Candidate ID is UUID (MariaDB format)
        if (!this.uuidRegex.test(submissionCandidateId)) {
          // submissionCandidateId is ObjectId, convert to UUID for comparison
          // We can't reliably convert ObjectId back to UUID, so we compare the UUID substring
          // Convert UUID to ObjectId format and compare
          const uuidHex = candidateId.replace(/-/g, '');
          const mongoObjectId = uuidHex.substring(0, 24);
          if (submissionCandidateId !== mongoObjectId) {
            throw new Error("Submission not found or does not belong to the specified candidate");
          }
        } else {
          // Both are UUIDs, compare directly
          if (submissionCandidateId !== candidateId) {
            throw new Error("Submission not found or does not belong to the specified candidate");
          }
        }
      } else {
        // Candidate ID is ObjectId (MongoDB format) - legacy case
        if (this.uuidRegex.test(submissionCandidateId)) {
          const uuidHex = submissionCandidateId.replace(/-/g, '');
          submissionCandidateId = uuidHex.substring(0, 24);
        }
        if (submissionCandidateId !== candidateId) {
          throw new Error("Submission not found or does not belong to the specified candidate");
        }
      }

      return submission;
    } catch (err: any) {
      throw new Error(err.message || "Failed to get candidate submission");
    }
  }

  public async getCalendarProcedures(filters: {
    hospitalId?: string;
    arabProcTitle?: string;
    arabProcNumCode?: string;
    month?: number;
    year?: number;
    startDate?: Date;
    endDate?: Date;
  }, dataSource: DataSource): Promise<ICalSurgDoc[]> | never {
    try {
      return await this.calSurgService.getCalSurgWithFilters(filters, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getAllHospitals(dataSource: DataSource): Promise<IHospitalDoc[]> | never {
    try {
      return await this.hospitalService.getAllHospitals(dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getArabicProcedures(search: string | undefined, dataSource: DataSource): Promise<IArabProcDoc[]> | never {
    try {
      return await this.arabProcService.getArabProcsWithSearch(search, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getHospitalAnalysis(filters: {
    hospitalId?: string;
    month?: number;
    year?: number;
    startDate?: Date;
    endDate?: Date;
    groupBy?: "title" | "alphaCode";
  }, dataSource: DataSource): Promise<any[]> | never {
    try {
      // Get calendar procedures with filters
      const calSurgs = await this.calSurgService.getCalSurgWithFilters({
        hospitalId: filters.hospitalId,
        month: filters.month,
        year: filters.year,
        startDate: filters.startDate,
        endDate: filters.endDate
      }, dataSource);

      // Group by hospital
      const hospitalMap = new Map<string, {
        hospital: IHospitalDoc;
        procedures: Map<string, number>;
      }>();

      calSurgs.forEach((calSurg) => {
        if (!calSurg.hospital || !calSurg.arabProc) {
          return; // Skip if hospital or arabProc is not populated
        }

        const hospital = calSurg.hospital as any;
        const arabProc = calSurg.arabProc as any;
        // Handle both id (MariaDB) and _id (MongoDB) formats
        const hospitalId = (hospital as any).id || (hospital as any)._id?.toString() || (hospital as any)._id;

        if (!hospitalMap.has(hospitalId)) {
          hospitalMap.set(hospitalId, {
            hospital: hospital,
            procedures: new Map<string, number>()
          });
        }

        const entry = hospitalMap.get(hospitalId)!;
        const key = filters.groupBy === "alphaCode" ? arabProc.alphaCode : arabProc.title;

        if (key) {
          const currentCount = entry.procedures.get(key) || 0;
          entry.procedures.set(key, currentCount + 1);
        }
      });

      // Convert to required format
      const result = Array.from(hospitalMap.values()).map(entry => ({
        hospital: {
          _id: (entry.hospital as any).id || (entry.hospital as any)._id,
          engName: entry.hospital.engName,
          arabName: entry.hospital.arabName
        },
        procedures: Array.from(entry.procedures.entries()).map(([key, frequency]) => {
          if (filters.groupBy === "alphaCode") {
            return { alphaCode: key, frequency };
          } else {
            return { title: key, frequency };
          }
        })
      }));

      return result;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  /**
   * Builds a full dashboard snapshot for one candidate (same shape as one item in getCandidateDashboards).
   */
  private buildDashboardSnapshot(
    cand: any,
    candSubs: ISubDoc[],
    institution: IInstitution,
    academicPoints: Map<string, number> | null,
    clinicalByCandidate: Map<string, unknown[]> | null
  ): any {
    const cid = cand.id;
    const approved = candSubs.filter((s) => s.subStatus === "approved");
    const role = "candidate";
    const { password: _omit, ...candidateSafe } = cand as ICandDoc & { password?: string };
    const stats = this.subProvider.getCandidateSubmissionsStatsFromSubs(candSubs);
    const cptAnalytics = this.subProvider.getCptAnalyticsFromSubs(approved, role);
    const icdAnalytics = this.subProvider.getIcdAnalyticsFromSubs(approved);
    const supervisorAnalytics = this.subProvider.getSupervisorAnalyticsFromSubs(approved);

    const snapshot: any = {
      candidate: candidateSafe,
      stats,
      submissions: candSubs,
      cptAnalytics,
      icdAnalytics,
      supervisorAnalytics,
    };

    if (institution.isAcademic && academicPoints) {
      snapshot.points = { totalPoints: academicPoints.get(cid) ?? 0 };
    }
    if (institution.isClinical && clinicalByCandidate) {
      snapshot.clinicalSubCand = clinicalByCandidate.get(cid) ?? [];
    }
    return snapshot;
  }

  /**
   * Lightweight full list of candidates with summary only (identity + stats + totalPoints + clinicalApprovedCount).
   * Includes both approved and non-approved candidates.
   * Optional server-side search by fullName, regNum, rank, regDeg, email.
   */
  public async getCandidateSummaryList(
    params: { search?: string },
    dataSource: DataSource,
    institution: IInstitution
  ): Promise<{ items: any[] }> {
    try {
      const search = params.search != null ? String(params.search).trim() : "";
      const candRepo = dataSource.getRepository(CandidateEntity);

      let candidates: any[];
      if (search === "") {
        candidates = await candRepo.find({
          order: { createdAt: "DESC" },
        });
      } else {
        const term = `%${search}%`;
        candidates = await candRepo
          .createQueryBuilder("c")
          .where(
            "(c.fullName LIKE :term OR c.regNum LIKE :term OR c.rank LIKE :term OR c.regDeg LIKE :term OR c.email LIKE :term)",
            { term }
          )
          .orderBy("c.createdAt", "DESC")
          .getMany();
      }

      const candidateIds = candidates.map((c: any) => c.id).filter((id: string) => this.uuidRegex.test(id));

      const subsByCandidate = new Map<string, ISubDoc[]>();
      if (candidateIds.length > 0) {
        const allSubsPerCandidate = await Promise.all(
          candidateIds.map((id) => this.subService.getSubsByCandidateId(id, dataSource))
        );
        candidateIds.forEach((id, index) => {
          const list = allSubsPerCandidate[index] || [];
          if (list.length > 0) {
            subsByCandidate.set(id, list);
          }
        });
      }

      let academicPoints: Map<string, number> | null = null;
      if (institution.isAcademic) {
        academicPoints = await this.eventService.getAcademicPointsPerCandidate(dataSource);
      }

      let clinicalApprovedByCandidate: Map<string, number> | null = null;
      if (institution.isClinical) {
        const clinicalList = await this.clinicalSubProvider.getMineOrAll(dataSource, { callerCandidateId: undefined });
        clinicalApprovedByCandidate = new Map<string, number>();
        for (const row of clinicalList) {
          const cand = (row as any).candDocId || (row as any).candidate;
          const cid = (cand && typeof cand === "object" ? cand.id : cand) as string | undefined;
          if (!cid) continue;
          if ((row as any).subStatus === "approved") {
            clinicalApprovedByCandidate.set(cid, (clinicalApprovedByCandidate.get(cid) ?? 0) + 1);
          }
        }
      }

      const items = candidates.map((cand: any) => {
        const cid = cand.id;
        const candSubs = subsByCandidate.get(cid) ?? [];
        const stats = this.subProvider.getCandidateSubmissionsStatsFromSubs(candSubs);
        const summaryItem: any = {
          candidate: {
            id: cand.id,
            fullName: cand.fullName,
            approved: cand.approved,
            ...(cand.regNum != null && { regNum: cand.regNum }),
            ...(cand.rank != null && { rank: cand.rank }),
            ...(cand.regDeg != null && { regDeg: cand.regDeg }),
            ...(cand.email != null && { email: cand.email }),
          },
          stats,
        };
        if (institution.isAcademic && academicPoints) {
          summaryItem.totalPoints = academicPoints.get(cid) ?? 0;
        }
        if (institution.isClinical && clinicalApprovedByCandidate) {
          summaryItem.clinicalApprovedCount = clinicalApprovedByCandidate.get(cid) ?? 0;
        }
        return summaryItem;
      });

      return { items };
    } catch (err: any) {
      throw new Error(err);
    }
  }

  /**
   * Full dashboard snapshot for a single candidate by ID. Candidate must exist in the institution dataSource.
   */
  public async getCandidateDashboardByCandidateId(
    candidateId: string,
    dataSource: DataSource,
    institution: IInstitution
  ): Promise<any> {
    try {
      if (!this.uuidRegex.test(candidateId)) {
        throw new Error("Invalid candidate ID");
      }
      const candRepo = dataSource.getRepository(CandidateEntity);
      const cand = await candRepo.findOne({ where: { id: candidateId } });
      if (!cand) {
        throw new Error("Candidate not found or does not belong to the requested institution");
      }

      const candSubs = await this.subService.getSubsByCandidateId(candidateId, dataSource);

      let academicPoints: Map<string, number> | null = null;
      if (institution.isAcademic) {
        academicPoints = await this.eventService.getAcademicPointsPerCandidate(dataSource);
      }

      let clinicalByCandidate: Map<string, unknown[]> | null = null;
      if (institution.isClinical) {
        const clinicalList = await this.clinicalSubProvider.getMineOrAll(dataSource, { callerCandidateId: undefined });
        clinicalByCandidate = new Map<string, unknown[]>();
        for (const row of clinicalList) {
          const c = (row as any).candDocId || (row as any).candidate;
          const cid = (c && typeof c === "object" ? c.id : c) as string | undefined;
          if (!cid) continue;
          const list = clinicalByCandidate.get(cid);
          if (list) {
            list.push(row);
          } else {
            clinicalByCandidate.set(cid, [row]);
          }
        }
      }

      return this.buildDashboardSnapshot(cand, candSubs, institution, academicPoints, clinicalByCandidate);
    } catch (err: any) {
      throw new Error(err.message || err);
    }
  }

  public async getCandidateDashboards(
    params: { page: number; pageSize: number },
    dataSource: DataSource,
    institution: IInstitution
  ): Promise<{
    items: any[];
    page: number;
    pageSize: number;
    totalItems: number;
  }> {
    try {
      const { page, pageSize } = params;

      const candRepo: Repository<any> = dataSource.getRepository(CandidateEntity);
      const [candidates, totalItems] = await candRepo.findAndCount({
        where: { approved: true },
        order: { createdAt: "DESC" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      });

      const candidateIds = candidates.map((c: any) => c.id).filter((id: string) => this.uuidRegex.test(id));

      const subsByCandidate = new Map<string, ISubDoc[]>();
      if (candidateIds.length > 0) {
        const allSubsPerCandidate = await Promise.all(
          candidateIds.map((id) => this.subService.getSubsByCandidateId(id, dataSource))
        );
        candidateIds.forEach((id, index) => {
          const list = allSubsPerCandidate[index] || [];
          if (list.length > 0) {
            subsByCandidate.set(id, list);
          }
        });
      }

      let academicPoints: Map<string, number> | null = null;
      if (institution.isAcademic) {
        academicPoints = await this.eventService.getAcademicPointsPerCandidate(dataSource);
      }

      let clinicalByCandidate: Map<string, unknown[]> | null = null;
      if (institution.isClinical) {
        const clinicalList = await this.clinicalSubProvider.getMineOrAll(dataSource, { callerCandidateId: undefined });
        clinicalByCandidate = new Map<string, unknown[]>();
        for (const row of clinicalList) {
          const cand = (row as any).candDocId || (row as any).candidate;
          const cid = (cand && typeof cand === "object" ? cand.id : cand) as string | undefined;
          if (!cid) continue;
          const list = clinicalByCandidate.get(cid);
          if (list) {
            list.push(row);
          } else {
            clinicalByCandidate.set(cid, [row]);
          }
        }
      }

      const items = candidates.map((cand: any) => {
        const candSubs = subsByCandidate.get(cand.id) ?? [];
        return this.buildDashboardSnapshot(cand, candSubs, institution, academicPoints, clinicalByCandidate);
      });

      return {
        items,
        page,
        pageSize,
        totalItems,
      };
    } catch (err: any) {
      throw new Error(err);
    }
  }

  /**
   * Generate a PDF report for a specific candidate. Includes candidate info, surgical analytics (ICD, CPT, consumables, equipment, supervisor, main diagnosis, hospital, by year), academic conferences, and clinical activity.
   * Brand: E-Certificate. Uses institution name and department from the provided institution.
   */
  public async generateCandidateReportPdf(
    candidateId: string,
    dataSource: DataSource,
    institution: IInstitution
  ): Promise<{ buffer: Buffer; suggestedFilename: string }> {
    if (!this.uuidRegex.test(candidateId)) {
      throw new Error("Invalid candidate ID");
    }
    const candRepo = dataSource.getRepository(CandidateEntity);
    const cand = await candRepo.findOne({ where: { id: candidateId } });
    if (!cand) {
      throw new Error("Candidate not found or does not belong to the requested institution");
    }

    const approvedSubs = await this.subService.getSubsByCandidateIdAndStatus(
      candidateId,
      "approved",
      dataSource
    );
    const pendingSubs = await this.subService.getSubsByCandidateIdAndStatus(
      candidateId,
      "pending",
      dataSource
    );

    const cptAnalytics = this.subProvider.getCptAnalyticsFromSubs(approvedSubs, "candidate");
    const icdAnalytics = this.subProvider.getIcdAnalyticsFromSubs(approvedSubs);
    const supervisorAnalytics = this.subProvider.getSupervisorAnalyticsFromSubs(approvedSubs);

    const mainDiagMap = new Map<string, number>();
    const mainDiagByRole = new Map<string, Record<string, number>>();
    const hospitalMap = new Map<string, number>();
    const hospitalByRole = new Map<string, Record<string, number>>();
    const supervisorByRole = new Map<string, { name: string; byRole: Record<string, number> }>();
    const yearMap = new Map<number, number>();
    const consumablesMap = new Map<string, number>();
    const equipmentMap = new Map<string, number>();
    const proceduresByRole: Record<string, number> = {};

    for (const sub of approvedSubs) {
      const roleLabel = getReportRoleLabel((sub as any).roleInSurg);
      proceduresByRole[roleLabel] = (proceduresByRole[roleLabel] ?? 0) + 1;

      const mainDiag = (sub as any).mainDiag;
      const mainDiagTitle = mainDiag?.title ?? "—";
      mainDiagMap.set(mainDiagTitle, (mainDiagMap.get(mainDiagTitle) ?? 0) + 1);
      if (!mainDiagByRole.has(mainDiagTitle)) mainDiagByRole.set(mainDiagTitle, {});
      const mdRole = mainDiagByRole.get(mainDiagTitle)!;
      mdRole[roleLabel] = (mdRole[roleLabel] ?? 0) + 1;

      const calSurg = (sub as any).calSurg;
      const hospital = calSurg?.hospital;
      const hospitalName = hospital?.engName ?? hospital?.arabName ?? "—";
      hospitalMap.set(hospitalName, (hospitalMap.get(hospitalName) ?? 0) + 1);
      if (!hospitalByRole.has(hospitalName)) hospitalByRole.set(hospitalName, {});
      const hospRole = hospitalByRole.get(hospitalName)!;
      hospRole[roleLabel] = (hospRole[roleLabel] ?? 0) + 1;

      const sup = (sub as any).supervisor ?? (sub as any).supervisorDocId;
      const supId = sup?.id ?? (typeof sup === "string" ? sup : null);
      const supName = sup?.fullName ?? sup?.email ?? "Unknown";
      if (supId) {
        if (!supervisorByRole.has(supId)) supervisorByRole.set(supId, { name: supName, byRole: {} });
        const sRole = supervisorByRole.get(supId)!.byRole;
        sRole[roleLabel] = (sRole[roleLabel] ?? 0) + 1;
      }

      const ts = sub.timeStamp ?? (sub as any).createdAt;
      const year = ts ? new Date(ts).getFullYear() : new Date().getFullYear();
      yearMap.set(year, (yearMap.get(year) ?? 0) + 1);

      const consUsed = String((sub as any).consUsed ?? "").trim();
      if (consUsed) {
        consUsed.split(",").forEach((s) => {
          const t = s.trim();
          if (t) consumablesMap.set(t, (consumablesMap.get(t) ?? 0) + 1);
        });
      }
      const insUsed = String((sub as any).insUsed ?? "").trim();
      if (insUsed) {
        insUsed.split(",").forEach((s) => {
          const t = s.trim();
          if (t) equipmentMap.set(t, (equipmentMap.get(t) ?? 0) + 1);
        });
      }
    }

    let academicEvents: { topic: string; lecturer: string; points: number; date: string }[] = [];
    let totalAcademicPoints = 0;
    if (institution.isAcademic) {
      const pointsResponse = await this.eventProvider.getCandidateEventPoints(candidateId, dataSource);
      totalAcademicPoints = pointsResponse.totalPoints;
      academicEvents = pointsResponse.events.map((e) => ({
        topic: e.event?.title ?? "—",
        lecturer: e.presenter?.name ?? "—",
        points: e.points,
        date: e.date ?? "—",
      }));
    }

    let clinicalTotal = 0;
    const clinicalByType = new Map<string, number>();
    if (institution.isClinical) {
      const clinicalList = await this.clinicalSubProvider.getMineOrAll(dataSource, {
        callerCandidateId: undefined,
      });
      const forCandidate = clinicalList.filter((row: any) => {
        const c = row.candDocId ?? row.candidate;
        const cid = c && typeof c === "object" ? c.id : c;
        return cid === candidateId && row.subStatus === "approved";
      });
      clinicalTotal = forCandidate.length;
      for (const row of forCandidate) {
        const t = (row as any).typeCA ?? "other";
        clinicalByType.set(t, (clinicalByType.get(t) ?? 0) + 1);
      }
    }

    const supervisorItemsWithByRole = Array.from(supervisorByRole.entries()).map(([supervisorId, v]) => ({
      supervisorId,
      supervisorName: v.name,
      byRole: v.byRole,
      count: Object.values(v.byRole).reduce((a, b) => a + b, 0),
    })).sort((a, b) => b.count - a.count);

    const pendingBySupervisorMap = new Map<string, number>();
    for (const sub of pendingSubs) {
      const sup = (sub as any).supervisor ?? (sub as any).supervisorDocId;
      const supName = sup?.fullName ?? sup?.email ?? "Unknown";
      const name = String(supName || "—").trim();
      pendingBySupervisorMap.set(name, (pendingBySupervisorMap.get(name) ?? 0) + 1);
    }
    const pendingBySupervisor = Array.from(pendingBySupervisorMap.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);

    const data = {
      cptAnalytics,
      icdAnalytics,
      supervisorAnalytics,
      supervisorItemsWithByRole,
      mainDiagMap,
      mainDiagByRole,
      hospitalMap,
      hospitalByRole,
      yearMap,
      consumablesMap,
      equipmentMap,
      pendingBySupervisor,
      academicEvents,
      totalAcademicPoints,
      clinicalTotal,
      clinicalByType,
      proceduresByRole,
    };

    let aiSummary: string | null = null;
    try {
      const snapshot = this.buildReportSnapshotForAi(cand as any, institution, data);
      const prompt = `You are summarizing a candidate's surgical and training activity for the front page of an e-certificate report. Write 2 to 3 short, professional paragraphs that summarize the following data. Be concise and highlight key numbers and scope of practice. Use plain text only; no markdown, no bullet points, no section headers.\n\n${snapshot}`;
      const raw = await this.aiAgentService.generateText(prompt);
      aiSummary = raw?.trim() || null;
    } catch {
      aiSummary = null;
    }

    const buffer = await this.buildCandidateReportPdfBuffer(cand as any, institution, data, aiSummary);
    const suggestedFilename = `${toPascalCaseForFilename(cand.fullName)} - Ecertificate - ${toPascalCaseForFilename(institution.name)} - ${toPascalCaseForFilename(institution.department)}.pdf`;
    return { buffer, suggestedFilename };
  }

  /**
   * Generate a submission-specific case report PDF (institute admin only).
   * Uses SubService.getSubById and React-PDF; does not modify any existing services or endpoints.
   */
  public async generateSubmissionReportPdf(
    submissionId: string,
    dataSource: DataSource,
    institution: IInstitution
  ): Promise<{ buffer: Buffer; suggestedFilename: string }> {
    if (!this.uuidRegex.test(submissionId)) {
      throw new Error("Invalid submission ID");
    }
    const { mapSubmissionToViewModel } = await import("../pdf/submissionReport/mapSubmissionToViewModel");
    const { renderSubmissionReportPdfKit } = await import("../pdf/submissionReport/renderSubmissionReportPdfKit");
    const submission = await this.subService.getSubById(submissionId, dataSource);
    if (!submission) {
      throw new Error("Submission not found");
    }
    const viewModel = mapSubmissionToViewModel(submission);
    const buffer = await renderSubmissionReportPdfKit(viewModel, {
      institutionName: institution.name ?? "Institution",
      department: institution.department ?? undefined,
      isPractical: institution.isPractical ?? false,
    });
    const shortId = submissionId.slice(0, 8);
    const suggestedFilename = `Submission-Report-${shortId}-${toPascalCaseForFilename(institution.name ?? "Report")}.pdf`;
    return { buffer, suggestedFilename };
  }

  /**
   * Generate a PDF report for a specific supervisor. Mirrors the candidate report layout but focuses on
   * supervisor-centric analytics (surgical, clinical, academic).
   */
  public async generateSupervisorReportPdf(
    supervisorId: string,
    dataSource: DataSource,
    institution: IInstitution
  ): Promise<{ buffer: Buffer; suggestedFilename: string }> {
    if (!this.uuidRegex.test(supervisorId)) {
      throw new Error("Invalid supervisor ID");
    }

    const supervisor = await this.supervisorService.getSupervisorById({ id: supervisorId }, dataSource);
    if (!supervisor) {
      throw new Error("Supervisor not found or does not belong to the requested institution");
    }

    // Supervised candidate submissions: candidate-created cases where this supervisor is the approver
    const supervisedApproved = await this.subService.getSubsBySupervisorIdCandidateOnly(
      supervisorId,
      dataSource,
      "approved"
    );
    const supervisedPending = await this.subService.getSubsBySupervisorIdCandidateOnly(
      supervisorId,
      dataSource,
      "pending"
    );
    const supervisedRejected = await this.subService.getSubsBySupervisorIdCandidateOnly(
      supervisorId,
      dataSource,
      "rejected"
    );

    // All submissions where this supervisor is the supervisor (both supervised + own)
    const allSupervisorSubs = await this.subService.getSubsBySupervisorId(supervisorId, dataSource);

    const approvedAll = allSupervisorSubs.filter((s: any) => s.subStatus === "approved");
    const ownApproved = (allSupervisorSubs as any[]).filter(
      (s) => s.subStatus === "approved" && (s as any).submissionType === "supervisor"
    );

    // CPT/ICD source: supervised + own if canValidate, otherwise own only
    const cptIcdSource = (supervisor as any).canValidate ? (approvedAll as any[]) : (ownApproved as any[]);

    const cptAnalytics = this.subProvider.getCptAnalyticsFromSubs(cptIcdSource, "supervisor");
    const icdAnalytics = this.subProvider.getIcdAnalyticsFromSubs(cptIcdSource);
    const hospitalMap = new Map<string, number>();
    const yearMap = new Map<number, number>();
    const proceduresByRole: Record<string, number> = {};

    for (const sub of cptIcdSource as any[]) {
      const roleLabel = getReportRoleLabel(sub.roleInSurg);
      proceduresByRole[roleLabel] = (proceduresByRole[roleLabel] ?? 0) + 1;

      const calSurg = sub.calSurg;
      const hospital = calSurg?.hospital;
      const hospitalName = hospital?.engName ?? hospital?.arabName ?? "—";
      hospitalMap.set(hospitalName, (hospitalMap.get(hospitalName) ?? 0) + 1);

      const ts = sub.timeStamp ?? sub.createdAt;
      const year = ts ? new Date(ts).getFullYear() : new Date().getFullYear();
      yearMap.set(year, (yearMap.get(year) ?? 0) + 1);
    }

    // Candidates supervised by this supervisor (surgical)
    const candidatesById = new Map<string, { fullName: string; regNum?: string; rank?: string; count: number }>();
    for (const sub of allSupervisorSubs as any[]) {
      const cand = sub.candidate ?? sub.candDocId;
      const candId = cand && typeof cand === "object" ? cand.id : cand;
      if (!candId) continue;
      const name = (cand as any)?.fullName ?? "—";
      const regNum = (cand as any)?.regNum;
      const rank = (cand as any)?.rank;
      const existing = candidatesById.get(candId);
      if (existing) {
        existing.count += 1;
      } else {
        candidatesById.set(candId, { fullName: name, regNum, rank, count: 1 });
      }
    }

    // Own logged surgical cases: submissions with this supervisor but no candidate attached
    const ownCasesCount = (allSupervisorSubs as any[]).filter((sub) => !sub.candDocId && !sub.candidate).length;

    // Clinical supervised cases (approved) for this supervisor
    let clinicalSupervisedCount = 0;
    if (institution.isClinical && (supervisor as any).canValClin) {
      const clinicalList = await this.clinicalSubProvider.getAssignedToSupervisorOrAll(dataSource, {
        callerSupervisorId: supervisorId,
      });
      clinicalSupervisedCount = clinicalList.filter((row: any) => row.subStatus === "approved" && row.candDocId).length;
    }

    // Academic participation: events presented by this supervisor (lecture/conf) with attendance counts
    const academicEventsForSupervisor = await this.getSupervisorAcademicEventsWithAttendance(supervisorId, dataSource);

    const data = {
      supervisedApprovedCount: supervisedApproved.length,
      supervisedPendingCount: supervisedPending.length,
      supervisedRejectedCount: supervisedRejected.length,
      cptAnalytics,
      icdAnalytics,
      hospitalMap,
      yearMap,
      proceduresByRole,
      supervisedCandidates: Array.from(candidatesById.values()).sort((a, b) =>
        a.fullName.localeCompare(b.fullName)
      ),
      ownCasesCount,
      clinicalSupervisedCount,
      academicEventsForSupervisor,
    };

    let aiSummary: string | null = null;
    try {
      const snapshot = this.buildSupervisorSnapshotForAi(supervisor as any, institution, data);
      const prompt =
        "You are summarizing a supervisor's activity for the front page of an e-certificate style report. " +
        "All surgical counts in the data refer primarily to trainee submissions that this supervisor supervised and approved; " +
        "they do NOT represent operations personally logged or performed by the supervisor. When you describe surgical activity, " +
        "make it clear that procedures are supervised trainee cases unless explicitly called out as the supervisor's own logged cases. " +
        "Write 2 to 3 short, professional paragraphs that summarize the following data. Be concise and highlight key numbers and scope of supervision and teaching. " +
        "Use plain text only; no markdown, no bullet points, no section headers.\n\n" +
        snapshot;
      const raw = await this.aiAgentService.generateText(prompt);
      aiSummary = raw?.trim() || null;
    } catch {
      aiSummary = null;
    }

    const buffer = await this.buildSupervisorReportPdfBuffer(supervisor as any, institution, data, aiSummary);
    const suggestedFilename = `${toPascalCaseForFilename(
      (supervisor as any).fullName
    )} - SupervisorReport - ${toPascalCaseForFilename(institution.name)} - ${toPascalCaseForFilename(
      institution.department
    )}.pdf`;
    return { buffer, suggestedFilename };
  }

  /** Build a plain-text snapshot of the report data for the AI summary. */
  private buildReportSnapshotForAi(
    cand: any,
    institution: IInstitution,
    data: {
      cptAnalytics: any;
      supervisorItemsWithByRole: { supervisorName: string; byRole: Record<string, number>; count: number }[];
      mainDiagMap: Map<string, number>;
      hospitalMap: Map<string, number>;
      yearMap: Map<number, number>;
      consumablesMap: Map<string, number>;
      equipmentMap: Map<string, number>;
      academicEvents: { topic: string; lecturer: string; points: number }[];
      totalAcademicPoints: number;
      clinicalTotal: number;
      proceduresByRole: Record<string, number>;
    }
  ): string {
    const totalSubs = data.cptAnalytics?.totalApprovedSubmissions ?? 0;
    const roleLines = REPORT_ROLE_ORDER.map((r) => `${r}: ${data.proceduresByRole[r] ?? 0}`).join("; ");
    const topSupervisors = data.supervisorItemsWithByRole.slice(0, 5).map((s) => `${s.supervisorName} (${s.count})`).join(", ");
    const topMainDiag = Array.from(data.mainDiagMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => `${k}: ${v}`).join("; ");
    const topHospitals = Array.from(data.hospitalMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => `${k}: ${v}`).join("; ");
    const years = Array.from(data.yearMap.entries()).sort((a, b) => a[0] - b[0]).map(([y, c]) => `${y}: ${c}`).join("; ");
    const consumables = Array.from(data.consumablesMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => `${k}: ${v}`).join("; ");
    const equipment = Array.from(data.equipmentMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => `${k}: ${v}`).join("; ");
    const academicLine = institution.isAcademic
      ? `Academic: ${data.totalAcademicPoints} points; ${data.academicEvents.length} events (e.g. ${data.academicEvents.slice(0, 2).map((e) => e.topic).join("; ")})`
      : "";
    const clinicalLine = institution.isClinical ? `Clinical accepted submissions: ${data.clinicalTotal}` : "";

    return [
      `Candidate: ${toTitleCase(cand.fullName)}. Institution: ${institution.name}. Department: ${institution.department}.`,
      `Total approved surgical submissions: ${totalSubs}. Procedures by role: ${roleLines}.`,
      `Top supervisors: ${topSupervisors}.`,
      `Main diagnoses: ${topMainDiag}.`,
      `Hospitals: ${topHospitals}.`,
      `Submissions by year: ${years}.`,
      consumables ? `Consumables: ${consumables}.` : "",
      equipment ? `Equipment: ${equipment}.` : "",
      academicLine,
      clinicalLine,
    ].filter(Boolean).join("\n");
  }

  private async buildCandidateReportPdfBuffer(
    cand: any,
    institution: IInstitution,
    data: {
      cptAnalytics: any;
      icdAnalytics: any;
      supervisorAnalytics: any;
      supervisorItemsWithByRole: { supervisorId: string; supervisorName: string; byRole: Record<string, number>; count: number }[];
      mainDiagMap: Map<string, number>;
      mainDiagByRole: Map<string, Record<string, number>>;
      hospitalMap: Map<string, number>;
      hospitalByRole: Map<string, Record<string, number>>;
      yearMap: Map<number, number>;
      consumablesMap: Map<string, number>;
      equipmentMap: Map<string, number>;
      pendingBySupervisor: { label: string; count: number }[];
      academicEvents: { topic: string; lecturer: string; points: number; date: string }[];
      totalAcademicPoints: number;
      clinicalTotal: number;
      clinicalByType: Map<string, number>;
      proceduresByRole: Record<string, number>;
    },
    aiSummary: string | null = null
  ): Promise<Buffer> {
    const doc = new PDFDocument({ margin: REPORT_LAYOUT.pageMargin, size: "A4" });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));

    return new Promise((resolve, reject) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (err: Error) => reject(new Error(err.message)));

      const pageWidth = doc.page.width;
      const left = REPORT_LAYOUT.pageMargin;
      const right = pageWidth - REPORT_LAYOUT.pageMargin;
      const maxBarWidth = right - left - 180;
      const maxBarWidthGeneric = 120;
      const labelWidthGeneric = 280;

      let pageNumber = 1;
      const ensureSpace = (required: number) => {
        if (doc.y + required > doc.page.height - REPORT_LAYOUT.footerYFromBottom - 20) {
          const yBeforeFooter = doc.y;
          drawReportFooter(doc, left, right, pageNumber);
          doc.y = yBeforeFooter;
          doc.addPage({ size: "A4", margin: REPORT_LAYOUT.pageMargin });
          pageNumber += 1;
          drawReportHeader(doc, left, right, institution, { includeReportGenerated: false, candidateName: toTitleCase(cand.fullName) });
        }
      };

      drawReportHeader(doc, left, right, institution, { includeReportGenerated: true, candidateName: toTitleCase(cand.fullName) });

      doc.fontSize(REPORT_TYPO.sectionNumSize).font("Helvetica-Bold").fillColor(CHART_COLORS.bodyTextDark);
      this.drawUnderlinedTitle(doc, left, "1. Candidate Information");
      doc.moveDown(0.45);
      const labelCol = 130;
      const valueStartX = left + labelCol;
      doc.fontSize(REPORT_TYPO.labelSize).font("Helvetica");
      const rows: { label: string; value: string }[] = [
        { label: "Name:", value: toTitleCase(cand.fullName) },
        { label: "Registration Number:", value: cand.regNum ?? "—" },
        { label: "Rank:", value: cand.rank ?? "—" },
        { label: "Degree:", value: cand.regDeg ?? "—" },
      ];
      const rowHeight = 16;
      for (const { label, value } of rows) {
        const rowY = doc.y;
        doc.fillColor(CHART_COLORS.bodyTextDark).font("Helvetica-Bold").text(label, left, rowY, { width: labelCol, lineBreak: false });
        doc.fillColor(CHART_COLORS.bodyText).font("Helvetica").text(value, valueStartX, rowY, { lineBreak: false });
        doc.y = rowY + rowHeight;
      }
      this.drawSectionDivider(doc, left, right);

      if (aiSummary) {
        doc.fontSize(REPORT_TYPO.sectionNumSize).font("Helvetica-Bold").fillColor(CHART_COLORS.bodyTextDark);
        this.drawUnderlinedTitle(doc, left, "Summary");
        doc.moveDown(0.35);
        doc.fontSize(REPORT_TYPO.bodySize).font("Helvetica").fillColor(CHART_COLORS.bodyText);
        doc.text(aiSummary, left, doc.y, { width: right - left, align: "justify" });
        doc.moveDown(0.6);
      }
      this.drawSectionDivider(doc, left, right);

      doc.fontSize(REPORT_TYPO.sectionNumSize).font("Helvetica-Bold").fillColor(CHART_COLORS.bodyTextDark);
      this.drawUnderlinedTitle(doc, left, "2. Approved Surgical Submissions Analytics");
      doc.moveDown(0.5);
      doc.fontSize(REPORT_TYPO.sectionTitleSize).font("Helvetica-Bold").fillColor(CHART_COLORS.bodyTextDark);
      doc.text(`Total approved submissions: ${data.cptAnalytics.totalApprovedSubmissions}`, left, doc.y);
      doc.moveDown(0.5);

      this.drawProceduresPerformedSection(
        doc,
        left,
        right,
        "Procedures Performed",
        data.cptAnalytics.totalApprovedSubmissions,
        data.proceduresByRole,
        ensureSpace
      );
      this.drawSectionDivider(doc, left, right);

      const codeWidth = 58;
      const gapLabelsBar = 26;
      const totalColumnWidth = 32;
      const barWidth = 150;
      const titleWidth = right - left - codeWidth - gapLabelsBar - barWidth - totalColumnWidth;
      const icdItemsSorted = [...data.icdAnalytics.items].sort((a, b) => String(a.icdCode ?? "").localeCompare(String(b.icdCode ?? "")));
      const cptItemsSorted = [...data.cptAnalytics.items].sort((a, b) => String(a.cptCode ?? "").localeCompare(String(b.cptCode ?? "")));
      this.drawStackedBarChartSectionWithCodeTitle(doc, left, right, codeWidth, Math.max(120, titleWidth), gapLabelsBar, barWidth, "CPT Code Distribution by Role", cptItemsSorted, (i) => String(i.cptCode ?? ""), (i) => (i.title ?? "").trim(), REPORT_ROLE_ORDER, CHART_COLORS.cptStack, ensureSpace);
      this.drawSectionDivider(doc, left, right);
      this.drawStackedBarChartSectionWithCodeTitle(doc, left, right, codeWidth, Math.max(120, titleWidth), gapLabelsBar, barWidth, "ICD Code Distribution by Role", icdItemsSorted, (i) => String(i.icdCode ?? ""), (i) => (i.icdName ?? "").trim(), REPORT_ROLE_ORDER, CHART_COLORS.icdStack, ensureSpace);
      this.drawSectionDivider(doc, left, right);
      this.drawStackedBarChartSectionGeneric(doc, left, right, maxBarWidthGeneric, labelWidthGeneric, "Supervisor Distribution by Role", data.supervisorItemsWithByRole, (i) => (i.supervisorName || "").trim(), REPORT_ROLE_ORDER, CHART_COLORS.genericStack, ensureSpace);
      this.drawSectionDivider(doc, left, right);

      const mainDiagItemsWithByRole = Array.from(data.mainDiagMap.entries()).map(([label, count]) => ({
        label: label.trim(),
        count,
        byRole: data.mainDiagByRole.get(label) ?? {},
      })).sort((a, b) => b.count - a.count);
      this.drawStackedBarChartSectionGeneric(doc, left, right, maxBarWidthGeneric, labelWidthGeneric, "Primary Diagnosis Distribution by Role", mainDiagItemsWithByRole, (i) => i.label, REPORT_ROLE_ORDER, CHART_COLORS.genericStack, ensureSpace);
      this.drawSectionDivider(doc, left, right);

      const hospitalItemsWithByRole = Array.from(data.hospitalMap.entries()).map(([label, count]) => ({
        label: label.trim(),
        count,
        byRole: data.hospitalByRole.get(label) ?? {},
      })).sort((a, b) => b.count - a.count);
      this.drawStackedBarChartSectionGeneric(doc, left, right, maxBarWidthGeneric, labelWidthGeneric, "Hospital Distribution by Role", hospitalItemsWithByRole, (i) => i.label, REPORT_ROLE_ORDER, CHART_COLORS.genericStack, ensureSpace);
      this.drawSectionDivider(doc, left, right);

      const yearItems = Array.from(data.yearMap.entries()).map(([year, count]) => ({ label: String(year), count })).sort((a, b) => a.label.localeCompare(b.label));
      this.drawBarChartSection(doc, left, right, maxBarWidthGeneric, "Annual Submission Volume", yearItems, (i) => i.label, (i) => i.count, ensureSpace, CHART_COLORS.summaryBar, { labelWidth: labelWidthGeneric });
      this.drawSectionDivider(doc, left, right);

      const consItems = Array.from(data.consumablesMap.entries()).map(([label, count]) => ({ label: label.trim(), count })).sort((a, b) => b.count - a.count);
      if (consItems.length) this.drawBarChartSection(doc, left, right, maxBarWidthGeneric, "Consumables Summary", consItems, (i) => i.label, (i) => i.count, ensureSpace, CHART_COLORS.summaryBar, { labelWidth: labelWidthGeneric });
      if (consItems.length) this.drawSectionDivider(doc, left, right);

      const equipItems = Array.from(data.equipmentMap.entries()).map(([label, count]) => ({ label: label.trim(), count })).sort((a, b) => b.count - a.count);
      if (equipItems.length) this.drawBarChartSection(doc, left, right, maxBarWidthGeneric, "Equipment Summary", equipItems, (i) => i.label, (i) => i.count, ensureSpace, CHART_COLORS.summaryBar, { labelWidth: labelWidthGeneric });
      if (equipItems.length) this.drawSectionDivider(doc, left, right);
      if (!equipItems.length) this.drawSectionDivider(doc, left, right);

      if (data.pendingBySupervisor.length > 0) {
        this.drawBarChartSection(doc, left, right, maxBarWidthGeneric, "Pending Surgical Submissions by Supervisor", data.pendingBySupervisor, (i) => i.label, (i) => i.count, ensureSpace, CHART_COLORS.summaryBar, { labelWidth: labelWidthGeneric });
      } else {
        ensureSpace(28);
        doc.fontSize(REPORT_TYPO.sectionTitleSize).font("Helvetica-Bold").fillColor(CHART_COLORS.bodyTextDark);
        this.drawUnderlinedTitle(doc, left, "Pending Surgical Submissions by Supervisor");
        doc.moveDown(0.35);
        doc.fontSize(REPORT_TYPO.bodySize).font("Helvetica").fillColor(CHART_COLORS.bodyText);
        doc.text("No pending surgical submissions.", left, doc.y);
        doc.moveDown(0.6);
      }
      this.drawSectionDivider(doc, left, right);

      if (institution.isAcademic) {
        ensureSpace(120);
        doc.fontSize(REPORT_TYPO.sectionNumSize).font("Helvetica-Bold").fillColor(CHART_COLORS.bodyTextDark);
        this.drawUnderlinedTitle(doc, left, "3. Academic Activity");
        doc.moveDown(0.45);
        doc.fontSize(REPORT_TYPO.sectionTitleSize).font("Helvetica-Bold").fillColor(CHART_COLORS.bodyTextDark);
        doc.text(`Total academic points: ${data.totalAcademicPoints}`, left, doc.y);
        doc.moveDown(0.5);
        if (data.academicEvents.length > 0) {
          const tableHeaderY = doc.y;
          const lecturerWidth = 140;
          const dateWidth = 72;
          const topicWidth = right - left - lecturerWidth - dateWidth;
          const lecturerStart = left + topicWidth;
          const dateStart = right - dateWidth;
          const truncateToWidth = (text: string, maxW: number): string => {
            if (!text || doc.widthOfString(text) <= maxW) return text;
            const ellipsis = "…";
            let s = text;
            while (s.length && doc.widthOfString(s + ellipsis) > maxW) s = s.slice(0, -1);
            return s ? s + ellipsis : ellipsis;
          };
          doc.fontSize(REPORT_TYPO.bodySize).font("Helvetica-Bold").fillColor(CHART_COLORS.bodyTextDark);
          doc.text("Topic", left, tableHeaderY);
          doc.text("Lecturer", lecturerStart, tableHeaderY);
          doc.text("Date", dateStart, tableHeaderY);
          doc.moveTo(left, tableHeaderY + 12).lineTo(right, tableHeaderY + 12).strokeColor(REPORT_LAYOUT.dividerColor).lineWidth(REPORT_LAYOUT.dividerLineWidth).stroke();
          doc.y = tableHeaderY + 14;
          doc.moveDown(0.2);
          doc.font("Helvetica").fontSize(REPORT_TYPO.bodySize).fillColor(CHART_COLORS.bodyText);
          for (const row of data.academicEvents) {
            ensureSpace(20);
            doc.font("Helvetica").fontSize(REPORT_TYPO.bodySize).fillColor(CHART_COLORS.bodyText);
            const rowY = doc.y;
            doc.text(truncateToWidth((row.topic || "—").trim(), topicWidth), left, rowY);
            doc.text(truncateToWidth((row.lecturer || "—").trim(), lecturerWidth), lecturerStart, rowY);
            doc.text(truncateToWidth(String(row.date ?? "—"), dateWidth), dateStart, rowY);
            doc.y = rowY + 14;
            doc.moveDown(0.3);
          }
        }
        this.drawSectionDivider(doc, left, right);
      }

      if (institution.isClinical) {
        ensureSpace(80);
        doc.fontSize(REPORT_TYPO.sectionNumSize).font("Helvetica-Bold").fillColor(CHART_COLORS.bodyTextDark);
        this.drawUnderlinedTitle(doc, left, institution.isAcademic ? "4. Clinical Activity" : "3. Clinical Activity");
        doc.moveDown(0.45);
        doc.fontSize(REPORT_TYPO.sectionTitleSize).font("Helvetica-Bold").fillColor(CHART_COLORS.bodyTextDark);
        doc.text(`Total accepted clinical submissions: ${data.clinicalTotal}`, left, doc.y);
        doc.moveDown(0.5);
        const typeItems = Array.from(data.clinicalByType.entries()).map(([label, count]) => ({ label, count }));
        if (typeItems.length) this.drawBarChartSection(doc, left, right, maxBarWidthGeneric, "Clinical Activity by Type", typeItems, (i) => i.label, (i) => i.count, ensureSpace, CHART_COLORS.genericStack[0], { labelWidth: labelWidthGeneric, legendLabel: "Count" });
        this.drawSectionDivider(doc, left, right);
      }

      drawReportFooter(doc, left, right, pageNumber);
      doc.end();
    });
  }

  /** Build PDF buffer for supervisors list report (same header/footer/dividers/typography as candidate report). */
  private async buildSupervisorsReportPdfBuffer(
    supervisors: any[],
    institution: IInstitution
  ): Promise<Buffer> {
    const doc = new PDFDocument({ margin: REPORT_LAYOUT.pageMargin, size: "A4" });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));

    // Sort: canValidate (surgical validators) first, then the rest
    const sortedSupervisors = [...supervisors].sort((a, b) =>
      (a.canValidate ? 0 : 1) - (b.canValidate ? 0 : 1)
    );

    return new Promise((resolve, reject) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (err: Error) => reject(new Error(err.message)));

      const pageWidth = doc.page.width;
      const left = REPORT_LAYOUT.pageMargin;
      const right = pageWidth - REPORT_LAYOUT.pageMargin;

      let pageNumber = 1;
      const ensureSpace = (required: number) => {
        if (doc.y + required > doc.page.height - REPORT_LAYOUT.footerYFromBottom - 20) {
          const yBeforeFooter = doc.y;
          drawReportFooter(doc, left, right, pageNumber);
          doc.y = yBeforeFooter;
          doc.addPage({ size: "A4", margin: REPORT_LAYOUT.pageMargin });
          pageNumber += 1;
          drawReportHeader(doc, left, right, institution, { includeReportGenerated: false, reportTitle: "Supervisors Summary" });
        }
      };

      drawReportHeader(doc, left, right, institution, { includeReportGenerated: true, reportTitle: "Supervisors Summary" });

      doc.fontSize(REPORT_TYPO.bodySize).font("Helvetica").fillColor(CHART_COLORS.bodyText);
      doc.text(`Total supervisors: ${sortedSupervisors.length}`, left, doc.y);
      doc.moveDown(0.6);
      this.drawSectionDivider(doc, left, right);

      const colNo = 22;
      const colName = 120;
      const colEmail = 140;
      const colPosition = 72;
      const colCanVal = 42;
      const colCanValClin = 42;
      const colApproved = 42;
      const tableHeaderY = doc.y;
      doc.fontSize(REPORT_TYPO.bodySize).font("Helvetica-Bold").fillColor(CHART_COLORS.bodyTextDark);
      doc.text("#", left, tableHeaderY);
      doc.text("Full Name", left + colNo, tableHeaderY);
      doc.text("Email", left + colNo + colName, tableHeaderY);
      doc.text("Position", left + colNo + colName + colEmail, tableHeaderY);
      doc.text("Surg.", left + colNo + colName + colEmail + colPosition, tableHeaderY);
      doc.text("Clin.", left + colNo + colName + colEmail + colPosition + colCanVal, tableHeaderY);
      doc.text("Approved", left + colNo + colName + colEmail + colPosition + colCanVal + colCanValClin, tableHeaderY);
      doc.moveTo(left, tableHeaderY + 12).lineTo(right, tableHeaderY + 12).strokeColor(REPORT_LAYOUT.dividerColor).lineWidth(REPORT_LAYOUT.dividerLineWidth).stroke();
      doc.y = tableHeaderY + 14;
      doc.moveDown(0.2);

      const truncate = (text: string | undefined | null, maxWidth: number): string => {
        const s = (text ?? "—").trim();
        if (!s) return "—";
        if (doc.widthOfString(s) <= maxWidth) return s;
        let t = s;
        while (t.length && doc.widthOfString(t + "…") > maxWidth) t = t.slice(0, -1);
        return t ? t + "…" : "…";
      };

      doc.font("Helvetica").fontSize(REPORT_TYPO.bodySize).fillColor(CHART_COLORS.bodyText);
      sortedSupervisors.forEach((s, index) => {
        ensureSpace(18);
        // Reset font/size/color after possible page break (header leaves Bold/smaller font)
        doc.font("Helvetica").fontSize(REPORT_TYPO.bodySize).fillColor(CHART_COLORS.bodyText);
        const rowY = doc.y;
        doc.text(String(index + 1), left, rowY);
        doc.text(truncate(s.fullName, colName - 4), left + colNo, rowY);
        doc.text(truncate(s.email, colEmail - 4), left + colNo + colName, rowY);
        doc.text(truncate(s.position, colPosition - 4), left + colNo + colName + colEmail, rowY);
        doc.text(s.canValidate === true ? "Yes" : "No", left + colNo + colName + colEmail + colPosition, rowY);
        doc.text(s.canValClin === true ? "Yes" : "No", left + colNo + colName + colEmail + colPosition + colCanVal, rowY);
        doc.text(s.approved === true ? "Yes" : "No", left + colNo + colName + colEmail + colPosition + colCanVal + colCanValClin, rowY);
        doc.y = rowY + 14;
        doc.moveDown(0.2);
      });

      this.drawSectionDivider(doc, left, right);
      drawReportFooter(doc, left, right, pageNumber);
      doc.end();
    });
  }

  /** Build a plain-text snapshot of supervisor activity for the AI summary. */
  private buildSupervisorSnapshotForAi(
    supervisor: any,
    institution: IInstitution,
    data: {
      supervisedApprovedCount: number;
      supervisedPendingCount: number;
      supervisedRejectedCount: number;
      cptAnalytics: any;
      icdAnalytics: any;
      hospitalMap: Map<string, number>;
      yearMap: Map<number, number>;
      proceduresByRole: Record<string, number>;
      supervisedCandidates: { fullName: string; regNum?: string; rank?: string; count: number }[];
      ownCasesCount: number;
      clinicalSupervisedCount: number;
      academicEventsForSupervisor: { title: string; type: string; date: string; attendanceCount: number }[];
    }
  ): string {
    const totalApproved = data.supervisedApprovedCount;
    const statusLine = `Supervised trainee surgical submissions (candidate-created cases) – approved: ${data.supervisedApprovedCount}, pending: ${data.supervisedPendingCount}, rejected: ${data.supervisedRejectedCount}.`;
    const roleLines = REPORT_ROLE_ORDER.map((r) => `${r}: ${data.proceduresByRole[r] ?? 0}`).join("; ");
    const hospitals = Array.from(data.hospitalMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([k, v]) => `${k}: ${v}`)
      .join("; ");
    const years = Array.from(data.yearMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([y, c]) => `${y}: ${c}`)
      .join("; ");
    const candidateLine = data.supervisedCandidates.length
      ? `Supervised candidates: ${data.supervisedCandidates.length} (e.g. ${data.supervisedCandidates
          .slice(0, 3)
          .map((c) => c.fullName)
          .join("; ")}).`
      : "Supervised candidates: none recorded.";
    const academicLine = data.academicEventsForSupervisor.length
      ? `Academic events presented: ${data.academicEventsForSupervisor.length} (e.g. ${data.academicEventsForSupervisor
          .slice(0, 2)
          .map((e) => e.title)
          .join("; ")}).`
      : "Academic events presented: none recorded.";
    const clinicalLine =
      data.clinicalSupervisedCount > 0
        ? `Clinical supervised cases: ${data.clinicalSupervisedCount}.`
        : "Clinical supervised cases: none recorded.";

    return [
      `Supervisor: ${toTitleCase(supervisor.fullName)}. Institution: ${institution.name}. Department: ${institution.department}.`,
      `Total approved supervised trainee surgical submissions: ${totalApproved}. Procedures by role (across supervised and own cases): ${roleLines}.`,
      statusLine,
      `Hospitals: ${hospitals || "—"}.`,
      `Submissions by year: ${years || "—"}.`,
      `Own logged surgical cases: ${data.ownCasesCount}.`,
      candidateLine,
      academicLine,
      clinicalLine,
    ]
      .filter(Boolean)
      .join("\n");
  }

  private async buildSupervisorReportPdfBuffer(
    supervisor: any,
    institution: IInstitution,
    data: {
      supervisedApprovedCount: number;
      supervisedPendingCount: number;
      supervisedRejectedCount: number;
      cptAnalytics: any;
      icdAnalytics: any;
      hospitalMap: Map<string, number>;
      yearMap: Map<number, number>;
      proceduresByRole: Record<string, number>;
      supervisedCandidates: { fullName: string; regNum?: string; rank?: string; count: number }[];
      ownCasesCount: number;
      clinicalSupervisedCount: number;
      academicEventsForSupervisor: { title: string; type: string; date: string; attendanceCount: number }[];
    },
    aiSummary: string | null
  ): Promise<Buffer> {
    const doc = new PDFDocument({ margin: REPORT_LAYOUT.pageMargin, size: "A4" });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));

    return new Promise((resolve, reject) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (err: Error) => reject(new Error(err.message)));

      const pageWidth = doc.page.width;
      const left = REPORT_LAYOUT.pageMargin;
      const right = pageWidth - REPORT_LAYOUT.pageMargin;

      let pageNumber = 1;
      const ensureSpace = (required: number) => {
        if (doc.y + required > doc.page.height - REPORT_LAYOUT.footerYFromBottom - 20) {
          const yBeforeFooter = doc.y;
          drawReportFooter(doc, left, right, pageNumber);
          doc.y = yBeforeFooter;
          doc.addPage({ size: "A4", margin: REPORT_LAYOUT.pageMargin });
          pageNumber += 1;
          drawReportHeader(doc, left, right, institution, { includeReportGenerated: false, candidateName: toTitleCase(supervisor.fullName), reportTitle: "Supervisor Report" });
        }
      };

      drawReportHeader(doc, left, right, institution, {
        includeReportGenerated: true,
        candidateName: toTitleCase(supervisor.fullName),
        reportTitle: "Supervisor Report",
      });

      // Extra gap below header divider to avoid overlap with first section title
      doc.moveDown(1.5);

      // 1. Supervisor information
      doc.fontSize(REPORT_TYPO.sectionNumSize).font("Helvetica-Bold").fillColor(CHART_COLORS.bodyTextDark);
      this.drawUnderlinedTitle(doc, left, "1. Supervisor Information");
      doc.moveDown(0.45);
      const labelCol = 170;
      const valueStartX = left + labelCol;
      doc.fontSize(REPORT_TYPO.labelSize).font("Helvetica");
      const rows: { label: string; value: string }[] = [
        { label: "Name:", value: toTitleCase(supervisor.fullName) },
        { label: "Email:", value: supervisor.email ?? "—" },
        { label: "Position:", value: supervisor.position ?? "—" },
        { label: "Surgical validator:", value: supervisor.canValidate ? "Yes" : "No" },
        { label: "Clinical validator:", value: supervisor.canValClin ? "Yes" : "No" },
        {
          label: "Own logged surgical cases:",
          value: String(data.ownCasesCount),
        },
        {
          label: "Supervised surgical submissions (approved/pending/rejected):",
          value: `${data.supervisedApprovedCount}/${data.supervisedPendingCount}/${data.supervisedRejectedCount}`,
        },
      ];
      const rowHeight = 16;
      for (const { label, value } of rows) {
        ensureSpace(rowHeight + 4);
        const rowY = doc.y;
        doc
          .fillColor(CHART_COLORS.bodyTextDark)
          .font("Helvetica-Bold")
          .text(label, left, rowY, { width: labelCol, lineBreak: false });
        if (label === "Supervised surgical submissions (approved/pending/rejected):") {
          // Distinct styling for approved / pending / rejected counts
          const approved = data.supervisedApprovedCount;
          const pending = data.supervisedPendingCount;
          const rejected = data.supervisedRejectedCount;
          let x = valueStartX;
          doc.fontSize(REPORT_TYPO.labelSize);
          // Approved (bold, default color)
          doc.font("Helvetica-Bold").fillColor(CHART_COLORS.bodyTextDark);
          doc.text(String(approved), x, rowY, { lineBreak: false, continued: true });
          // Spacer + slash
          doc.font("Helvetica").fillColor(CHART_COLORS.bodyText).text(" / ", { continued: true });
          // Pending (amber)
          doc.fillColor("#ca8a04").text(String(pending), { continued: true });
          // Spacer + slash
          doc.fillColor(CHART_COLORS.bodyText).text(" / ", { continued: true });
          // Rejected (red)
          doc.fillColor("#b91c1c").text(String(rejected), { continued: false });
          // Reset font/color
          doc.font("Helvetica").fillColor(CHART_COLORS.bodyText);
        } else {
          doc
            .fillColor(CHART_COLORS.bodyText)
            .font("Helvetica")
            .text(value, valueStartX, rowY, { lineBreak: false });
        }
        doc.y = rowY + rowHeight;
      }
      this.drawSectionDivider(doc, left, right);

      // AI summary
      if (aiSummary) {
        ensureSpace(120);
        doc.fontSize(REPORT_TYPO.sectionNumSize).font("Helvetica-Bold").fillColor(CHART_COLORS.bodyTextDark);
        this.drawUnderlinedTitle(doc, left, "Summary");
        doc.moveDown(0.35);
        doc.fontSize(REPORT_TYPO.bodySize).font("Helvetica").fillColor(CHART_COLORS.bodyText);
        doc.text(aiSummary, left, doc.y, { width: right - left, align: "justify" });
        doc.moveDown(0.6);
        this.drawSectionDivider(doc, left, right);
      }

      // 2. Surgical supervision analytics
      if (supervisor.canValidate) {
        ensureSpace(120);
        doc.fontSize(REPORT_TYPO.sectionNumSize).font("Helvetica-Bold").fillColor(CHART_COLORS.bodyTextDark);
        this.drawUnderlinedTitle(doc, left, "2. Surgical Supervision Analytics");
        doc.moveDown(0.45);
        doc.fontSize(REPORT_TYPO.bodySize).font("Helvetica").fillColor(CHART_COLORS.bodyText);
        doc.text(
          `Total approved supervised submissions: ${data.supervisedApprovedCount}.`,
          left,
          doc.y
        );
        doc.moveDown(0.3);
        doc.text(
          `Total approved submissions involving this supervisor (supervised + own): ${data.cptAnalytics.totalApprovedSubmissions}.`,
          left,
          doc.y
        );
        doc.moveDown(0.6);

        // Procedures supervised and performed chart (approved all)
        this.drawProceduresPerformedSection(
          doc,
          left,
          right,
          "Procedures Supervised and Performed",
          data.cptAnalytics.totalApprovedSubmissions,
          data.proceduresByRole,
          ensureSpace
        );
        this.drawSectionDivider(doc, left, right);

        // CPT / ICD analytics (same charts as candidate, using supervised + own or own-only source)
        const codeWidth = 58;
        const gapLabelsBar = 26;
        const totalColumnWidth = 32;
        const barWidth = 150;
        const titleWidth = right - left - codeWidth - gapLabelsBar - barWidth - totalColumnWidth;
        const cptItemsSorted = [...data.cptAnalytics.items].sort((a, b) =>
          String(a.cptCode ?? "").localeCompare(String(b.cptCode ?? ""))
        );
        const icdItemsSorted = [...data.icdAnalytics.items].sort((a, b) =>
          String(a.icdCode ?? "").localeCompare(String(b.icdCode ?? ""))
        );
        this.drawStackedBarChartSectionWithCodeTitle(
          doc,
          left,
          right,
          codeWidth,
          Math.max(120, titleWidth),
          gapLabelsBar,
          barWidth,
          "CPT Code Distribution by Role",
          cptItemsSorted,
          (i) => String(i.cptCode ?? ""),
          (i) => (i.title ?? "").trim(),
          REPORT_ROLE_ORDER,
          CHART_COLORS.cptStack,
          ensureSpace
        );
        this.drawSectionDivider(doc, left, right);
        this.drawStackedBarChartSectionWithCodeTitle(
          doc,
          left,
          right,
          codeWidth,
          Math.max(120, titleWidth),
          gapLabelsBar,
          barWidth,
          "ICD Code Distribution by Role",
          icdItemsSorted,
          (i) => String(i.icdCode ?? ""),
          (i) => (i.icdName ?? "").trim(),
          REPORT_ROLE_ORDER,
          CHART_COLORS.icdStack,
          ensureSpace
        );
        this.drawSectionDivider(doc, left, right);

        // Hospital distribution (same CPT/ICD source as above)
        const hospitalItems = Array.from(data.hospitalMap.entries()).map(([label, count]) => {
          const trimmed = String(label || "").trim();
          const shortLabel = trimmed.length > 70 ? `${trimmed.slice(0, 67)}…` : trimmed;
          return { label: shortLabel, count };
        });
        if (hospitalItems.length) {
          this.drawBarChartSection(
            doc,
            left,
            right,
            160,
            "Hospitals (approved, supervised + own)",
            hospitalItems,
            (i) => i.label,
            (i) => i.count,
            ensureSpace,
            CHART_COLORS.summaryBar,
            { labelWidth: 220 }
          );
          this.drawSectionDivider(doc, left, right);
        }

        // Annual distribution
        const yearItems = Array.from(data.yearMap.entries())
          .map(([year, count]) => ({ label: String(year), count }))
          .sort((a, b) => a.label.localeCompare(b.label));
        if (yearItems.length) {
          this.drawBarChartSection(
            doc,
            left,
            right,
            160,
            "Annual Surgical Supervision Volume",
            yearItems,
            (i) => i.label,
            (i) => i.count,
            ensureSpace,
            CHART_COLORS.summaryBar,
            { labelWidth: 220 } // align with Hospitals chart
          );
          this.drawSectionDivider(doc, left, right);
        }

        // Supervised candidates table
        if (data.supervisedCandidates.length) {
          ensureSpace(120);
          doc.fontSize(REPORT_TYPO.sectionTitleSize).font("Helvetica-Bold").fillColor(CHART_COLORS.bodyTextDark);
          this.drawUnderlinedTitle(doc, left, "Candidates Supervised (Surgical)");
          doc.moveDown(0.35);

          const nameWidth = 210;
          const regWidth = 70;
          const rankWidth = 70;
          const countWidth = 60;
          const headerY = doc.y;
          const regStart = left + nameWidth;
          const rankStart = regStart + regWidth;
          const countStart = rankStart + rankWidth;

          doc.fontSize(REPORT_TYPO.bodySize).font("Helvetica-Bold").fillColor(CHART_COLORS.bodyTextDark);
          doc.text("Name", left, headerY);
          doc.text("Reg. #", regStart, headerY);
          doc.text("Rank", rankStart, headerY);
          doc.text("Cases", countStart, headerY);
          doc
            .moveTo(left, headerY + 12)
            .lineTo(right, headerY + 12)
            .strokeColor(REPORT_LAYOUT.dividerColor)
            .lineWidth(REPORT_LAYOUT.dividerLineWidth)
            .stroke();
          doc.y = headerY + 14;
          doc.moveDown(0.2);

          const truncateToWidth = (text: string, maxW: number): string => {
            if (!text || doc.widthOfString(text) <= maxW) return text;
            const ellipsis = "…";
            let s = text;
            while (s.length && doc.widthOfString(s + ellipsis) > maxW) s = s.slice(0, -1);
            return s ? s + ellipsis : ellipsis;
          };

          doc.font("Helvetica").fontSize(REPORT_TYPO.bodySize).fillColor(CHART_COLORS.bodyText);
          for (const row of data.supervisedCandidates) {
            ensureSpace(18);
            const rowY = doc.y;
            doc.text(truncateToWidth(row.fullName || "—", nameWidth), left, rowY, { width: nameWidth });
            doc.text(row.regNum || "—", regStart, rowY, { width: regWidth });
            doc.text(row.rank || "—", rankStart, rowY, { width: rankWidth });
            doc.text(String(row.count), countStart, rowY, { width: countWidth });
            doc.y = rowY + 14;
            doc.moveDown(0.2);
          }
          this.drawSectionDivider(doc, left, right);
        }
      }

      // Clinical supervision (if applicable)
      if (institution.isClinical && supervisor.canValClin) {
        ensureSpace(60);
        doc.fontSize(REPORT_TYPO.sectionNumSize).font("Helvetica-Bold").fillColor(CHART_COLORS.bodyTextDark);
        this.drawUnderlinedTitle(
          doc,
          left,
          supervisor.canValidate ? "3. Clinical Supervision" : "2. Clinical Supervision"
        );
        doc.moveDown(0.45);
        doc.fontSize(REPORT_TYPO.bodySize).font("Helvetica").fillColor(CHART_COLORS.bodyText);
        doc.text(`Approved supervised clinical cases: ${data.clinicalSupervisedCount}.`, left, doc.y);
        doc.moveDown(0.6);
        this.drawSectionDivider(doc, left, right);
      }

      // Academic participation (always shown if any events)
      const hasAcademic = data.academicEventsForSupervisor.length > 0;
      if (hasAcademic) {
        ensureSpace(120);
        doc.fontSize(REPORT_TYPO.sectionNumSize).font("Helvetica-Bold").fillColor(CHART_COLORS.bodyTextDark);
        const sectionTitle = supervisor.canValidate || supervisor.canValClin ? "4. Academic Participation" : "2. Academic Participation";
        this.drawUnderlinedTitle(doc, left, sectionTitle);
        doc.moveDown(0.45);

        const titleWidth = 230;
        const typeWidth = 60;
        const dateWidth = 80;
        const attendanceWidth = 60;
        const typeStart = left + titleWidth;
        const dateStart = typeStart + typeWidth;
        const attendanceStart = dateStart + dateWidth;

        const truncateToWidth = (text: string, maxW: number): string => {
          if (!text || doc.widthOfString(text) <= maxW) return text;
          const ellipsis = "…";
          let s = text;
          while (s.length && doc.widthOfString(s + ellipsis) > maxW) s = s.slice(0, -1);
          return s ? s + ellipsis : ellipsis;
        };

        const headerY = doc.y;
        doc.fontSize(REPORT_TYPO.bodySize).font("Helvetica-Bold").fillColor(CHART_COLORS.bodyTextDark);
        doc.text("Event", left, headerY);
        doc.text("Type", typeStart, headerY);
        doc.text("Date", dateStart, headerY);
        doc.text("Att.", attendanceStart, headerY);
        doc
          .moveTo(left, headerY + 12)
          .lineTo(right, headerY + 12)
          .strokeColor(REPORT_LAYOUT.dividerColor)
          .lineWidth(REPORT_LAYOUT.dividerLineWidth)
          .stroke();
        doc.y = headerY + 14;
        doc.moveDown(0.2);

        doc.font("Helvetica").fontSize(REPORT_TYPO.bodySize).fillColor(CHART_COLORS.bodyText);
        for (const row of data.academicEventsForSupervisor) {
          ensureSpace(18);
          const rowY = doc.y;
          doc.text(truncateToWidth(row.title || "—", titleWidth), left, rowY);
          doc.text((row.type || "—").toString(), typeStart, rowY);
          doc.text(formatDateForReport(row.date), dateStart, rowY);
          doc.text(String(row.attendanceCount ?? 0), attendanceStart, rowY);
          doc.y = rowY + 14;
          doc.moveDown(0.2);
        }
        this.drawSectionDivider(doc, left, right);
      }

      drawReportFooter(doc, left, right, pageNumber);
      doc.end();
    });
  }

  /**
   * Academic participation for a supervisor: all lecture/conf events where they are presenter,
   * with attendance counts.
   */
  private async getSupervisorAcademicEventsWithAttendance(
    supervisorId: string,
    dataSource: DataSource
  ): Promise<{ title: string; type: string; date: string; attendanceCount: number }[]> {
    const eventRepo = dataSource.getRepository(EventEntity);
    const attendanceRepo = dataSource.getRepository(EventAttendanceEntity);

    const events = await eventRepo.find({
      where: { presenterId: supervisorId },
      relations: ["lecture", "journal", "conf"],
      order: { dateTime: "ASC" },
    });

    if (events.length === 0) {
      return [];
    }

    const eventIds = events.map((e) => e.id);
    const attendance = await attendanceRepo.find({
      where: { eventId: In(eventIds) },
    });

    const counts = new Map<string, number>();
    for (const att of attendance) {
      counts.set(att.eventId, (counts.get(att.eventId) ?? 0) + 1);
    }

    return events.map((ev) => {
      const rawTitle =
        (ev.type === "lecture" &&
          (((ev.lecture as any)?.lectureTitle as string) || (ev.lecture as any)?.mainTopic)) ||
        (ev.type === "journal" && (ev.journal as any)?.journalTitle) ||
        (ev.type === "conf" && (ev.conf as any)?.confTitle) ||
        "";
      const title = rawTitle && String(rawTitle).trim().length > 0 ? String(rawTitle).trim() : `Untitled ${ev.type}`;
      return {
        title,
        type: ev.type,
        date: ev.dateTime ? ev.dateTime.toISOString() : "",
        attendanceCount: counts.get(ev.id) ?? 0,
      };
    });
  }

  private drawSectionDivider(
    doc: InstanceType<typeof PDFDocument>,
    left: number,
    right: number
  ): void {
    doc.moveDown(0.4);
    const y = doc.y;
    doc.moveTo(left, y).lineTo(right, y).strokeColor(REPORT_LAYOUT.dividerColor).lineWidth(REPORT_LAYOUT.dividerLineWidth).stroke();
    doc.y = y;
    doc.moveDown(0.5);
  }

  /** Draws title at current doc.y with native underline (like Word/Excel). Set font/size/color before calling. */
  private drawUnderlinedTitle(
    doc: InstanceType<typeof PDFDocument>,
    left: number,
    title: string
  ): void {
    doc.text(title, left, doc.y, { underline: true });
  }

  private drawBarChartSection(
    doc: InstanceType<typeof PDFDocument>,
    left: number,
    right: number,
    maxBarWidth: number,
    title: string,
    items: { [k: string]: any }[],
    getLabel: (item: any) => string,
    getValue: (item: any) => number,
    ensureSpace: (required: number) => void,
    barColor: string = CHART_COLORS.genericStack[0],
    options?: { labelWidth?: number; legendLabel?: string }
  ): void {
    if (items.length === 0) return;
    const labelWidth = options?.labelWidth ?? 170;
    const gapLabelsBar = 10;
    const barStartX = left + labelWidth + gapLabelsBar;
    const totalX = barStartX + maxBarWidth + 10;
    ensureSpace(28 + items.length * 18);
    doc.fontSize(REPORT_TYPO.sectionTitleSize).font("Helvetica-Bold").fillColor(CHART_COLORS.bodyTextDark);
    this.drawUnderlinedTitle(doc, left, title);
    doc.moveDown(0.35);
    if (options?.legendLabel) {
      this.drawRoleLegend(doc, left, [options.legendLabel], [barColor]);
    } else {
      doc.moveDown(0.4);
    }
    const maxVal = Math.max(...items.map(getValue), 1);
    doc.fontSize(REPORT_TYPO.bodySize).font("Helvetica");
    const rowHeight = 14;
    for (const item of items) {
      ensureSpace(rowHeight + 4);
      const label = getLabel(item);
      const value = getValue(item);
      const barWidth = maxBarWidth * (value / maxVal);
      const rowY = doc.y;
      doc.fillColor(CHART_COLORS.bodyText).text(label, left, rowY, { width: labelWidth });
      doc.fillColor(barColor).rect(barStartX, rowY, barWidth, 10).fill();
      doc.fillColor(CHART_COLORS.bodyText).text(String(value), totalX, rowY + 2);
      doc.y = Math.max(doc.y, rowY + rowHeight);
    }
    doc.moveDown(0.6);
  }

  /** Stacked bar chart for items with byRole array (role, count). Role order and colors array match by index. */
  private drawStackedBarChartSection(
    doc: InstanceType<typeof PDFDocument>,
    left: number,
    right: number,
    maxBarWidth: number,
    title: string,
    items: { byRole?: { role: string; count: number }[] }[],
    getLabel: (item: any) => string,
    roleOrder: string[],
    colorSet: readonly string[],
    ensureSpace: (required: number) => void
  ): void {
    if (items.length === 0) return;
    ensureSpace(20 + items.length * 18);
    doc.fontSize(11).font("Helvetica-Bold").fillColor(CHART_COLORS.bodyText);
    this.drawUnderlinedTitle(doc, left, title);
    doc.moveDown(0.4);
    let maxTotal = 1;
    for (const item of items) {
      const byRole = item.byRole ?? [];
      const total = byRole.reduce((s, r) => s + r.count, 0);
      if (total > maxTotal) maxTotal = total;
    }
    doc.fontSize(9).font("Helvetica");
    const rowHeight = 14;
    for (const item of items) {
      ensureSpace(rowHeight + 4);
      const label = getLabel(item);
      const byRole = item.byRole ?? [];
      const total = byRole.reduce((s, r) => s + r.count, 0);
      const rowY = doc.y;
      doc.fillColor(CHART_COLORS.bodyText).text(label, left, rowY, { width: 170 });
      let x = left + 180;
      for (let i = 0; i < roleOrder.length; i++) {
        const roleLabel = roleOrder[i];
        const r = byRole.find((x) => x.role === roleLabel);
        const count = r?.count ?? 0;
        if (count <= 0) continue;
        const segWidth = maxBarWidth * (count / maxTotal);
        doc.fillColor(colorSet[i % colorSet.length]).rect(x, rowY, segWidth, 10).fill();
        x += segWidth;
      }
      doc.fillColor(CHART_COLORS.bodyText).text(String(total), left + 185 + maxBarWidth, rowY + 2);
      doc.y = Math.max(doc.y, rowY + rowHeight);
    }
    doc.moveDown(0.6);
  }

  /** Procedures Performed / Supervised: total and role breakdown with full-width progress bars. */
  private drawProceduresPerformedSection(
    doc: InstanceType<typeof PDFDocument>,
    left: number,
    right: number,
    title: string,
    totalProcedures: number,
    proceduresByRole: Record<string, number>,
    ensureSpace: (required: number) => void
  ): void {
    const labelWidth = 140;
    const barGap = 12;
    const valueWidth = 72;
    const barWidth = right - left - labelWidth - barGap - valueWidth;
    const barHeight = 10;
    const rowHeight = 18;
    ensureSpace(120 + REPORT_ROLE_ORDER.length * rowHeight);

    doc.fontSize(REPORT_TYPO.sectionTitleSize).font("Helvetica-Bold").fillColor(CHART_COLORS.bodyTextDark);
    this.drawUnderlinedTitle(doc, left, title);
    doc.moveDown(0.5);

    doc.fontSize(REPORT_TYPO.bodySize).font("Helvetica");
    for (let i = 0; i < REPORT_ROLE_ORDER.length; i++) {
      ensureSpace(rowHeight + 4);
      const roleLabel = REPORT_ROLE_ORDER[i];
      const count = proceduresByRole[roleLabel] ?? 0;
      const pct = totalProcedures > 0 ? (100 * count) / totalProcedures : 0;
      const rowY = doc.y;
      doc.fillColor(CHART_COLORS.bodyText).text(roleLabel, left, rowY, { width: labelWidth, lineBreak: false });
      const barX = left + labelWidth + barGap;
      doc.fillColor(PROCEDURE_TRACK_COLOR).rect(barX, rowY, barWidth, barHeight).fill();
      if (count > 0) {
        const fillWidth = (count / totalProcedures) * barWidth;
        doc.fillColor(PROCEDURE_ROLE_COLORS[i % PROCEDURE_ROLE_COLORS.length]).rect(barX, rowY, fillWidth, barHeight).fill();
      }
      const pctText = `${pct.toFixed(1)}%`;
      const countText = String(count);
      doc.fillColor(CHART_COLORS.muted).text(pctText, right - valueWidth, rowY + 2, { width: 40, align: "right" });
      doc.fillColor(CHART_COLORS.bodyTextDark).font("Helvetica-Bold").text(countText, right - 32, rowY + 2, { width: 28, align: "right" });
      doc.font("Helvetica");
      doc.y = Math.max(doc.y, rowY + rowHeight);
    }
    doc.moveDown(0.4);
  }

  /** Draw a single-line legend: colored box + role label for each role in roleOrder. */
  private drawRoleLegend(
    doc: InstanceType<typeof PDFDocument>,
    left: number,
    roleOrder: string[],
    colorSet: readonly string[]
  ): void {
    doc.moveDown(1);
    const boxSize = 6;
    const gap = 4;
    const labelGap = 2;
    doc.fontSize(REPORT_TYPO.captionSize).font("Helvetica").fillColor(CHART_COLORS.bodyText);
    const legendY = doc.y;
    let x = left;
    for (let i = 0; i < roleOrder.length; i++) {
      doc.fillColor(colorSet[i % colorSet.length]).rect(x, legendY, boxSize, boxSize).fill();
      x += boxSize + labelGap;
      doc.fillColor(CHART_COLORS.bodyText).text(roleOrder[i], x, legendY - 1, { lineBreak: false });
      x += doc.widthOfString(roleOrder[i]) + gap;
    }
    doc.y = legendY + 8;
    doc.moveDown(1);
  }

  /** Stacked bar chart with two label columns (code | title/name), gap, then bar; includes legend. Used for ICD and CPT. */
  private drawStackedBarChartSectionWithCodeTitle(
    doc: InstanceType<typeof PDFDocument>,
    left: number,
    right: number,
    codeWidth: number,
    titleWidth: number,
    gapLabelsBar: number,
    maxBarWidth: number,
    title: string,
    items: { byRole?: { role: string; count: number }[] }[],
    getCode: (item: any) => string,
    getTitle: (item: any) => string,
    roleOrder: string[],
    colorSet: readonly string[],
    ensureSpace: (required: number) => void
  ): void {
    if (items.length === 0) return;
    ensureSpace(28 + items.length * 24);
    doc.fontSize(REPORT_TYPO.sectionTitleSize).font("Helvetica-Bold").fillColor(CHART_COLORS.bodyTextDark);
    this.drawUnderlinedTitle(doc, left, title);
    doc.moveDown(0.35);
    this.drawRoleLegend(doc, left, roleOrder, colorSet);

    let maxTotal = 1;
    for (const item of items) {
      const byRole = item.byRole ?? [];
      const total = byRole.reduce((s, r) => s + r.count, 0);
      if (total > maxTotal) maxTotal = total;
    }
    const barStartX = left + codeWidth + titleWidth + gapLabelsBar;
    const totalX = barStartX + maxBarWidth + 10;
    doc.fontSize(REPORT_TYPO.bodySize).font("Helvetica");
    const rowHeight = 18;
    const titlePadding = 4;
    const effectiveTitleWidth = Math.max(80, titleWidth - titlePadding);
    const maxTitleChars = Math.floor(effectiveTitleWidth / 5.5);
    for (const item of items) {
      ensureSpace(rowHeight + 4);
      const code = getCode(item);
      const titleText = (getTitle(item) || "").slice(0, maxTitleChars);
      const byRole = item.byRole ?? [];
      const total = byRole.reduce((s, r) => s + r.count, 0);
      const rowY = doc.y;
      doc.fillColor(CHART_COLORS.bodyText).text(code, left, rowY, { width: codeWidth, lineBreak: false });
      doc.fillColor(CHART_COLORS.bodyText).text(titleText, left + codeWidth + titlePadding, rowY, { width: effectiveTitleWidth, lineBreak: false });
      let x = barStartX;
      for (let i = 0; i < roleOrder.length; i++) {
        const roleLabel = roleOrder[i];
        const r = byRole.find((x) => x.role === roleLabel);
        const count = r?.count ?? 0;
        if (count <= 0) continue;
        const segWidth = maxBarWidth * (count / maxTotal);
        doc.fillColor(colorSet[i % colorSet.length]).rect(x, rowY, segWidth, 10).fill();
        x += segWidth;
      }
      doc.fillColor(CHART_COLORS.bodyText).text(String(total), totalX, rowY + 2);
      doc.y = Math.max(doc.y, rowY + rowHeight);
    }
    doc.moveDown(0.6);
  }

  /** Stacked bar chart for items with count and byRole Record<string, number>; getLabel(item) provides the row label. */
  private drawStackedBarChartSectionGeneric(
    doc: InstanceType<typeof PDFDocument>,
    left: number,
    right: number,
    maxBarWidth: number,
    labelWidth: number,
    title: string,
    items: { count: number; byRole: Record<string, number> }[],
    getLabel: (item: any) => string,
    roleOrder: string[],
    colorSet: readonly string[],
    ensureSpace: (required: number) => void,
    showLegend: boolean = true
  ): void {
    if (items.length === 0) return;
    ensureSpace(28 + items.length * 18);
    const gapLabelsBar = 10;
    const barStartX = left + labelWidth + gapLabelsBar;
    const totalX = barStartX + maxBarWidth + 10;
    doc.fontSize(REPORT_TYPO.sectionTitleSize).font("Helvetica-Bold").fillColor(CHART_COLORS.bodyTextDark);
    this.drawUnderlinedTitle(doc, left, title);
    doc.moveDown(0.35);
    if (showLegend) this.drawRoleLegend(doc, left, roleOrder, colorSet);
    else doc.moveDown(0.4);
    const maxTotal = Math.max(...items.map((i) => i.count), 1);
    doc.fontSize(REPORT_TYPO.bodySize).font("Helvetica");
    const rowHeight = 14;
    for (const item of items) {
      ensureSpace(rowHeight + 4);
      const label = getLabel(item);
      const byRole = item.byRole ?? {};
      const rowY = doc.y;
      doc.fillColor(CHART_COLORS.bodyText).text(label, left, rowY, { width: labelWidth });
      let x = barStartX;
      for (let i = 0; i < roleOrder.length; i++) {
        const count = byRole[roleOrder[i]] ?? 0;
        if (count <= 0) continue;
        const segWidth = maxBarWidth * (count / maxTotal);
        doc.fillColor(colorSet[i % colorSet.length]).rect(x, rowY, segWidth, 10).fill();
        x += segWidth;
      }
      doc.fillColor(CHART_COLORS.bodyText).text(String(item.count), totalX, rowY + 2);
      doc.y = Math.max(doc.y, rowY + rowHeight);
    }
    doc.moveDown(0.6);
  }
}

