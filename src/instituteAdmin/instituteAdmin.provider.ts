import { injectable, inject } from "inversify";
import { IInstituteAdmin, IInstituteAdminDoc } from "./instituteAdmin.interface";
import { InstituteAdmin } from "./instituteAdmin.schema";
import { Types } from "mongoose";
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
  constructor(
    @inject(SupervisorService) private supervisorService: SupervisorService,
    @inject(CandService) private candService: CandService,
    @inject(SubService) private subService: SubService,
    @inject(CalSurgService) private calSurgService: CalSurgService,
    @inject(HospitalService) private hospitalService: HospitalService,
    @inject(ArabProcService) private arabProcService: ArabProcService
  ) {}
  public async createInstituteAdmin(validatedReq: Partial<IInstituteAdmin>): Promise<IInstituteAdminDoc> | never {
    try {
      const instituteAdmin = new InstituteAdmin(validatedReq);
      return await instituteAdmin.save();
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getAllInstituteAdmins(): Promise<IInstituteAdminDoc[]> | never {
    try {
      return await InstituteAdmin.find().exec();
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getInstituteAdminById(id: string): Promise<IInstituteAdminDoc | null> | never {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new Error("Invalid institute admin ID");
      }
      return await InstituteAdmin.findById(id).exec();
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getInstituteAdminByEmail(email: string): Promise<IInstituteAdminDoc | null> | never {
    try {
      return await InstituteAdmin.findOne({ email }).exec();
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async updateInstituteAdmin(validatedReq: Partial<IInstituteAdmin> & { id: string }): Promise<IInstituteAdminDoc | null> | never {
    try {
      const { id, ...updateData } = validatedReq;
      if (!Types.ObjectId.isValid(id)) {
        throw new Error("Invalid institute admin ID");
      }
      return await InstituteAdmin.findByIdAndUpdate(id, updateData, { new: true }).exec();
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async deleteInstituteAdmin(id: string): Promise<boolean> | never {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new Error("Invalid institute admin ID");
      }
      const result = await InstituteAdmin.findByIdAndDelete(id).exec();
      return result !== null;
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
      if (!Types.ObjectId.isValid(supervisorId)) {
        throw new Error("Invalid supervisor ID");
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
      if (!Types.ObjectId.isValid(candidateId)) {
        throw new Error("Invalid candidate ID");
      }

      // Verify candidate exists - we'll need to add a method to check this
      // For now, we'll let the service handle it
      return await this.subService.getSubsByCandidateId(candidateId);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getCandidateSubmissionById(
    candidateId: string,
    submissionId: string
  ): Promise<ISubDoc | null> | never {
    try {
      // Validate ObjectIds
      if (!Types.ObjectId.isValid(submissionId)) {
        throw new Error("Invalid submission ID format");
      }
      if (!Types.ObjectId.isValid(candidateId)) {
        throw new Error("Invalid candidate ID format");
      }

      // Get populated submission
      const submission = await this.subService.getSubById(submissionId);
      if (!submission) {
        return null;
      }

      // Extract candidate ID - handle both populated (object) and unpopulated (ObjectId) cases
      let submissionCandidateId: string;
      const candidateDoc = submission.candDocId as any;
      if (candidateDoc && typeof candidateDoc === 'object' && candidateDoc._id) {
        // Populated document - extract _id
        submissionCandidateId = candidateDoc._id.toString();
      } else if (candidateDoc) {
        // Unpopulated ObjectId - convert directly
        submissionCandidateId = candidateDoc.toString();
      } else {
        throw new Error("Submission not found or does not belong to the specified candidate");
      }

      // Verify submission belongs to the candidate
      if (submissionCandidateId !== candidateId) {
        throw new Error("Submission not found or does not belong to the specified candidate");
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
        const hospitalId = hospital._id.toString();

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
          _id: entry.hospital._id,
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

