import { injectable, inject } from "inversify";
import { ExternalService } from "../externalService/external.service";
import { IExternalRow } from "../arabProc/interfaces/IExternalRow.interface";
import { UtilService } from "../utils/utils.service";
import { Cand } from "../cand/cand.schema";
import { CalSurg } from "../calSurg/calSurg.schema";
import { Supervisor } from "../supervisor/supervisor.schema";
import { MainDiag } from "../mainDiag/mainDiag.schema";
import { ProcCpt } from "../procCpt/procCpt.schema";
import { Diagnosis } from "../diagnosis/diagnosis.schema";
import { ICandDoc } from "../cand/cand.interface";
import {
  ISubRawData,
  ISub,
  ISubDoc,
  ISubBase,
  TRoleInSurg,
  TOtherSurgRank,
  TInsUsed,
  TConsUsed,
  TMainDiagTitle,
  TSubStatus,
  SubPayloadMap,
} from "./interfaces/sub.interface";
import { Types } from "mongoose";
import { SubService } from "./sub.service";
import { IExternalResponse } from "../externalService/external.interface";
import { MailerService } from "../mailer/mailer.service";
import { AiAgentProvider } from "../aiAgent/aiAgent.provider";

@injectable()
export class SubProvider {
  constructor(
    @inject(ExternalService) private externalService: ExternalService,
    @inject(UtilService) private utilService: UtilService,
    @inject(SubService) private subService: SubService,
    @inject(MailerService) private mailerService: MailerService,
    @inject(AiAgentProvider) private aiAgentProvider: AiAgentProvider
  ) {}

  public async createSubFromExternal(
    validatedReq: Partial<IExternalRow>
  ): Promise<ISub[] | any> {
    try {
      const apiString = this.buildExternalApiString(validatedReq);
      const externalData =
        await this.externalService.fetchExternalData(apiString);

      if (!externalData.success) {
        return externalData;
      }

      return await this.processExternalData(externalData);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  private buildExternalApiString(validatedReq: Partial<IExternalRow>): string {
    if (validatedReq.row) {
      return `${process.env.GETTER_API_ENDPOINT}?spreadsheetName=neuroLogResponses&sheetName=Form%20Responses%201&row=${validatedReq.row}`;
    }

    return `${process.env.GETTER_API_ENDPOINT}?spreadsheetName=neuroLogResponses&sheetName=Form%20Responses%201`;
  }

  private async processExternalData(externalData: any): Promise<ISubDoc[]> {
    const cands = await Cand.find({});
    const candsMap: Map<string, ICandDoc> = new Map(
      cands.map((c) => [c.email, c])
    );

    const calSurgs = await CalSurg.find({});
    const calSurgsMap = new Map(calSurgs.map((c) => [c.google_uid, c]));

    const supervisors = await Supervisor.find({});
    const supervisorsMap = new Map(supervisors.map((s) => [s.fullName, s]));

    const mainDiags = await MainDiag.find({});
    const mainDiagsMap = new Map(mainDiags.map((m) => [m.title, m]));

    const procCpts = await ProcCpt.find({});
    const procCptsMap = new Map(procCpts.map((p) => [p.numCode, p]));

    const diagnoses = await Diagnosis.find({});
    const diagnosesMap = new Map(diagnoses.map((d) => [d.icdCode, d]));

    const subPayloads: ISub[] = [];
    const indexes = this.utilService.returnSubIndexes();

    for (let i = 0; i < externalData.data.data.length; i++) {
      const rawItem: ISubRawData = externalData.data.data[i];
      const rawItemArr = Object.values(rawItem);
      if(i ===  5){
        continue;
      }
      const mainDiagTitle = this.utilService.returnSanitizedMainDiag(
        rawItemArr[indexes.mainDiag]
      ) as TMainDiagTitle;

      const rawAssRole = rawItemArr[indexes.ifAssDescRole];
      const assRoleDesc =
        typeof rawAssRole === "string" && rawAssRole.length > 0
          ? this.utilService.stringToLowerCaseTrimUndefined(rawAssRole)
          : undefined;

      const procCodes = this.utilService.extractCodes(
        rawItemArr[indexes.numCode],
        ", "
      );
      const procDocIds = procCodes
        .map((code) => procCptsMap.get(code)?._id)
        .filter((id): id is Types.ObjectId => Boolean(id));

      const icdCodes = this.utilService.extractCodes(
        rawItemArr[indexes.icd],
        ", "
      );
      const icdDocIds = icdCodes
        .map((code) => diagnosesMap.get(code)?._id)
        .filter((id): id is Types.ObjectId => Boolean(id));

      const subBase: ISubBase = {
        timeStamp: this.utilService.stringToDateConverter(
          rawItemArr[indexes.timeStamp]
        ),
        candDocId: candsMap.get(rawItemArr[indexes.candEmail])?._id as Types.ObjectId,
        procDocId: calSurgsMap.get(rawItemArr[indexes.procUid])?._id as Types.ObjectId,
        supervisorDocId: supervisorsMap.get(
          rawItemArr[indexes.superEmail]
        )?._id as Types.ObjectId,
        roleInSurg: this.utilService.stringToLowerCaseTrimUndefined(
          rawItemArr[indexes.roleInProc]
        ) as TRoleInSurg,
        assRoleDesc,
        otherSurgRank: this.utilService.stringToLowerCaseTrimUndefined(
          rawItemArr[indexes.otherSurg]
        ) as TOtherSurgRank,
        otherSurgName: this.utilService.stringToLowerCaseTrimUndefined(
          rawItemArr[indexes.nameOtherSurg]
        ) as string,
        isItRevSurg: this.utilService.yesNoToBoolean(
          rawItemArr[indexes.isItRevSurg]
        ),
        preOpClinCond: this.utilService.stringToLowerCaseTrimUndefined(
          rawItemArr[indexes.preOpClinicalCond]
        ),
        insUsed: this.utilService.stringToLowerCaseTrimUndefined(
          rawItemArr[indexes.insUsed]
        ) as TInsUsed,
        consUsed: this.utilService.stringToLowerCaseTrimUndefined(
          rawItemArr[indexes.consUsed]
        ) as TConsUsed,
        consDetails: this.utilService.stringToLowerCaseTrimUndefined(
          rawItemArr[indexes.consDet]
        ),
        mainDiagDocId: mainDiagsMap.get(mainDiagTitle)?._id as Types.ObjectId,
        subGoogleUid: rawItemArr[indexes.subUid] || "",
        subStatus: this.utilService.normalizeSubStatus(
          rawItemArr[indexes.subStatus]
        ) as TSubStatus,
        procCptDocId: procDocIds,
        icdDocId: icdDocIds,
      };

      // console.log("google uid ", subBase.subGoogleUid)

      // Only create submission if all required fields are present
      if (
        subBase.candDocId &&
        subBase.procDocId &&
        subBase.supervisorDocId &&
        subBase.mainDiagDocId &&
        subBase.subGoogleUid &&
        subBase.subGoogleUid.trim() !== ""
      ) {
        const subPayload = this.returnSubPayload(
          mainDiagTitle,
          subBase,
          rawItemArr,
          indexes
        );

        subPayloads.push(subPayload);
      }
    }
    try {
      // Business logic: Filter out duplicates before bulk creation
      const uniqueSubs = await this.filterDuplicateSubs(subPayloads);
      
      // Business logic: Create bulk submissions (only new ones)
      if (uniqueSubs.length === 0) {
        return [];
      }
      const response = await this.subService.createBulkSub(uniqueSubs);
      return response;
      
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  private returnSubPayload<T extends TMainDiagTitle>(
    mainDiagTitle: T,
    subBase: ISubBase,
    rawItemArr: (string | undefined)[],
    indexes: ReturnType<UtilService["returnSubIndexes"]>
  ): SubPayloadMap[T] {
    const toOptionalLowerString = (idx: number) => {
      const value = rawItemArr[idx];
      if (typeof value !== "string" || value.trim().length === 0) {
        return undefined;
      }
      return this.utilService.stringToLowerCaseTrimUndefined(value);
    };

    const toRequiredLowerString = (idx: number) => {
      return toOptionalLowerString(idx) ?? "";
    };

    const toLowerCaseArray = (idx: number, delimiter: string = ", ") => {
      const value = rawItemArr[idx];
      if (typeof value !== "string" || value.trim().length === 0) {
        return [] as string[];
      }
      return (
        this.utilService.stringToArrayOfLCStrings(value, delimiter) ?? []
      );
    };

    switch (mainDiagTitle) {
      case "congenital anomalies, infantile hydrocephalus": {
        const payload: SubPayloadMap["congenital anomalies, infantile hydrocephalus"] =
          {
            ...subBase,
            diagnosisName: toLowerCaseArray(indexes.congAnomDiag),
            procedureName: toLowerCaseArray(indexes.congAnomProc),
            surgNotes: toOptionalLowerString(indexes.congAnomProcSurgNotes),
            IntEvents: toOptionalLowerString(indexes.conAnomIntEvents),
          };
        return payload as SubPayloadMap[T];
      }

      case "cns tumors": {
        const payload: SubPayloadMap["cns tumors"] = {
          ...subBase,
          diagnosisName: toLowerCaseArray(indexes.cnsTumorProvDiag),
          procedureName: toLowerCaseArray(indexes.cnsTumorProc),
          spOrCran: this.utilService.extractSpOrCran(
            rawItemArr[indexes.cnsTumSpOrCran]
          ),
          pos: toRequiredLowerString(indexes.cnsTumorPos) as SubPayloadMap["cns tumors"]["pos"],
          approach: toRequiredLowerString(indexes.cnsTumorApp),
          surgNotes: toOptionalLowerString(indexes.cnsTumorSurgNotes),
          IntEvents: toOptionalLowerString(indexes.cnsTumorIntEvents),
        };
        return payload as SubPayloadMap[T];
      }

      case "cns infection": {
        const payload: SubPayloadMap["cns infection"] = {
          ...subBase,
          diagnosisName: toLowerCaseArray(indexes.cnsInfDiag),
          procedureName: toLowerCaseArray(indexes.cnsInfProc),
          surgNotes: toOptionalLowerString(indexes.cnsInfSurgNotes),
          IntEvents: toOptionalLowerString(indexes.cnsInfIntEvents),
        };
        return payload as SubPayloadMap[T];
      }

      case "cranial trauma": {
        const payload: SubPayloadMap["cranial trauma"] = {
          ...subBase,
          diagnosisName: toLowerCaseArray(indexes.cranialTraumaProvDiag),
          procedureName: toLowerCaseArray(indexes.cranialTraumaProc),
          surgNotes: toOptionalLowerString(indexes.cranialTraumaSurgNotes),
          IntEvents: toOptionalLowerString(indexes.cranialTraumaIntEvents),
        };
        return payload as SubPayloadMap[T];
      }

      case "spinal trauma": {
        const payload: SubPayloadMap["spinal trauma"] = {
          ...subBase,
          diagnosisName: toLowerCaseArray(indexes.spinalTraumaProvDiag),
          procedureName: toLowerCaseArray(indexes.spinalTraumaProc),
          surgNotes: toOptionalLowerString(indexes.spinalTraumaSurgNotes),
          IntEvents: toOptionalLowerString(indexes.spinalTraumaIntEvents),
        };
        return payload as SubPayloadMap[T];
      }

      case "spinal degenerative diseases": {
        const payload: SubPayloadMap["spinal degenerative diseases"] = {
          ...subBase,
          diagnosisName: toLowerCaseArray(indexes.spDegenDisProvDiag),
          procedureName: toLowerCaseArray(indexes.spDegenDisProc),
          region: toRequiredLowerString(
            indexes.spDegenDisRegion
          ) as SubPayloadMap["spinal degenerative diseases"]["region"],
          surgNotes: toOptionalLowerString(indexes.spDegenDisSurgNotes),
          IntEvents: toOptionalLowerString(indexes.spDegenDisIntEvents),
        };
        return payload as SubPayloadMap[T];
      }

      case "peripheral nerve diseases": {
        const payload: SubPayloadMap["peripheral nerve diseases"] = {
          ...subBase,
          diagnosisName: toLowerCaseArray(indexes.perNerveDisDiag),
          procedureName: toLowerCaseArray(indexes.perNerveDisProc),
          surgNotes: toOptionalLowerString(indexes.perNerveDisSurgNotes),
        };
        return payload as SubPayloadMap[T];
      }

      case "neuro-vascular diseases": {
        const payload: SubPayloadMap["neuro-vascular diseases"] = {
          ...subBase,
          diagnosisName: toLowerCaseArray(indexes.neuroVasDisProvDiag),
          procedureName: toLowerCaseArray(indexes.neuroVasDisProc),
          clinPres: toOptionalLowerString(indexes.neuroVasDisClinPres),
          surgNotes: toOptionalLowerString(indexes.neuroVasDisSurgNotes),
        };
        return payload as SubPayloadMap[T];
      }

      case "csf disorders- other than infantile hydrocephalus": {
        const payload: SubPayloadMap["csf disorders- other than infantile hydrocephalus"] =
          {
            ...subBase,
            diagnosisName: toLowerCaseArray(indexes.csfDiag),
            procedureName: toLowerCaseArray(indexes.csfProcMan),
            surgNotes: toOptionalLowerString(indexes.csfProcSurgNotes),
            IntEvents: toOptionalLowerString(indexes.csfProcIntEvents),
          };
        return payload as SubPayloadMap[T];
      }

      case "functional neurosurgery": {
        const payload: SubPayloadMap["functional neurosurgery"] = {
          ...subBase,
          diagnosisName: toLowerCaseArray(indexes.funcNeuroDiag),
          procedureName: toLowerCaseArray(indexes.funcProcProc),
          surgNotes: toOptionalLowerString(indexes.funcProcSurgNotes),
          IntEvents: toOptionalLowerString(indexes.funcProcIntEvents),
        };
        return payload as SubPayloadMap[T];
      }

      default:
        throw new Error(`Unsupported main diagnosis title: ${mainDiagTitle}`);
    }
  }

  public async updateStatusFromExternal(validatedReq: Partial<IExternalRow>): Promise<ISub[] | any> {
    try {
      const indexes = this.utilService.returnSubIndexes();
      const apiString = this.buildExternalApiString(validatedReq);
      const externalData: IExternalResponse |  never =
        await this.externalService.fetchExternalData(apiString);
      const rawItems: ISubRawData[] = externalData.data.data
      const allSubDocs: ISubDoc[] = await this.subService.getAllSubs();
      const updatedSubDocs: ISubDoc[] = [];
      for(let i: number = 0 ; i < externalData.data.data.length; i++){
        const rawItem:ISubRawData = rawItems[i];
        const rawItemArr = Object.values(rawItem);
        const subDoc = allSubDocs.find((sub) => sub.subGoogleUid === rawItemArr[indexes.subUid]);
        if(subDoc){
          if(rawItemArr[indexes.subStatus] === "Approved" && subDoc.subStatus !== "approved"){
            subDoc.subStatus = "approved";
            await subDoc.save();
            updatedSubDocs.push(subDoc);
          }
          else if(rawItemArr[indexes.subStatus] === "Rejected" && subDoc.subStatus !== "rejected"){
            subDoc.subStatus = "rejected";
            await subDoc.save();
            updatedSubDocs.push(subDoc);

          } 
        }
      }
      return updatedSubDocs;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getCandidateSubmissionsStats(candidateId: string): Promise<{
    totalApproved: number;
    totalRejected: number;
    totalPending: number;
    totalApprovedAndPending: number;
  }> | never {
    try {
      const allSubs = await this.subService.getSubsByCandidateId(candidateId);
      
      const totalApproved = allSubs.filter(sub => sub.subStatus === "approved").length;
      const totalRejected = allSubs.filter(sub => sub.subStatus === "rejected").length;
      const totalPending = allSubs.filter(sub => sub.subStatus === "pending").length;
      const totalApprovedAndPending = totalApproved + totalPending;

      return {
        totalApproved,
        totalRejected,
        totalPending,
        totalApprovedAndPending
      };
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getCandidateSubmissions(candidateId: string): Promise<ISubDoc[]> | never {
    try {
      const subs = await this.subService.getSubsByCandidateId(candidateId);
      return subs;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getSupervisorSubmissions(
    supervisorId: string,
    status?: "approved" | "pending" | "rejected"
  ): Promise<ISubDoc[]> | never {
    try {
      if (status) {
        return await this.subService.getSubsBySupervisorIdAndStatus(supervisorId, status);
      } else {
        return await this.subService.getSubsBySupervisorId(supervisorId);
      }
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getSupervisorSubmissionById(
    supervisorId: string,
    submissionId: string
  ): Promise<ISubDoc | null> | never {
    try {
      // Business logic: Validate ObjectIds
      if (!Types.ObjectId.isValid(submissionId)) {
        throw new Error("Invalid submission ID format");
      }
      if (!Types.ObjectId.isValid(supervisorId)) {
        throw new Error("Invalid supervisor ID format");
      }
      
      const submission = await this.subService.getSubById(submissionId);
      if (!submission) {
        return null;
      }
      
      // Extract supervisor ID - handle both populated (object) and unpopulated (ObjectId) cases
      let submissionSupervisorId: string;
      const supervisorDoc = submission.supervisorDocId as any;
      if (supervisorDoc && typeof supervisorDoc === 'object' && supervisorDoc._id) {
        // Populated document - extract _id
        submissionSupervisorId = supervisorDoc._id.toString();
      } else if (supervisorDoc) {
        // Unpopulated ObjectId - convert directly
        submissionSupervisorId = supervisorDoc.toString();
      } else {
        throw new Error("Submission does not belong to this supervisor");
      }
      
      const matchesSupervisor = submissionSupervisorId === supervisorId;
      
      // Verify submission belongs to the supervisor
      if (!matchesSupervisor) {
        throw new Error("Submission does not belong to this supervisor");
      }
      
      return submission;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getCandidateSubmissionById(
    candidateId: string,
    submissionId: string
  ): Promise<ISubDoc | null> | never {
    try {
      // Business logic: Validate ObjectIds
      if (!Types.ObjectId.isValid(submissionId)) {
        throw new Error("Invalid submission ID format");
      }
      if (!Types.ObjectId.isValid(candidateId)) {
        throw new Error("Invalid candidate ID format");
      }
      
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
        throw new Error("Submission does not belong to this candidate");
      }
      
      const matchesCandidate = submissionCandidateId === candidateId;
      
      // Verify submission belongs to the candidate
      if (!matchesCandidate) {
        throw new Error("Submission does not belong to this candidate");
      }
      
      return submission;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getCandidateSubmissionsBySupervisor(
    supervisorId: string,
    candidateId: string,
    getAll: boolean = false
  ): Promise<ISubDoc[]> | never {
    try {
      // If getAll is true, verify supervisor-candidate relationship first
      if (getAll) {
        const hasRelationship = await this.subService.hasSupervisorCandidateRelationship(
          supervisorId,
          candidateId
        );
        
        if (!hasRelationship) {
          throw new Error("You do not have permission to view this candidate's submissions");
        }
        
        // Return all submissions for the candidate
        const allSubmissions = await this.subService.getSubsByCandidateId(candidateId);
        
        return allSubmissions;
      } else {
        // Return only submissions supervised by the logged-in supervisor (current behavior)
        const submissions = await this.subService.getSubsBySupervisorIdAndCandidateId(supervisorId, candidateId);
        
        return submissions;
      }
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async reviewSubmission(
    supervisorId: string,
    submissionId: string,
    status: "approved" | "rejected",
    review?: string
  ): Promise<ISubDoc> | never {
    try {
      // Validate ObjectIds
      if (!Types.ObjectId.isValid(submissionId)) {
        throw new Error("Invalid submission ID format");
      }
      if (!Types.ObjectId.isValid(supervisorId)) {
        throw new Error("Invalid supervisor ID format");
      }

      // Get submission and verify it belongs to supervisor
      const submission = await this.subService.getSubById(submissionId);
      if (!submission) {
        throw new Error("Submission not found");
      }

      // Extract supervisor ID - handle both populated (object) and unpopulated (ObjectId) cases
      let submissionSupervisorId: string;
      const supervisorDoc = submission.supervisorDocId as any;
      if (supervisorDoc && typeof supervisorDoc === 'object' && supervisorDoc._id) {
        submissionSupervisorId = supervisorDoc._id.toString();
      } else if (supervisorDoc) {
        submissionSupervisorId = supervisorDoc.toString();
      } else {
        throw new Error("Submission does not belong to this supervisor");
      }

      // Verify submission belongs to the supervisor
      if (submissionSupervisorId !== supervisorId) {
        throw new Error("Submission does not belong to this supervisor");
      }

      // Update MongoDB
      const updatedSubmission = await this.subService.updateSubmissionStatus(submissionId, status);
      if (!updatedSubmission) {
        throw new Error("Failed to update submission in database");
      }

      // Re-fetch the submission with all populated fields to ensure we have complete data for email
      const fullyPopulatedSubmission = await this.subService.getSubById(submissionId);
      if (!fullyPopulatedSubmission) {
        throw new Error("Failed to fetch updated submission");
      }

      // Update Google Sheet
      try {
        await this.externalService.updateGoogleSheetReview({
          googleUid: fullyPopulatedSubmission.subGoogleUid,
          status: status === "approved" ? "Approved" : "Rejected"
        });
      } catch (err: any) {
        // Log error but don't fail the entire operation
        // The MongoDB update succeeded, so we continue
      }

      // Send email to candidate
      try {
        const candidate = fullyPopulatedSubmission.candDocId as any;
        const supervisor = fullyPopulatedSubmission.supervisorDocId as any;
        
        if (candidate && candidate.email) {
          const candidateEmail = candidate.email;
          const candidateName = candidate.fullName || "Candidate";
          const supervisorName = (supervisor && supervisor.fullName) ? supervisor.fullName : "Supervisor";
          
          const emailSubject = `Submission ${status === "approved" ? "Approved" : "Rejected"}`;
          const emailHtml = this.getSubmissionReviewEmailHtml(
            candidateName,
            supervisorName,
            fullyPopulatedSubmission,
            status,
            review
          );
          const emailText = this.getSubmissionReviewEmailText(
            candidateName,
            supervisorName,
            fullyPopulatedSubmission,
            status,
            review
          );

          await this.mailerService.sendMail({
            to: candidateEmail,
            subject: emailSubject,
            html: emailHtml,
            text: emailText
          });
        }
      } catch (err: any) {
        // Log error but don't fail the entire operation
        // The MongoDB and Google Sheet updates succeeded
      }

      return fullyPopulatedSubmission;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  private getSubmissionReviewEmailHtml(
    candidateName: string,
    supervisorName: string,
    submission: ISubDoc,
    status: "approved" | "rejected",
    review?: string
  ): string {
    const statusText = status === "approved" ? "Approved" : "Rejected";
    const statusColor = status === "approved" ? "#27ae60" : "#e74c3c";
    
    // Extract all submission data
    const submissionId = (submission as any)._id?.toString() || "N/A";
    const submissionDate = submission.timeStamp ? new Date(submission.timeStamp).toLocaleString() : "N/A";
    const reviewDate = new Date().toLocaleString();
    
    // Candidate information
    const candidate = submission.candDocId as any;
    const candidateRegNum = candidate?.regNum || "N/A";
    const candidateRank = candidate?.rank || "N/A";
    const candidateDegree = candidate?.regDeg || "N/A";
    const candidateEmail = candidate?.email || "N/A";
    const candidatePhone = candidate?.phoneNum || "N/A";
    
    // Supervisor information
    const supervisor = submission.supervisorDocId as any;
    const supervisorEmail = supervisor?.email || "N/A";
    const supervisorPhone = supervisor?.phoneNum || "N/A";
    
    // Procedure details
    const procDoc = submission.procDocId as any;
    const hospital = procDoc?.hospital;
    const hospitalEngName = hospital?.engName || "N/A";
    const hospitalArabName = hospital?.arabName || "N/A";
    const arabProc = procDoc?.arabProc;
    const arabProcTitle = arabProc?.title || "N/A";
    const arabProcNumCode = arabProc?.numCode || "N/A";
    const arabProcAlphaCode = arabProc?.alphaCode || "N/A";
    const arabProcDescription = arabProc?.description || "N/A";
    const procDate = procDoc?.procDate ? new Date(procDoc.procDate).toLocaleDateString() : "N/A";
    const patientName = procDoc?.patientName || "N/A";
    const patientDob = procDoc?.patientDob ? new Date(procDoc.patientDob).toLocaleDateString() : "N/A";
    const patientGender = procDoc?.gender || "N/A";
    const procGoogleUid = procDoc?.google_uid || "N/A";
    
    // Main diagnosis
    const mainDiag = submission.mainDiagDocId as any;
    const mainDiagTitle = mainDiag?.title || "N/A";
    
    // Procedure names
    const procedureNames = submission.procedureName && submission.procedureName.length > 0 
      ? submission.procedureName.join(", ") 
      : "N/A";
    
    // Diagnosis names
    const diagnosisNames = submission.diagnosisName && submission.diagnosisName.length > 0 
      ? submission.diagnosisName.join(", ") 
      : "N/A";
    
    // CPT codes
    const procCptDocs = submission.procCptDocId as any[];
    const cptCodesList = procCptDocs && procCptDocs.length > 0
      ? procCptDocs.map((cpt: any) => 
          `${cpt.numCode} (${cpt.alphaCode}): ${cpt.title} - ${cpt.description || "N/A"}`
        ).join("<br>")
      : "N/A";
    
    // ICD codes
    const icdDocs = submission.icdDocId as any[];
    const icdCodesList = icdDocs && icdDocs.length > 0
      ? icdDocs.map((icd: any) => 
          `${icd.icdCode}: ${icd.icdName}`
        ).join("<br>")
      : "N/A";
    
    // Surgical details
    const roleInSurg = submission.roleInSurg || "N/A";
    const assRoleDesc = submission.assRoleDesc || "N/A";
    const otherSurgRank = submission.otherSurgRank || "N/A";
    const otherSurgName = submission.otherSurgName || "N/A";
    const isItRevSurg = submission.isItRevSurg ? "Yes" : "No";
    const preOpClinCond = submission.preOpClinCond || "N/A";
    const spOrCran = (submission as any).spOrCran || "N/A";
    const position = (submission as any).pos || "N/A";
    const approach = (submission as any).approach || "N/A";
    const clinPres = (submission as any).clinPres || "N/A";
    const region = (submission as any).region || "N/A";
    
    // Instruments and consumables
    const insUsed = submission.insUsed || "N/A";
    const consUsed = submission.consUsed || "N/A";
    const consDetails = submission.consDetails || "N/A";
    
    // Documentation
    const surgNotes = (submission as any).surgNotes || "N/A";
    const intEvents = (submission as any).IntEvents || "N/A";

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Submission ${statusText}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
    <h2 style="color: #2c3e50;">Submission ${statusText}</h2>
    <p>Hello ${candidateName},</p>
    <p>Your submission has been <strong style="color: ${statusColor};">${statusText.toLowerCase()}</strong> by ${supervisorName}.</p>
    
    <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h3 style="color: #2c3e50; margin-top: 0; border-bottom: 2px solid #3498db; padding-bottom: 10px;">Basic Information</h3>
      <p><strong>Submission ID:</strong> ${submissionId}</p>
      <p><strong>Submission Date:</strong> ${submissionDate}</p>
      <p><strong>Submission Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${statusText}</span></p>
      <p><strong>Submission Google UID:</strong> ${submission.subGoogleUid || "N/A"}</p>
      <p><strong>Review Date:</strong> ${reviewDate}</p>
    </div>

    <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h3 style="color: #2c3e50; margin-top: 0; border-bottom: 2px solid #3498db; padding-bottom: 10px;">Candidate Information</h3>
      <p><strong>Name:</strong> ${candidateName}</p>
      <p><strong>Email:</strong> ${candidateEmail}</p>
      <p><strong>Phone:</strong> ${candidatePhone}</p>
      <p><strong>Registration Number:</strong> ${candidateRegNum}</p>
      <p><strong>Rank:</strong> ${candidateRank}</p>
      <p><strong>Degree:</strong> ${candidateDegree}</p>
    </div>

    <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h3 style="color: #2c3e50; margin-top: 0; border-bottom: 2px solid #3498db; padding-bottom: 10px;">Supervisor Information</h3>
      <p><strong>Name:</strong> ${supervisorName}</p>
      <p><strong>Email:</strong> ${supervisorEmail}</p>
      <p><strong>Phone:</strong> ${supervisorPhone}</p>
    </div>

    <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h3 style="color: #2c3e50; margin-top: 0; border-bottom: 2px solid #3498db; padding-bottom: 10px;">Procedure Information</h3>
      <p><strong>Procedure Date:</strong> ${procDate}</p>
      <p><strong>Procedure Google UID:</strong> ${procGoogleUid}</p>
      <p><strong>Hospital (English):</strong> ${hospitalEngName}</p>
      <p><strong>Hospital (Arabic):</strong> ${hospitalArabName}</p>
      <p><strong>Patient Name:</strong> ${patientName}</p>
      <p><strong>Patient Date of Birth:</strong> ${patientDob}</p>
      <p><strong>Patient Gender:</strong> ${patientGender}</p>
      <p><strong>Arabic Procedure Title:</strong> ${arabProcTitle}</p>
      <p><strong>Arabic Procedure NumCode:</strong> ${arabProcNumCode}</p>
      <p><strong>Arabic Procedure AlphaCode:</strong> ${arabProcAlphaCode}</p>
      <p><strong>Arabic Procedure Description:</strong> ${arabProcDescription}</p>
      <p><strong>All Procedure Names:</strong> ${procedureNames}</p>
    </div>

    <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h3 style="color: #2c3e50; margin-top: 0; border-bottom: 2px solid #3498db; padding-bottom: 10px;">CPT Codes</h3>
      <div style="white-space: pre-wrap;">${cptCodesList}</div>
    </div>

    <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h3 style="color: #2c3e50; margin-top: 0; border-bottom: 2px solid #3498db; padding-bottom: 10px;">Diagnosis Information</h3>
      <p><strong>Main Diagnosis:</strong> ${mainDiagTitle}</p>
      <p><strong>All Diagnosis Names:</strong> ${diagnosisNames}</p>
    </div>

    <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h3 style="color: #2c3e50; margin-top: 0; border-bottom: 2px solid #3498db; padding-bottom: 10px;">ICD Codes</h3>
      <div style="white-space: pre-wrap;">${icdCodesList}</div>
    </div>

    <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h3 style="color: #2c3e50; margin-top: 0; border-bottom: 2px solid #3498db; padding-bottom: 10px;">Surgical Details</h3>
      <p><strong>Role in Surgery:</strong> ${roleInSurg}</p>
      ${submission.assRoleDesc ? `<p><strong>Assistant Role Description:</strong> ${assRoleDesc}</p>` : ''}
      <p><strong>Other Surgeon Rank:</strong> ${otherSurgRank}</p>
      <p><strong>Other Surgeon Name:</strong> ${otherSurgName}</p>
      <p><strong>Revision Surgery:</strong> ${isItRevSurg}</p>
      ${submission.preOpClinCond ? `<p><strong>Pre-operative Clinical Condition:</strong> ${preOpClinCond}</p>` : ''}
      ${(submission as any).spOrCran ? `<p><strong>Spinal or Cranial:</strong> ${spOrCran}</p>` : ''}
      ${(submission as any).pos ? `<p><strong>Position:</strong> ${position}</p>` : ''}
      ${(submission as any).approach ? `<p><strong>Approach:</strong> ${approach}</p>` : ''}
      ${(submission as any).clinPres ? `<p><strong>Clinical Presentation:</strong> ${clinPres}</p>` : ''}
      ${(submission as any).region ? `<p><strong>Region:</strong> ${region}</p>` : ''}
    </div>

    <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h3 style="color: #2c3e50; margin-top: 0; border-bottom: 2px solid #3498db; padding-bottom: 10px;">Instruments and Consumables</h3>
      <p><strong>Instruments Used:</strong> ${insUsed}</p>
      <p><strong>Consumables Used:</strong> ${consUsed}</p>
      ${submission.consDetails ? `<p><strong>Consumable Details:</strong> ${consDetails}</p>` : ''}
    </div>

    ${((submission as any).surgNotes || (submission as any).IntEvents) ? `
    <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h3 style="color: #2c3e50; margin-top: 0; border-bottom: 2px solid #3498db; padding-bottom: 10px;">Documentation</h3>
      ${(submission as any).surgNotes ? `<p><strong>Surgical Notes:</strong></p><p style="white-space: pre-wrap; background-color: #f9f9f9; padding: 10px; border-radius: 3px;">${surgNotes}</p>` : ''}
      ${(submission as any).IntEvents ? `<p><strong>Intraoperative Events:</strong></p><p style="white-space: pre-wrap; background-color: #f9f9f9; padding: 10px; border-radius: 3px;">${intEvents}</p>` : ''}
    </div>
    ` : ''}

    ${review ? `
    <div style="background-color: #fff9e6; padding: 15px; border-left: 4px solid #f39c12; border-radius: 5px; margin: 20px 0;">
      <h3 style="color: #2c3e50; margin-top: 0;">Review Comments</h3>
      <p style="white-space: pre-wrap;">${review}</p>
    </div>
    ` : ''}

    <p style="margin-top: 30px; font-size: 12px; color: #7f8c8d;">This is an automated message. Please do not reply to this email.</p>
  </div>
</body>
</html>
    `.trim();
  }

  private getSubmissionReviewEmailText(
    candidateName: string,
    supervisorName: string,
    submission: ISubDoc,
    status: "approved" | "rejected",
    review?: string
  ): string {
    const statusText = status === "approved" ? "Approved" : "Rejected";
    
    // Extract all submission data
    const submissionId = (submission as any)._id?.toString() || "N/A";
    const submissionDate = submission.timeStamp ? new Date(submission.timeStamp).toLocaleString() : "N/A";
    const reviewDate = new Date().toLocaleString();
    
    // Candidate information
    const candidate = submission.candDocId as any;
    const candidateRegNum = candidate?.regNum || "N/A";
    const candidateRank = candidate?.rank || "N/A";
    const candidateDegree = candidate?.regDeg || "N/A";
    const candidateEmail = candidate?.email || "N/A";
    const candidatePhone = candidate?.phoneNum || "N/A";
    
    // Supervisor information
    const supervisor = submission.supervisorDocId as any;
    const supervisorEmail = supervisor?.email || "N/A";
    const supervisorPhone = supervisor?.phoneNum || "N/A";
    
    // Procedure details
    const procDoc = submission.procDocId as any;
    const hospital = procDoc?.hospital;
    const hospitalEngName = hospital?.engName || "N/A";
    const hospitalArabName = hospital?.arabName || "N/A";
    const arabProc = procDoc?.arabProc;
    const arabProcTitle = arabProc?.title || "N/A";
    const arabProcNumCode = arabProc?.numCode || "N/A";
    const arabProcAlphaCode = arabProc?.alphaCode || "N/A";
    const arabProcDescription = arabProc?.description || "N/A";
    const procDate = procDoc?.procDate ? new Date(procDoc.procDate).toLocaleDateString() : "N/A";
    const patientName = procDoc?.patientName || "N/A";
    const patientDob = procDoc?.patientDob ? new Date(procDoc.patientDob).toLocaleDateString() : "N/A";
    const patientGender = procDoc?.gender || "N/A";
    const procGoogleUid = procDoc?.google_uid || "N/A";
    
    // Main diagnosis
    const mainDiag = submission.mainDiagDocId as any;
    const mainDiagTitle = mainDiag?.title || "N/A";
    
    // Procedure names
    const procedureNames = submission.procedureName && submission.procedureName.length > 0 
      ? submission.procedureName.join(", ") 
      : "N/A";
    
    // Diagnosis names
    const diagnosisNames = submission.diagnosisName && submission.diagnosisName.length > 0 
      ? submission.diagnosisName.join(", ") 
      : "N/A";
    
    // CPT codes
    const procCptDocs = submission.procCptDocId as any[];
    const cptCodesList = procCptDocs && procCptDocs.length > 0
      ? procCptDocs.map((cpt: any) => 
          `${cpt.numCode} (${cpt.alphaCode}): ${cpt.title} - ${cpt.description || "N/A"}`
        ).join("\n")
      : "N/A";
    
    // ICD codes
    const icdDocs = submission.icdDocId as any[];
    const icdCodesList = icdDocs && icdDocs.length > 0
      ? icdDocs.map((icd: any) => 
          `${icd.icdCode}: ${icd.icdName}`
        ).join("\n")
      : "N/A";
    
    // Surgical details
    const roleInSurg = submission.roleInSurg || "N/A";
    const assRoleDesc = submission.assRoleDesc || "N/A";
    const otherSurgRank = submission.otherSurgRank || "N/A";
    const otherSurgName = submission.otherSurgName || "N/A";
    const isItRevSurg = submission.isItRevSurg ? "Yes" : "No";
    const preOpClinCond = submission.preOpClinCond || "N/A";
    const spOrCran = (submission as any).spOrCran || "N/A";
    const position = (submission as any).pos || "N/A";
    const approach = (submission as any).approach || "N/A";
    const clinPres = (submission as any).clinPres || "N/A";
    const region = (submission as any).region || "N/A";
    
    // Instruments and consumables
    const insUsed = submission.insUsed || "N/A";
    const consUsed = submission.consUsed || "N/A";
    const consDetails = submission.consDetails || "N/A";
    
    // Documentation
    const surgNotes = (submission as any).surgNotes || "N/A";
    const intEvents = (submission as any).IntEvents || "N/A";

    let text = `Hello ${candidateName},\n\n`;
    text += `Your submission has been ${statusText.toLowerCase()} by ${supervisorName}.\n\n`;
    
    text += `═══════════════════════════════════════════════════════════\n`;
    text += `BASIC INFORMATION\n`;
    text += `═══════════════════════════════════════════════════════════\n`;
    text += `Submission ID: ${submissionId}\n`;
    text += `Submission Date: ${submissionDate}\n`;
    text += `Submission Status: ${statusText}\n`;
    text += `Submission Google UID: ${submission.subGoogleUid || "N/A"}\n`;
    text += `Review Date: ${reviewDate}\n\n`;
    
    text += `═══════════════════════════════════════════════════════════\n`;
    text += `CANDIDATE INFORMATION\n`;
    text += `═══════════════════════════════════════════════════════════\n`;
    text += `Name: ${candidateName}\n`;
    text += `Email: ${candidateEmail}\n`;
    text += `Phone: ${candidatePhone}\n`;
    text += `Registration Number: ${candidateRegNum}\n`;
    text += `Rank: ${candidateRank}\n`;
    text += `Degree: ${candidateDegree}\n\n`;
    
    text += `═══════════════════════════════════════════════════════════\n`;
    text += `SUPERVISOR INFORMATION\n`;
    text += `═══════════════════════════════════════════════════════════\n`;
    text += `Name: ${supervisorName}\n`;
    text += `Email: ${supervisorEmail}\n`;
    text += `Phone: ${supervisorPhone}\n\n`;
    
    text += `═══════════════════════════════════════════════════════════\n`;
    text += `PROCEDURE INFORMATION\n`;
    text += `═══════════════════════════════════════════════════════════\n`;
    text += `Procedure Date: ${procDate}\n`;
    text += `Procedure Google UID: ${procGoogleUid}\n`;
    text += `Hospital (English): ${hospitalEngName}\n`;
    text += `Hospital (Arabic): ${hospitalArabName}\n`;
    text += `Patient Name: ${patientName}\n`;
    text += `Patient Date of Birth: ${patientDob}\n`;
    text += `Patient Gender: ${patientGender}\n`;
    text += `Arabic Procedure Title: ${arabProcTitle}\n`;
    text += `Arabic Procedure NumCode: ${arabProcNumCode}\n`;
    text += `Arabic Procedure AlphaCode: ${arabProcAlphaCode}\n`;
    text += `Arabic Procedure Description: ${arabProcDescription}\n`;
    text += `All Procedure Names: ${procedureNames}\n\n`;
    
    text += `═══════════════════════════════════════════════════════════\n`;
    text += `CPT CODES\n`;
    text += `═══════════════════════════════════════════════════════════\n`;
    text += `${cptCodesList}\n\n`;
    
    text += `═══════════════════════════════════════════════════════════\n`;
    text += `DIAGNOSIS INFORMATION\n`;
    text += `═══════════════════════════════════════════════════════════\n`;
    text += `Main Diagnosis: ${mainDiagTitle}\n`;
    text += `All Diagnosis Names: ${diagnosisNames}\n\n`;
    
    text += `═══════════════════════════════════════════════════════════\n`;
    text += `ICD CODES\n`;
    text += `═══════════════════════════════════════════════════════════\n`;
    text += `${icdCodesList}\n\n`;
    
    text += `═══════════════════════════════════════════════════════════\n`;
    text += `SURGICAL DETAILS\n`;
    text += `═══════════════════════════════════════════════════════════\n`;
    text += `Role in Surgery: ${roleInSurg}\n`;
    if (submission.assRoleDesc) {
      text += `Assistant Role Description: ${assRoleDesc}\n`;
    }
    text += `Other Surgeon Rank: ${otherSurgRank}\n`;
    text += `Other Surgeon Name: ${otherSurgName}\n`;
    text += `Revision Surgery: ${isItRevSurg}\n`;
    if (submission.preOpClinCond) {
      text += `Pre-operative Clinical Condition: ${preOpClinCond}\n`;
    }
    if ((submission as any).spOrCran) {
      text += `Spinal or Cranial: ${spOrCran}\n`;
    }
    if ((submission as any).pos) {
      text += `Position: ${position}\n`;
    }
    if ((submission as any).approach) {
      text += `Approach: ${approach}\n`;
    }
    if ((submission as any).clinPres) {
      text += `Clinical Presentation: ${clinPres}\n`;
    }
    if ((submission as any).region) {
      text += `Region: ${region}\n`;
    }
    text += `\n`;
    
    text += `═══════════════════════════════════════════════════════════\n`;
    text += `INSTRUMENTS AND CONSUMABLES\n`;
    text += `═══════════════════════════════════════════════════════════\n`;
    text += `Instruments Used: ${insUsed}\n`;
    text += `Consumables Used: ${consUsed}\n`;
    if (submission.consDetails) {
      text += `Consumable Details: ${consDetails}\n`;
    }
    text += `\n`;
    
    if ((submission as any).surgNotes || (submission as any).IntEvents) {
      text += `═══════════════════════════════════════════════════════════\n`;
      text += `DOCUMENTATION\n`;
      text += `═══════════════════════════════════════════════════════════\n`;
      if ((submission as any).surgNotes) {
        text += `Surgical Notes:\n${surgNotes}\n\n`;
      }
      if ((submission as any).IntEvents) {
        text += `Intraoperative Events:\n${intEvents}\n\n`;
      }
    }
    
    if (review) {
      text += `═══════════════════════════════════════════════════════════\n`;
      text += `REVIEW COMMENTS\n`;
      text += `═══════════════════════════════════════════════════════════\n`;
      text += `${review}\n\n`;
    }
    
    text += `This is an automated message. Please do not reply to this email.`;
    
    return text;
  }

  public async generateSurgicalNotesForSubmission(
    submissionId: string
  ): Promise<{ surgicalNotes: string }> | never {
    try {
      // Validate ObjectId
      if (!Types.ObjectId.isValid(submissionId)) {
        throw new Error("Invalid submission ID format");
      }

      // Get populated submission
      const submission = await this.subService.getSubById(submissionId);
      if (!submission) {
        throw new Error("Submission not found");
      }

      // Generate surgical notes using AI agent
      const result = await this.aiAgentProvider.generateSurgicalNotes({
        submission: submission
      });

      return result;
    } catch (err: any) {
      throw new Error(err.message || "Failed to generate surgical notes");
    }
  }

  /**
   * Filters out submissions that already exist in the database (by subGoogleUid)
   * @param subs - Array of submissions to check
   * @returns Array of unique submissions that don't exist yet
   */
  private async filterDuplicateSubs(subs: ISub[]): Promise<ISub[]> {
    try {
      // Extract all subGoogleUids from the submissions array, handling undefined/null values
      const subGoogleUids: string[] = [];
      for (const sub of subs) {
        const uid = sub.subGoogleUid;
        if (uid && typeof uid === 'string' && uid.trim() !== "") {
          subGoogleUids.push(uid.trim());
        }
      }

      if (subGoogleUids.length === 0) {
        // If no subGoogleUids, return all (they might be new entries without uids)
        return subs;
      }

      // Find all existing submissions with these subGoogleUids in one query
      const existingSubs = await this.subService.findSubsBySubGoogleUids(subGoogleUids);
      const existingUidsSet = new Set<string>();
      for (const sub of existingSubs) {
        const uid = sub.subGoogleUid;
        if (uid && typeof uid === 'string' && uid.trim() !== "") {
          existingUidsSet.add(uid.trim());
        }
      }

      // Filter out submissions that already exist
      const uniqueSubs = subs.filter(sub => {
        const uid = sub.subGoogleUid;
        if (!uid || typeof uid !== 'string' || uid.trim() === "") {
          // If no subGoogleUid, include it (might be a new entry)
          return true;
        }
        // Only include if it doesn't exist in the database
        return !existingUidsSet.has(uid.trim());
      });

      return uniqueSubs;
    } catch (err: any) {
      throw new Error(`Failed to filter duplicate submissions: ${err.message}`);
    }
  }
}