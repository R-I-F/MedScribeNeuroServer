import { injectable, inject } from "inversify";
import { DataSource } from "typeorm";
import { IInstituteAdmin, IInstituteAdminDoc } from "./instituteAdmin.interface";
import { InstituteAdminEntity } from "./instituteAdmin.mDbSchema";
import { Repository } from "typeorm";
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

@injectable()
export class InstituteAdminProvider {
  private readonly uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  constructor(
    @inject(SupervisorService) private supervisorService: SupervisorService,
    @inject(CandService) private candService: CandService,
    @inject(SubService) private subService: SubService,
    @inject(CalSurgService) private calSurgService: CalSurgService,
    @inject(HospitalService) private hospitalService: HospitalService,
    @inject(ArabProcService) private arabProcService: ArabProcService
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
}

