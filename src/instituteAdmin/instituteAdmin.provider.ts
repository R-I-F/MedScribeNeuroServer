import { injectable, inject } from "inversify";
import { IInstituteAdmin, IInstituteAdminDoc } from "./instituteAdmin.interface";
import { AppDataSource } from "../config/database.config";
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
  private instituteAdminRepository: Repository<InstituteAdminEntity>;

  constructor(
    @inject(SupervisorService) private supervisorService: SupervisorService,
    @inject(CandService) private candService: CandService,
    @inject(SubService) private subService: SubService,
    @inject(CalSurgService) private calSurgService: CalSurgService,
    @inject(HospitalService) private hospitalService: HospitalService,
    @inject(ArabProcService) private arabProcService: ArabProcService
  ) {
    this.instituteAdminRepository = AppDataSource.getRepository(InstituteAdminEntity);
  }

  public async createInstituteAdmin(validatedReq: Partial<IInstituteAdmin>): Promise<IInstituteAdminDoc> | never {
    try {
      const newInstituteAdmin = this.instituteAdminRepository.create(validatedReq);
      const savedInstituteAdmin = await this.instituteAdminRepository.save(newInstituteAdmin);
      return savedInstituteAdmin as unknown as IInstituteAdminDoc;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getAllInstituteAdmins(): Promise<IInstituteAdminDoc[]> | never {
    try {
      const instituteAdmins = await this.instituteAdminRepository.find({
        order: { createdAt: "DESC" },
      });
      return instituteAdmins as unknown as IInstituteAdminDoc[];
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getInstituteAdminById(id: string): Promise<IInstituteAdminDoc | null> | never {
    try {
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        throw new Error("Invalid institute admin ID format");
      }
      const instituteAdmin = await this.instituteAdminRepository.findOne({
        where: { id },
      });
      return instituteAdmin as unknown as IInstituteAdminDoc | null;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getInstituteAdminByEmail(email: string): Promise<IInstituteAdminDoc | null> | never {
    try {
      const instituteAdmin = await this.instituteAdminRepository.findOne({
        where: { email },
      });
      return instituteAdmin as unknown as IInstituteAdminDoc | null;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async updateInstituteAdmin(validatedReq: Partial<IInstituteAdmin> & { id: string }): Promise<IInstituteAdminDoc | null> | never {
    try {
      const { id, ...updateData } = validatedReq;
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        throw new Error("Invalid institute admin ID format");
      }
      await this.instituteAdminRepository.update(id, updateData);
      const updatedInstituteAdmin = await this.instituteAdminRepository.findOne({
        where: { id },
      });
      return updatedInstituteAdmin as unknown as IInstituteAdminDoc | null;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async deleteInstituteAdmin(id: string): Promise<boolean> | never {
    try {
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        throw new Error("Invalid institute admin ID format");
      }
      const result = await this.instituteAdminRepository.delete(id);
      return (result.affected ?? 0) > 0;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  // Dashboard endpoints business logic
  public async getAllSupervisors(): Promise<ISupervisorDoc[]> | never {
    try {
      return await this.supervisorService.getAllSupervisors();
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getSupervisorSubmissions(
    supervisorId: string,
    status?: "approved" | "pending" | "rejected"
  ): Promise<ISubDoc[]> | never {
    try {
      // Validate UUID format (supervisor now uses MariaDB UUID)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(supervisorId)) {
        throw new Error("Invalid supervisor ID format");
      }

      // Verify supervisor exists
      const supervisor = await this.supervisorService.getSupervisorById({ id: supervisorId });
      if (!supervisor) {
        throw new Error("Supervisor not found");
      }

      // Get submissions with optional status filter
      if (status) {
        return await this.subService.getSubsBySupervisorIdAndStatus(supervisorId, status);
      } else {
        return await this.subService.getSubsBySupervisorId(supervisorId);
      }
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getAllCandidates(): Promise<ICandDoc[]> | never {
    try {
      return await this.candService.getAllCandidates();
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getCandidateSubmissions(candidateId: string): Promise<ISubDoc[]> | never {
    try {
      // Validate UUID format (candidate now uses MariaDB UUID)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(candidateId)) {
        throw new Error("Invalid candidate ID format");
      }

      // Convert UUID to ObjectId format for MongoDB compatibility (sub still uses MongoDB)
      const uuidHex = candidateId.replace(/-/g, '');
      const mongoObjectId = uuidHex.substring(0, 24);

      // Verify candidate exists
      const candidate = await this.candService.getCandById(candidateId);
      if (!candidate) {
        throw new Error("Candidate not found");
      }

      return await this.subService.getSubsByCandidateId(mongoObjectId);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getCandidateSubmissionById(
    candidateId: string,
    submissionId: string
  ): Promise<ISubDoc | null> | never {
    try {
      // Validate UUID formats
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(submissionId)) {
        throw new Error("Invalid submission ID format");
      }
      if (!uuidRegex.test(candidateId)) {
        throw new Error("Invalid candidate ID format");
      }

      // Get populated submission
      const submission = await this.subService.getSubById(submissionId);
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
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(candidateId)) {
        // Candidate ID is UUID (MariaDB format)
        if (!uuidRegex.test(submissionCandidateId)) {
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
        if (uuidRegex.test(submissionCandidateId)) {
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
  }): Promise<ICalSurgDoc[]> | never {
    try {
      return await this.calSurgService.getCalSurgWithFilters(filters);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getAllHospitals(): Promise<IHospitalDoc[]> | never {
    try {
      return await this.hospitalService.getAllHospitals();
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getArabicProcedures(search?: string): Promise<IArabProcDoc[]> | never {
    try {
      return await this.arabProcService.getArabProcsWithSearch(search);
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
  }): Promise<any[]> | never {
    try {
      // Get calendar procedures with filters
      const calSurgs = await this.calSurgService.getCalSurgWithFilters({
        hospitalId: filters.hospitalId,
        month: filters.month,
        year: filters.year,
        startDate: filters.startDate,
        endDate: filters.endDate
      });

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

