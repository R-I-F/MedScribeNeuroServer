import { injectable, inject } from "inversify";
import { DataSource } from "typeorm";
import crypto from "crypto";
import { ExternalService } from "../externalService/external.service";
import { IExternalRow } from "../arabProc/interfaces/IExternalRow.interface";
import { UtilService } from "../utils/utils.service";
import { CandService } from "../cand/cand.service";
import { CalSurgService } from "../calSurg/calSurg.service";
import { SupervisorService } from "../supervisor/supervisor.service";
import { MainDiagService } from "../mainDiag/mainDiag.service";
import { ProcCptService } from "../procCpt/procCpt.service";
import { DiagnosisService } from "../diagnosis/diagnosis.service";
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
// Removed: import { Types } from "mongoose"; - Now using UUIDs directly for MariaDB
import { SubService } from "./sub.service";
import { IExternalResponse } from "../externalService/external.interface";
import { MailerService } from "../mailer/mailer.service";
import { AiAgentProvider } from "../aiAgent/aiAgent.provider";
import { UserRole } from "../types/role.types";

/** Frontend path for supervisor submission review (base URL from FRONTEND_URL env). Note: "a-ins" was removed from supervisor dashboard routes on the frontend. */
const SUBMISSION_REVIEW_PATH = "/dashboard/supervisor/submissions";

/** Role in surgery: raw value (lowercase) → display label for analytics */
const ROLE_LABELS: Record<string, string> = {
  operator: "Operator",
  "operator with supervisor scrubbed (assisted)": "Operator (Assisted)",
  "supervising, teaching a junior colleague (scrubbed)": "Supervising",
  assistant: "Assistant",
  "observer (scrubbed)": "Observer",
};

const ROLE_ORDER = ["Operator", "Operator (Assisted)", "Supervising", "Assistant", "Observer"];

function getRoleLabel(roleInSurg: string | undefined): string {
  if (!roleInSurg || typeof roleInSurg !== "string") return "Other";
  const normalized = roleInSurg.trim().toLowerCase();
  return ROLE_LABELS[normalized] ?? roleInSurg.trim();
}

@injectable()
export class SubProvider {
  // UUID validation regex
  private readonly uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  constructor(
    @inject(ExternalService) private externalService: ExternalService,
    @inject(UtilService) private utilService: UtilService,
    @inject(SubService) private subService: SubService,
    @inject(MailerService) private mailerService: MailerService,
    @inject(AiAgentProvider) private aiAgentProvider: AiAgentProvider,
    @inject(ProcCptService) private procCptService: ProcCptService,
    @inject(DiagnosisService) private diagnosisService: DiagnosisService,
    @inject(MainDiagService) private mainDiagService: MainDiagService,
    @inject(CalSurgService) private calSurgService: CalSurgService,
    @inject(CandService) private candService: CandService,
    @inject(SupervisorService) private supervisorService: SupervisorService
  ) {}

  public async createSubFromExternal(
    validatedReq: Partial<IExternalRow>,
    dataSource: DataSource
  ): Promise<ISub[] | any> {
    try {
      const apiString = this.buildExternalApiString(validatedReq);
      const externalData =
        await this.externalService.fetchExternalData(apiString);

      if (!externalData?.success) {
        const message = (externalData?.data as { error?: string } | undefined)?.error ?? "External data fetch failed";
        throw new Error(message);
      }

      if (!Array.isArray(externalData?.data?.data)) {
        return [];
      }

      // When startRow is set, keep only rows from that index (1-based → 0-based slice)
      const startRow = validatedReq.startRow;
      if (startRow != null && startRow > 1) {
        externalData.data.data = externalData.data.data.slice(startRow - 1);
      }

      return await this.processExternalData(externalData, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  private buildExternalApiString(validatedReq: Partial<IExternalRow>): string {
    // When startRow is set we fetch full sheet and slice later
    if (validatedReq.row && !validatedReq.startRow) {
      return `${process.env.GETTER_API_ENDPOINT}?spreadsheetName=neuroLogResponses&sheetName=Form%20Responses%201&row=${validatedReq.row}`;
    }
    return `${process.env.GETTER_API_ENDPOINT}?spreadsheetName=neuroLogResponses&sheetName=Form%20Responses%201`;
  }

  private async processExternalData(externalData: any, dataSource: DataSource): Promise<ISubDoc[]> {
    // Use candService instead of direct Mongoose model (cand is now MariaDB)
    const cands = await this.candService.getAllCandidates(dataSource);
    // Note: cand now uses UUID (id), but sub still uses MongoDB ObjectId
    // Create map with email -> cand for lookup
    const candsMap: Map<string, ICandDoc> = new Map(
      cands.map((c: any) => [c.email, c])
    );

    // Use calSurgService instead of direct Mongoose model (calSurg is now MariaDB)
    const calSurgs = await this.calSurgService.getAllCalSurg(dataSource);
    // Note: calSurg now uses UUID (id), but sub still uses MongoDB ObjectId
    // Create map with google_uid -> calSurg for lookup
    const calSurgsMap = new Map(calSurgs.map((c: any) => [c.google_uid, c]));

    // Use supervisorService instead of direct Mongoose model (supervisor is now MariaDB)
    const supervisors = await this.supervisorService.getAllSupervisors(dataSource);
    // Note: supervisor now uses UUID (id), but sub still uses MongoDB ObjectId
    // Create map with fullName -> supervisor for lookup
    const supervisorsMap = new Map(supervisors.map((s: any) => [s.fullName, s]));

    // Use mainDiagService instead of direct Mongoose model (mainDiag is now MariaDB)
    const mainDiags = await this.mainDiagService.getAllMainDiags(dataSource);
    // Note: mainDiag now uses UUID (id), but sub still uses MongoDB ObjectId
    // Create map with title -> mainDiag for lookup
    const mainDiagsMap = new Map(mainDiags.map((m: any) => [m.title, m]));

    // Use procCptService instead of direct Mongoose model (procCpt is now MariaDB)
    const procCpts = await this.procCptService.getAllProcCpts(dataSource);
    // Note: procCpt now uses UUID (id), but sub still uses MongoDB ObjectId
    // Create map with numCode -> procCpt for lookup
    const procCptsMap = new Map(procCpts.map((p) => [p.numCode, p]));

    // Use diagnosisService instead of direct Mongoose model (diagnosis is now MariaDB)
    const diagnoses = await this.diagnosisService.getAllDiagnoses(dataSource);
    // Note: diagnosis now uses UUID (id), but sub still uses MongoDB ObjectId
    // Create map with icdCode -> diagnosis for lookup
    const diagnosesMap = new Map(diagnoses.map((d) => [d.icdCode, d]));

    const subPayloads: ISub[] = [];
    const indexes = this.utilService.returnSubIndexes();

    for (let i = 0; i < externalData.data.data.length; i++) {
      const rawItem: ISubRawData = externalData.data.data[i];
      const rawItemArr = Object.values(rawItem);
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
      // Use UUID directly for MariaDB
      const procDocIds = procCodes
        .map((code) => {
          const procCpt = procCptsMap.get(code);
          if (procCpt && procCpt.id) {
            return procCpt.id; // UUID string
          }
          return null;
        })
        .filter((id): id is string => Boolean(id));

      const icdCodes = this.utilService.extractCodes(
        rawItemArr[indexes.icd],
        ", "
      );
      // Use UUID directly for MariaDB
      const icdDocIds = icdCodes
        .map((code) => {
          const diagnosis = diagnosesMap.get(code);
          if (diagnosis && diagnosis.id) {
            return diagnosis.id; // UUID string
          }
          return null;
        })
        .filter((id): id is string => Boolean(id));

      const subBase: ISubBase = {
        timeStamp: this.utilService.stringToDateConverter(
          rawItemArr[indexes.timeStamp]
        ),
        submissionType: "candidate",
        // Use UUID directly for MariaDB
        candDocId: (() => {
          const cand = candsMap.get(rawItemArr[indexes.candEmail]);
          if (cand && cand.id) {
            return cand.id; // UUID string
          }
          return undefined as any;
        })(),
        // Use UUID directly for MariaDB
        procDocId: (() => {
          const calSurg = calSurgsMap.get(rawItemArr[indexes.procUid]);
          if (calSurg && calSurg.id) {
            return calSurg.id; // UUID string
          }
          return undefined as any;
        })(),
        // Use UUID directly for MariaDB
        supervisorDocId: (() => {
          const supervisor = supervisorsMap.get(rawItemArr[indexes.superEmail]);
          if (supervisor && (supervisor.id || (supervisor as any)._id)) {
            const supervisorId = supervisor.id || (supervisor as any)._id?.toString();
            if (supervisorId) {
              return supervisorId; // UUID string
            }
          }
          return undefined as any;
        })(),
        roleInSurg: this.utilService.stringToLowerCaseTrimUndefined(
          rawItemArr[indexes.roleInProc]
        ) as TRoleInSurg,
        assRoleDesc,
        otherSurgRank: (this.utilService.stringToLowerCaseTrimUndefined(
          rawItemArr[indexes.otherSurg] ?? ""
        ) ?? "") as TOtherSurgRank,
        otherSurgName: (this.utilService.stringToLowerCaseTrimUndefined(
          rawItemArr[indexes.nameOtherSurg] ?? ""
        ) ?? "") as string,
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
        // Use UUID directly for MariaDB
        mainDiagDocId: (() => {
          const mainDiag = mainDiagsMap.get(mainDiagTitle);
          if (mainDiag && mainDiag.id) {
            return mainDiag.id; // UUID string
          }
          return undefined;
        })(),
        subGoogleUid: (() => {
          const raw = rawItemArr[indexes.subUid];
          const s = typeof raw === "string" ? raw.trim() : "";
          return s === "" ? null : s;
        })(),
        subStatus: this.utilService.normalizeSubStatus(
          rawItemArr[indexes.subStatus]
        ) as TSubStatus,
        procCptDocId: procDocIds,
        icdDocId: icdDocIds,
      };

      // console.log("google uid ", subBase.subGoogleUid)

      // Only create submission if all required fields are present (subGoogleUid optional; stored as null when missing)
      if (
        subBase.candDocId &&
        subBase.procDocId &&
        subBase.supervisorDocId &&
        subBase.mainDiagDocId
      ) {
        const subPayload = this.returnSubPayload(
          mainDiagTitle,
          subBase,
          rawItemArr,
          indexes
        );

        subPayloads.push(subPayload);
      } else {
        const reasons: string[] = [];
        if (!subBase.candDocId) reasons.push(`candidate not found (email: ${String(rawItemArr[indexes.candEmail] ?? "")})`);
        if (!subBase.procDocId) reasons.push(`procedure/calSurg not found (procUid: ${String(rawItemArr[indexes.procUid] ?? "")})`);
        if (!subBase.supervisorDocId) reasons.push(`supervisor not found (index 3 value: ${String(rawItemArr[indexes.superEmail] ?? "")})`);
        if (!subBase.mainDiagDocId) reasons.push(`mainDiag not found (title: ${String(mainDiagTitle ?? "")})`);
        console.warn(`[sub external import] Row ${i} skipped: ${reasons.join("; ")}`);
      }
    }
    try {
      // External import: no duplicate check by subGoogleUid; insert all rows that have required fields
      const uniqueSubs = subPayloads;

      if (uniqueSubs.length === 0) {
        return [];
      }
      const maxBatchSize = 1000;
      if (uniqueSubs.length > maxBatchSize) {
        throw new Error(`Bulk import exceeds maximum batch size of ${maxBatchSize}`);
      }
      const response = await this.subService.createBulkSub(uniqueSubs, dataSource);
      return response;
      
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  /**
   * Create a single submission by an authenticated candidate.
   * Candidate ID is taken from JWT; all other data from validated request body.
   */
  public async createSubmissionByCandidate(
    candidateId: string,
    body: {
      procDocId: string;
      supervisorDocId: string;
      mainDiagDocId: string;
      roleInSurg: string;
      otherSurgRank: string;
      otherSurgName: string;
      isItRevSurg: boolean;
      insUsed: string;
      consUsed: string;
      diagnosisName: string[];
      procedureName: string[];
      assRoleDesc?: string;
      preOpClinCond?: string;
      consDetails?: string;
      surgNotes?: string;
      IntEvents?: string;
      spOrCran?: string;
      pos?: string;
      approach?: string;
      clinPres?: string;
      region?: string;
    },
    dataSource: DataSource,
    institutionId?: string
  ): Promise<ISubDoc> {
    // Submission limits per procedure: max 2 per procDocId, no duplicate roleInSurg
    const existing = await this.subService.getSubsByCandidateIdAndProcDocId(
      candidateId,
      body.procDocId,
      dataSource
    );
    if (existing.length >= 2) {
      throw new Error(
        "This procedure already has 2 submissions from you. You cannot add more entries for this procedure."
      );
    }
    if (existing.length === 1) {
      const normalizedRole = this.utilService.stringToLowerCaseTrim(body.roleInSurg);
      const existingRole = (existing[0] as any).roleInSurg ?? "";
      if (normalizedRole === existingRole) {
        throw new Error(
          "You have already submitted an entry for this procedure with this role. Please select a different role (e.g. Assistant, Observer) for this submission."
        );
      }
    }

    const mainDiag = await this.mainDiagService.getMainDiagById(
      { id: body.mainDiagDocId },
      dataSource
    );
    if (!mainDiag) {
      throw new Error("Main diagnosis not found");
    }

    // Derive CPT and ICD document IDs from the selected diagnosis/procedure labels and main diagnosis config.
    const mainDiagAny = mainDiag as any;
    const normalize = (s: string) => this.utilService.stringToLowerCaseTrim(String(s));

    // Build diagnosis map: check icdName first, then neuroLogName array, then icdCode as fallback
    const diagTitleToId = new Map<string, string>();
    for (const d of mainDiagAny.diagnosis ?? []) {
      if (!d.id) continue;
      
      // Primary: icdName
      if (d.icdName) {
        diagTitleToId.set(normalize(d.icdName), d.id as string);
      }
      
      // Secondary: neuroLogName array (if exists)
      if (Array.isArray(d.neuroLogName)) {
        for (const altName of d.neuroLogName) {
          if (altName && typeof altName === "string") {
            diagTitleToId.set(normalize(altName), d.id as string);
          }
        }
      }
      
      // Fallback: icdCode
      if (d.icdCode && !diagTitleToId.has(normalize(d.icdCode))) {
        diagTitleToId.set(normalize(d.icdCode), d.id as string);
      }
    }

    // Build procedure map: check title first, then description as fallback
    const procTitleToId = new Map<string, string>();
    for (const p of mainDiagAny.procs ?? []) {
      if (!p.id) continue;
      
      // Primary: title
      if (p.title) {
        procTitleToId.set(normalize(p.title), p.id as string);
      }
      
      // Fallback: description (if title doesn't exist or as additional match)
      if (p.description && !procTitleToId.has(normalize(p.description))) {
        procTitleToId.set(normalize(p.description), p.id as string);
      }
    }

    const icdDocIds: string[] = [];
    for (const name of body.diagnosisName || []) {
      const normalizedName = normalize(name);
      const id = diagTitleToId.get(normalizedName);
      if (id && !icdDocIds.includes(id)) {
        icdDocIds.push(id);
      }
    }

    const procCptDocIds: string[] = [];
    for (const name of body.procedureName || []) {
      const normalizedName = normalize(name);
      const id = procTitleToId.get(normalizedName);
      if (id && !procCptDocIds.includes(id)) {
        procCptDocIds.push(id);
      }
    }

    const toOpt = (s: string | undefined) =>
      s != null && typeof s === "string" && s.trim().length > 0
        ? this.utilService.stringToLowerCaseTrimUndefined(s.trim())
        : undefined;
    const toReq = (s: string) => this.utilService.stringToLowerCaseTrim(s);
    const toArr = (arr: string[] | undefined) =>
      (arr || []).map((s) => (typeof s === "string" ? toReq(String(s)) : ""));

    const subBase: ISubBase = {
      timeStamp: new Date(),
      submissionType: "candidate",
      candDocId: candidateId,
      procDocId: body.procDocId,
      supervisorDocId: body.supervisorDocId,
      roleInSurg: toReq(body.roleInSurg) as TRoleInSurg,
      assRoleDesc: toOpt(body.assRoleDesc),
      otherSurgRank: toReq(body.otherSurgRank) as TOtherSurgRank,
      otherSurgName: toReq(body.otherSurgName),
      isItRevSurg: Boolean(body.isItRevSurg),
      preOpClinCond: toOpt(body.preOpClinCond),
      insUsed: toReq(body.insUsed) as TInsUsed,
      consUsed: toReq(body.consUsed) as TConsUsed,
      consDetails: toOpt(body.consDetails),
      mainDiagDocId: body.mainDiagDocId,
      subStatus: "pending" as TSubStatus,
      procCptDocId: procCptDocIds,
      icdDocId: icdDocIds,
    };

    const diagnosisName = toArr(body.diagnosisName);
    const procedureName = toArr(body.procedureName);
    const payload: ISub = {
      ...subBase,
      diagnosisName,
      procedureName,
      surgNotes: toOpt(body.surgNotes),
      IntEvents: toOpt(body.IntEvents),
      spOrCran: body.spOrCran ? (toReq(body.spOrCran) as "spinal" | "cranial") : undefined,
      pos: body.pos ? (toReq(body.pos) as "supine" | "prone" | "lateral" | "concorde" | "other") : undefined,
      approach: toOpt(body.approach),
      clinPres: toOpt(body.clinPres),
      region: body.region ? (toReq(body.region) as "craniocervical" | "cervical" | "dorsal" | "lumbar") : undefined,
    } as ISub;

    const savedSub = await this.subService.createOneSub(payload, dataSource);

    // Notify supervisor to review in background (do not block API response)
    void this.sendSupervisorNewSubmissionEmail(savedSub, dataSource, institutionId, body.supervisorDocId);

    return savedSub;
  }

  /**
   * Create a single submission by an authenticated supervisor.
   * Supervisor ID is taken from JWT (they are the surgeon); no candidate, auto-approved.
   */
  public async createSubmissionBySupervisor(
    supervisorId: string,
    body: {
      procDocId: string;
      mainDiagDocId: string;
      roleInSurg: string;
      otherSurgRank: string;
      otherSurgName: string;
      isItRevSurg: boolean;
      insUsed: string;
      consUsed: string;
      diagnosisName: string[];
      procedureName: string[];
      assRoleDesc?: string;
      preOpClinCond?: string;
      consDetails?: string;
      surgNotes?: string;
      IntEvents?: string;
      spOrCran?: string;
      pos?: string;
      approach?: string;
      clinPres?: string;
      region?: string;
    },
    dataSource: DataSource
  ): Promise<ISubDoc> {
    const mainDiag = await this.mainDiagService.getMainDiagById(
      { id: body.mainDiagDocId },
      dataSource
    );
    if (!mainDiag) {
      throw new Error("Main diagnosis not found");
    }

    const mainDiagAny = mainDiag as any;
    const normalize = (s: string) => this.utilService.stringToLowerCaseTrim(String(s));

    const diagTitleToId = new Map<string, string>();
    for (const d of mainDiagAny.diagnosis ?? []) {
      if (!d.id) continue;
      if (d.icdName) diagTitleToId.set(normalize(d.icdName), d.id as string);
      if (Array.isArray(d.neuroLogName)) {
        for (const altName of d.neuroLogName) {
          if (altName && typeof altName === "string") diagTitleToId.set(normalize(altName), d.id as string);
        }
      }
      if (d.icdCode && !diagTitleToId.has(normalize(d.icdCode))) diagTitleToId.set(normalize(d.icdCode), d.id as string);
    }

    const procTitleToId = new Map<string, string>();
    for (const p of mainDiagAny.procs ?? []) {
      if (!p.id) continue;
      if (p.title) procTitleToId.set(normalize(p.title), p.id as string);
      if (p.description && !procTitleToId.has(normalize(p.description))) procTitleToId.set(normalize(p.description), p.id as string);
    }

    const icdDocIds: string[] = [];
    for (const name of body.diagnosisName || []) {
      const id = diagTitleToId.get(normalize(name));
      if (id && !icdDocIds.includes(id)) icdDocIds.push(id);
    }

    const procCptDocIds: string[] = [];
    for (const name of body.procedureName || []) {
      const id = procTitleToId.get(normalize(name));
      if (id && !procCptDocIds.includes(id)) procCptDocIds.push(id);
    }

    const toOpt = (s: string | undefined) =>
      s != null && typeof s === "string" && s.trim().length > 0
        ? this.utilService.stringToLowerCaseTrimUndefined(s.trim())
        : undefined;
    const toReq = (s: string) => this.utilService.stringToLowerCaseTrim(s);
    const toArr = (arr: string[] | undefined) =>
      (arr || []).map((s) => (typeof s === "string" ? toReq(String(s)) : ""));

    const subBase: ISubBase = {
      timeStamp: new Date(),
      submissionType: "supervisor",
      candDocId: null,
      procDocId: body.procDocId,
      supervisorDocId: supervisorId,
      roleInSurg: toReq(body.roleInSurg) as TRoleInSurg,
      assRoleDesc: toOpt(body.assRoleDesc),
      otherSurgRank: toReq(body.otherSurgRank) as TOtherSurgRank,
      otherSurgName: toReq(body.otherSurgName),
      isItRevSurg: Boolean(body.isItRevSurg),
      preOpClinCond: toOpt(body.preOpClinCond),
      insUsed: toReq(body.insUsed) as TInsUsed,
      consUsed: toReq(body.consUsed) as TConsUsed,
      consDetails: toOpt(body.consDetails),
      mainDiagDocId: body.mainDiagDocId,
      subStatus: "approved" as TSubStatus,
      procCptDocId: procCptDocIds,
      icdDocId: icdDocIds,
    };

    const diagnosisName = toArr(body.diagnosisName);
    const procedureName = toArr(body.procedureName);
    const payload: ISub = {
      ...subBase,
      diagnosisName,
      procedureName,
      surgNotes: toOpt(body.surgNotes),
      IntEvents: toOpt(body.IntEvents),
      spOrCran: body.spOrCran ? (toReq(body.spOrCran) as "spinal" | "cranial") : undefined,
      pos: body.pos ? (toReq(body.pos) as "supine" | "prone" | "lateral" | "concorde" | "other") : undefined,
      approach: toOpt(body.approach),
      clinPres: toOpt(body.clinPres),
      region: body.region ? (toReq(body.region) as "craniocervical" | "cervical" | "dorsal" | "lumbar") : undefined,
    } as ISub;

    return await this.subService.createOneSub(payload, dataSource);
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

  public async updateStatusFromExternal(validatedReq: Partial<IExternalRow>, dataSource: DataSource): Promise<ISub[] | any> {
    try {
      const indexes = this.utilService.returnSubIndexes();
      const apiString = this.buildExternalApiString(validatedReq);
      const externalData = await this.externalService.fetchExternalData(apiString);

      if (!externalData?.success) {
        const message = (externalData?.data as { error?: string } | undefined)?.error ?? "External data fetch failed";
        throw new Error(message);
      }
      const rawItems: ISubRawData[] = Array.isArray(externalData?.data?.data) ? externalData.data.data : [];
      const allSubDocs: ISubDoc[] = await this.subService.getAllSubs(dataSource);
      const updatedSubDocs: ISubDoc[] = [];
      for (let i: number = 0; i < rawItems.length; i++) {
        const rawItem:ISubRawData = rawItems[i];
        const rawItemArr = Object.values(rawItem);
        const subDoc = allSubDocs.find((sub) => sub.subGoogleUid === rawItemArr[indexes.subUid]);
        if(subDoc){
          if(rawItemArr[indexes.subStatus] === "Approved" && subDoc.subStatus !== "approved"){
            const updatedSub = await this.subService.updateSubmissionStatus(subDoc.id, "approved", dataSource);
            if (updatedSub) {
              updatedSubDocs.push(updatedSub);
            }
          }
          else if(rawItemArr[indexes.subStatus] === "Rejected" && subDoc.subStatus !== "rejected"){
            const updatedSub = await this.subService.updateSubmissionStatus(subDoc.id, "rejected", dataSource);
            if (updatedSub) {
              updatedSubDocs.push(updatedSub);
            }
          } 
        }
      }
      return updatedSubDocs;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getCandidateSubmissionsStats(candidateId: string, dataSource: DataSource): Promise<{
    totalApproved: number;
    totalRejected: number;
    totalPending: number;
    totalApprovedAndPending: number;
  }> | never {
    try {
      const allSubs = await this.subService.getSubsByCandidateId(candidateId, dataSource);
      
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

  public async getCptAnalytics(
    userId: string,
    role: string,
    dataSource: DataSource
  ): Promise<{
    totalApprovedSubmissions: number;
    items: {
      cptCode: string;
      alphaCode: string;
      title: string;
      total: { count: number; percentage: number };
      byRole: { role: string; count: number; percentage: number }[];
    }[];
  }> | never {
    try {
      let approved: ISubDoc[] = [];
      if (role === UserRole.CANDIDATE) {
        approved = await this.subService.getSubsByCandidateIdAndStatus(userId, "approved", dataSource);
      } else if (role === UserRole.SUPERVISOR) {
        approved = await this.subService.getSubsBySupervisorIdAndStatus(userId, "approved", dataSource);
      }
      const totalApproved = approved.length;
      // map: cptCode -> { alphaCode, title, byRoleLabel: { roleLabel: count } }
      const map = new Map<string, { alphaCode: string; title: string; byRole: Record<string, number> }>();
      for (const sub of approved) {
        const procs = (sub as any).procCpts ?? [];
        const roleLabel = getRoleLabel((sub as any).roleInSurg);
        const seen = new Set<string>();
        for (const p of procs) {
          const code = p?.numCode ?? String(p);
          if (!code || seen.has(code)) continue;
          seen.add(code);
          let cur = map.get(code);
          if (!cur) {
            cur = { alphaCode: p?.alphaCode ?? "", title: p?.title ?? "", byRole: {} };
            map.set(code, cur);
          }
          cur.byRole[roleLabel] = (cur.byRole[roleLabel] ?? 0) + 1;
        }
      }
      const items = Array.from(map.entries())
        .map(([cptCode, v]) => {
          const totalCount = Object.values(v.byRole).reduce((a, b) => a + b, 0);
          const totalPct = totalApproved > 0 ? Math.round((totalCount / totalApproved) * 10000) / 100 : 0;
          const byRole = ROLE_ORDER.map((r) => {
            const count = v.byRole[r] ?? 0;
            const pct = totalCount > 0 ? Math.round((count / totalCount) * 10000) / 100 : 0;
            return { role: r, count, percentage: pct };
          }).filter((x) => x.count > 0);
          // Append any roles not in ROLE_ORDER (e.g. "Other")
          for (const [roleLabel, count] of Object.entries(v.byRole)) {
            if (!ROLE_ORDER.includes(roleLabel)) {
              const pct = totalCount > 0 ? Math.round((count / totalCount) * 10000) / 100 : 0;
              byRole.push({ role: roleLabel, count, percentage: pct });
            }
          }
          return {
            cptCode,
            alphaCode: v.alphaCode,
            title: v.title,
            total: { count: totalCount, percentage: totalPct },
            byRole,
          };
        })
        .sort((a, b) => b.total.count - a.total.count);
      return { totalApprovedSubmissions: totalApproved, items };
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getIcdAnalytics(
    userId: string,
    role: string,
    dataSource: DataSource
  ): Promise<{
    totalApprovedSubmissions: number;
    items: {
      icdCode: string;
      icdName: string;
      total: { count: number; percentage: number };
      byRole: { role: string; count: number; percentage: number }[];
    }[];
  }> | never {
    try {
      let approved: ISubDoc[] = [];
      if (role === UserRole.CANDIDATE) {
        approved = await this.subService.getSubsByCandidateIdAndStatus(userId, "approved", dataSource);
      } else if (role === UserRole.SUPERVISOR) {
        approved = await this.subService.getSubsBySupervisorIdAndStatus(userId, "approved", dataSource);
      }
      const totalApproved = approved.length;
      // map: icdCode -> { icdName, byRole: { roleLabel: count } }
      const map = new Map<string, { icdName: string; byRole: Record<string, number> }>();
      for (const sub of approved) {
        const icds = (sub as any).icds ?? [];
        const roleLabel = getRoleLabel((sub as any).roleInSurg);
        const seen = new Set<string>();
        for (const d of icds) {
          const code = d?.icdCode ?? String(d);
          if (!code || seen.has(code)) continue;
          seen.add(code);
          let cur = map.get(code);
          if (!cur) {
            cur = { icdName: d?.icdName ?? "", byRole: {} };
            map.set(code, cur);
          }
          cur.byRole[roleLabel] = (cur.byRole[roleLabel] ?? 0) + 1;
        }
      }
      const items = Array.from(map.entries())
        .map(([icdCode, v]) => {
          const totalCount = Object.values(v.byRole).reduce((a, b) => a + b, 0);
          const totalPct = totalApproved > 0 ? Math.round((totalCount / totalApproved) * 10000) / 100 : 0;
          const byRole = ROLE_ORDER.map((r) => {
            const count = v.byRole[r] ?? 0;
            const pct = totalCount > 0 ? Math.round((count / totalCount) * 10000) / 100 : 0;
            return { role: r, count, percentage: pct };
          }).filter((x) => x.count > 0);
          // Append any roles not in ROLE_ORDER (e.g. "Other")
          for (const [roleLabel, count] of Object.entries(v.byRole)) {
            if (!ROLE_ORDER.includes(roleLabel)) {
              const pct = totalCount > 0 ? Math.round((count / totalCount) * 10000) / 100 : 0;
              byRole.push({ role: roleLabel, count, percentage: pct });
            }
          }
          return {
            icdCode,
            icdName: v.icdName,
            total: { count: totalCount, percentage: totalPct },
            byRole,
          };
        })
        .sort((a, b) => b.total.count - a.total.count);
      return { totalApprovedSubmissions: totalApproved, items };
    } catch (err: any) {
      throw new Error(err);
    }
  }

  /**
   * Supervisor analytics: approved submissions created by the logged-in user, grouped by supervisor.
   * Only candidates "create" submissions; supervisors/admins receive empty analytics.
   * Percentages use largest-remainder so they sum to 100.
   */
  public async getSupervisorAnalytics(
    userId: string,
    role: string,
    dataSource: DataSource
  ): Promise<{
    totalApprovedSubmissions: number;
    items: { supervisorId: string; supervisorName: string; count: number; percentage: number }[];
  }> | never {
    try {
      let approved: ISubDoc[] = [];
      if (role === UserRole.CANDIDATE) {
        approved = await this.subService.getSubsByCandidateIdAndStatus(userId, "approved", dataSource);
      }
      const total = approved.length;
      const map = new Map<string, { name: string; count: number }>();
      for (const sub of approved) {
        const sup = (sub as any).supervisor ?? (sub as any).supervisorDocId;
        const id = sup?.id ?? (typeof sup === "string" ? sup : null);
        if (!id) continue;
        const name = sup?.fullName ?? sup?.email ?? "Unknown";
        const cur = map.get(id);
        if (cur) {
          cur.count += 1;
        } else {
          map.set(id, { name, count: 1 });
        }
      }
      const raw = Array.from(map.entries())
        .map(([supervisorId, v]) => ({
          supervisorId,
          supervisorName: v.name,
          count: v.count,
          rawPct: total > 0 ? (v.count / total) * 100 : 0,
        }))
        .sort((a, b) => b.count - a.count);

      const rounded = raw.map((r) => ({ ...r, floor: Math.floor(r.rawPct), frac: r.rawPct - Math.floor(r.rawPct) }));
      let sum = rounded.reduce((s, r) => s + r.floor, 0);
      const remainder = 100 - sum;
      rounded.sort((a, b) => b.frac - a.frac);
      for (let i = 0; i < remainder && i < rounded.length; i++) {
        rounded[i].floor += 1;
      }
      const items = rounded
        .sort((a, b) => b.count - a.count)
        .map(({ supervisorId, supervisorName, count, floor }) => ({
          supervisorId,
          supervisorName,
          count,
          percentage: floor,
        }));

      return { totalApprovedSubmissions: total, items };
    } catch (err: any) {
      throw new Error(err);
    }
  }

  /**
   * Submission (surgical experience) ranking: top 10 by approved count + logged-in candidate if not in top 10.
   * Fetches candidate details only for returned ids (≤11).
   */
  public async getSubmissionRanking(
    dataSource: DataSource,
    loggedInUserId?: string,
    loggedInUserRole?: string
  ): Promise<
    { candidateId: string; candidateName: string; rank: number; approvedCount: number; regDeg: string }[]
  > | never {
    try {
      const countMap = await this.subService.getApprovedCountsPerCandidate(dataSource);
      const sorted = Array.from(countMap.entries())
        .map(([candidateId, approvedCount]) => ({ candidateId, approvedCount }))
        .sort((a, b) => {
          if (b.approvedCount !== a.approvedCount) return b.approvedCount - a.approvedCount;
          return a.candidateId.localeCompare(b.candidateId);
        });

      const top10 = sorted.slice(0, 10);
      const top10Ids = new Set(top10.map((r) => r.candidateId));
      const isLoggedInCandidate =
        loggedInUserRole === "candidate" && loggedInUserId && loggedInUserId.length > 0;
      const addLoggedIn = isLoggedInCandidate && !top10Ids.has(loggedInUserId!);

      let loggedInRank: number | null = null;
      let loggedInCount = 0;
      if (isLoggedInCandidate && loggedInUserId) {
        loggedInCount = countMap.get(loggedInUserId) ?? 0;
        if (addLoggedIn) {
          const idx = sorted.findIndex((r) => r.candidateId === loggedInUserId);
          loggedInRank = idx >= 0 ? idx + 1 : sorted.length + 1;
        }
      }

      const idsToFetch = addLoggedIn
        ? [...top10.map((r) => r.candidateId), loggedInUserId!]
        : top10.map((r) => r.candidateId);
      const candidateMap = new Map<string, { fullName: string; regDeg: string }>();
      for (const id of idsToFetch) {
        const c = await this.candService.getCandById(id, dataSource);
        candidateMap.set(id, {
          fullName: (c as any)?.fullName ?? "—",
          regDeg: (c as any)?.regDeg ?? "",
        });
      }

      const result: {
        candidateId: string;
        candidateName: string;
        rank: number;
        approvedCount: number;
        regDeg: string;
      }[] = [];
      for (let i = 0; i < top10.length; i++) {
        const r = top10[i];
        const meta = candidateMap.get(r.candidateId);
        result.push({
          candidateId: r.candidateId,
          candidateName: meta?.fullName ?? "—",
          rank: i + 1,
          approvedCount: r.approvedCount,
          regDeg: meta?.regDeg ?? "",
        });
      }
      if (addLoggedIn && loggedInUserId != null && loggedInRank != null) {
        const meta = candidateMap.get(loggedInUserId);
        result.push({
          candidateId: loggedInUserId,
          candidateName: meta?.fullName ?? "—",
          rank: loggedInRank,
          approvedCount: loggedInCount,
          regDeg: meta?.regDeg ?? "",
        });
      }
      return result;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getCandidateSubmissions(candidateId: string, dataSource: DataSource): Promise<ISubDoc[]> | never {
    try {
      const subs = await this.subService.getSubsByCandidateId(candidateId, dataSource);
      return subs;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  /**
   * Returns candidate submissions where the supervisor is the approver (submissionType = 'candidate').
   * Does NOT include supervisor-owned submissions. Use GET /supervisor/own/submissions for those.
   */
  public async getSupervisorSubmissions(
    supervisorId: string,
    status: "approved" | "pending" | "rejected" | undefined,
    dataSource: DataSource
  ): Promise<ISubDoc[]> | never {
    try {
      return await this.subService.getSubsBySupervisorIdCandidateOnly(supervisorId, dataSource, status);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  /**
   * Returns submissions submitted by the supervisor (submissionType = 'supervisor'),
   * optionally filtered by status. Does not include candidate submissions.
   */
  public async getSupervisorOwnSubmissions(
    supervisorId: string,
    status: "approved" | "pending" | "rejected" | undefined,
    dataSource: DataSource
  ): Promise<ISubDoc[]> | never {
    try {
      return await this.subService.getSubsBySupervisorOwned(supervisorId, dataSource, status);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getSupervisorSubmissionById(
    supervisorId: string,
    submissionId: string,
    dataSource: DataSource
  ): Promise<ISubDoc | null> | never {
    try {
      // Business logic: Validate UUIDs
      if (!this.uuidRegex.test(submissionId)) {
        throw new Error("Invalid submission ID format");
      }
      if (!this.uuidRegex.test(supervisorId)) {
        throw new Error("Invalid supervisor ID format");
      }
      
      const submission = await this.subService.getSubById(submissionId, dataSource);
      if (!submission) {
        return null;
      }
      
      // Extract supervisor ID - handle both populated (object) and unpopulated (UUID) cases
      let submissionSupervisorId: string;
      const supervisorDoc = submission.supervisorDocId as any;
      if (supervisorDoc && typeof supervisorDoc === 'object') {
        // Populated document - check for id (MariaDB) or _id (MongoDB - legacy)
        if (supervisorDoc.id) {
          submissionSupervisorId = supervisorDoc.id;
        } else if (supervisorDoc._id) {
          submissionSupervisorId = supervisorDoc._id.toString();
        } else {
          throw new Error("Submission does not belong to this supervisor");
        }
      } else if (supervisorDoc) {
        // Unpopulated UUID - convert directly
        submissionSupervisorId = supervisorDoc.toString();
      } else {
        throw new Error("Submission does not belong to this supervisor");
      }
      
      // Compare supervisor IDs (both should be UUIDs now)
      // Both supervisorId and submissionSupervisorId are now UUIDs (MariaDB)
      if (submissionSupervisorId !== supervisorId) {
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
    submissionId: string,
    dataSource: DataSource
  ): Promise<ISubDoc | null> | never {
    try {
      // Business logic: Validate UUIDs
      if (!this.uuidRegex.test(submissionId)) {
        throw new Error("Invalid submission ID format");
      }
      if (!this.uuidRegex.test(candidateId)) {
        throw new Error("Invalid candidate ID format");
      }
      
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
          throw new Error("Submission does not belong to this candidate");
        }
      } else if (candidateDoc) {
        // Unpopulated ObjectId/UUID - convert directly
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
    getAll: boolean,
    dataSource: DataSource
  ): Promise<ISubDoc[]> | never {
    try {
      // If getAll is true, verify supervisor-candidate relationship first
      if (getAll) {
        const hasRelationship = await this.subService.hasSupervisorCandidateRelationship(
          supervisorId,
          candidateId,
          dataSource
        );
        
        if (!hasRelationship) {
          throw new Error("You do not have permission to view this candidate's submissions");
        }
        
        // Return all submissions for the candidate
        const allSubmissions = await this.subService.getSubsByCandidateId(candidateId, dataSource);
        
        return allSubmissions;
      } else {
        // Return only submissions supervised by the logged-in supervisor (current behavior)
        const submissions = await this.subService.getSubsBySupervisorIdAndCandidateId(supervisorId, candidateId, dataSource);
        
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
    review: string | undefined,
    dataSource: DataSource
  ): Promise<ISubDoc> | never {
    try {
      // Validate UUIDs
      if (!this.uuidRegex.test(submissionId)) {
        throw new Error("Invalid submission ID format");
      }
      if (!this.uuidRegex.test(supervisorId)) {
        throw new Error("Invalid supervisor ID format");
      }

      // Get submission and verify it belongs to supervisor
      const submission = await this.subService.getSubById(submissionId, dataSource);
      if (!submission) {
        throw new Error("Submission not found");
      }

      // Only process candidate submissions (supervisor submissions cannot be reviewed)
      if ((submission as any).submissionType === "supervisor") {
        throw new Error("Supervisor submissions cannot be reviewed");
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

      // Update submission in SQL DB (status, review, reviewedAt, reviewedBy)
      const updatedSubmission = await this.subService.updateSubmissionStatus(
        submissionId,
        status,
        dataSource,
        { review, reviewedBy: supervisorId }
      );
      if (!updatedSubmission) {
        throw new Error("Failed to update submission in database");
      }

      // Re-fetch the submission with all populated fields to ensure we have complete data for email
      const fullyPopulatedSubmission = await this.subService.getSubById(submissionId, dataSource);
      if (!fullyPopulatedSubmission) {
        throw new Error("Failed to fetch updated submission");
      }

      // Send email to candidate in background (do not block API response)
      void this.sendCandidateReviewEmail(fullyPopulatedSubmission, status, review);

      return fullyPopulatedSubmission;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  /**
   * Send "submission approved/rejected" email to candidate. Runs in background; do not await.
   * Called with void so API responds immediately after review is saved.
   */
  private async sendCandidateReviewEmail(
    fullyPopulatedSubmission: ISubDoc,
    status: "approved" | "rejected",
    review?: string
  ): Promise<void> {
    const submissionId = fullyPopulatedSubmission.id;
    try {
      const candidate = (fullyPopulatedSubmission as any).candidate;
      const supervisor = (fullyPopulatedSubmission as any).supervisor;
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
          text: emailText,
        });
      } else {
        console.warn("[SubProvider] Submission review: No email sent - candidate not populated or has no email", {
          submissionId,
          hasCandidate: !!candidate,
          hasEmail: !!(candidate?.email),
        });
      }
    } catch (err: any) {
      console.error("[SubProvider] Submission review: Failed to send email to candidate", {
        submissionId,
        error: err?.message || String(err),
      });
    }
  }

  /**
   * Send "new submission to review" email to supervisor. Runs in background; do not await.
   * Called with void so API responds immediately after submission is saved.
   */
  private async sendSupervisorNewSubmissionEmail(
    savedSub: ISubDoc,
    dataSource: DataSource,
    institutionId?: string,
    supervisorDocId?: string
  ): Promise<void> {
    try {
      let supervisor = (savedSub as any).supervisor;
      if (!supervisor?.email && supervisorDocId) {
        const supervisorDoc = await this.supervisorService.getSupervisorById(
          { id: supervisorDocId },
          dataSource
        );
        if (supervisorDoc) supervisor = supervisorDoc;
      }
      if (supervisor?.email) {
        const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        const pathPart = `${SUBMISSION_REVIEW_PATH}/${savedSub.id}`;
        const reviewLink = institutionId
          ? `${baseUrl}${pathPart}?institutionId=${encodeURIComponent(institutionId)}`
          : `${baseUrl}${pathPart}`;
        const supervisorName = supervisor.fullName || "Supervisor";
        const candidate = (savedSub as any).candidate;
        const candidateName = candidate?.fullName || "A candidate";
        const shortId = savedSub.id.slice(0, 8);
        const subject = `Review submission from ${candidateName} · ${shortId}`;
        const html = this.getSupervisorNewSubmissionEmailHtml(supervisorName, candidateName, reviewLink, baseUrl, savedSub);
        const text = this.getSupervisorNewSubmissionEmailText(supervisorName, candidateName, reviewLink, savedSub);
        await this.mailerService.sendMail({
          to: supervisor.email,
          subject,
          html,
          text,
        });
      } else {
        console.warn("[SubProvider] New submission: No email sent to supervisor - supervisor not found or has no email", {
          submissionId: savedSub.id,
          supervisorDocId,
        });
      }
    } catch (err: any) {
      console.error("[SubProvider] New submission: Failed to send email to supervisor", {
        submissionId: savedSub.id,
        error: err?.message ?? String(err),
      });
    }
  }

  private getSupervisorNewSubmissionEmailHtml(
    supervisorName: string,
    candidateName: string,
    reviewLink: string,
    baseUrl: string,
    submission: ISubDoc
  ): string {
    const subAny = submission as any;
    const submissionId = subAny.id ?? subAny._id ?? "—";
    const submittedAt = submission.timeStamp
      ? new Date(submission.timeStamp).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
      : "—";
    const roleInSurg = submission.roleInSurg ?? "—";
    const calSurg = subAny.calSurg;
    const procedureLabel =
      calSurg?.arabProc?.title ?? (Array.isArray(submission.procedureName) && submission.procedureName[0]) ?? "—";
    const mainDiag = subAny.mainDiag;
    const mainDiagTitle = mainDiag?.title ?? (submission as any).mainDiagDocId ?? "—";
    const hospitalName = calSurg?.hospital?.engName ?? calSurg?.hospital?.arabName ?? "—";
    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Review submission</title></head>
<body style="margin:0; padding:0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 1rem; line-height: 1.5; color: #4b5563; background-color: #eff6ff;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #eff6ff;">
    <tr>
      <td style="padding: 32px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 448px; margin: 0 auto;">
          <tr>
            <td style="padding: 0 0 16px; text-align: center;">
              <span style="display: inline-block; padding: 8px 16px; background-color: #dbeafe; color: #1d4ed8; font-size: 0.875rem; font-weight: 600; border-radius: 9999px;">NeuroLogBook</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 0 8px; font-size: 1.5rem; font-weight: 700; color: #111827; text-align: center;">New submission to review</td>
          </tr>
          <tr>
            <td style="padding: 24px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 0.5rem; box-shadow: 0 1px 3px 0 rgba(0,0,0,0.1);">
              <p style="margin: 0 0 16px; font-size: 1rem; color: #4b5563; line-height: 1.5;">Dear ${supervisorName},</p>
              <p style="margin: 0 0 20px; font-size: 1rem; color: #4b5563; line-height: 1.5;">A candidate has submitted a surgical experience for your approval. Please review the details below and take action when convenient.</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 0 0 20px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 0.5rem;">
                <tr><td style="padding: 12px 16px 8px; font-size: 0.875rem; font-weight: 600; color: #374151;">Submission details</td></tr>
                <tr><td style="padding: 0 16px 16px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size: 0.875rem;">
                    <tr><td style="padding: 4px 0; color: #6b7280; width: 120px;">Submission ID</td><td style="padding: 4px 0; font-weight: 500; color: #374151;">${submissionId}</td></tr>
                    <tr><td style="padding: 4px 0; color: #6b7280;">Submitted</td><td style="padding: 4px 0; color: #374151;">${submittedAt}</td></tr>
                    <tr><td style="padding: 4px 0; color: #6b7280;">Candidate</td><td style="padding: 4px 0; font-weight: 500; color: #374151;">${candidateName}</td></tr>
                    <tr><td style="padding: 4px 0; color: #6b7280;">Role in surgery</td><td style="padding: 4px 0; color: #374151;">${roleInSurg}</td></tr>
                    <tr><td style="padding: 4px 0; color: #6b7280;">Procedure</td><td style="padding: 4px 0; color: #374151;">${procedureLabel}</td></tr>
                    <tr><td style="padding: 4px 0; color: #6b7280;">Main diagnosis</td><td style="padding: 4px 0; color: #374151;">${mainDiagTitle}</td></tr>
                    <tr><td style="padding: 4px 0; color: #6b7280;">Hospital</td><td style="padding: 4px 0; color: #374151;">${hospitalName}</td></tr>
                  </table>
                </td></tr>
              </table>
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="border-radius: 0.5rem; background-color: #2563eb;">
                    <a href="${reviewLink}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 12px 24px; font-size: 1rem; font-weight: 600; color: #ffffff; text-decoration: none;">Review submission</a>
                  </td>
                </tr>
              </table>
              <p style="margin: 16px 0 0; font-size: 0.875rem; color: #6b7280;">If the button does not work, copy this link into your browser:</p>
              <p style="margin: 4px 0 0; font-size: 0.75rem; word-break: break-all;"><a href="${reviewLink}" style="color: #2563eb; font-weight: 500;">${reviewLink}</a></p>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 0 0; font-size: 0.75rem; color: #6b7280; text-align: center;">
              <p style="margin: 0 0 4px;">NeuroLogBook is developed by MedScribe. © MedScribe. All rights reserved.</p>
              <p style="margin: 0;">This is an automated message. Please do not reply to this email, as this inbox is not monitored.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
  }

  private getSupervisorNewSubmissionEmailText(
    supervisorName: string,
    candidateName: string,
    reviewLink: string,
    submission: ISubDoc
  ): string {
    const subAny = submission as any;
    const submissionId = subAny.id ?? subAny._id ?? "—";
    const submittedAt = submission.timeStamp
      ? new Date(submission.timeStamp).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
      : "—";
    const roleInSurg = submission.roleInSurg ?? "—";
    const calSurg = subAny.calSurg;
    const procedureLabel = calSurg?.arabProc?.title ?? (Array.isArray(submission.procedureName) && submission.procedureName[0]) ?? "—";
    const mainDiag = subAny.mainDiag;
    const mainDiagTitle = mainDiag?.title ?? "—";
    const hospitalName = calSurg?.hospital?.engName ?? calSurg?.hospital?.arabName ?? "—";
    return [
      "NeuroLogBook — New submission to review",
      "",
      `Dear ${supervisorName},`,
      "",
      "A candidate has submitted a surgical experience for your approval. Please review the details below and take action when convenient.",
      "",
      "Submission details",
      "----------------",
      `Submission ID: ${submissionId}`,
      `Submitted: ${submittedAt}`,
      `Candidate: ${candidateName}`,
      `Role in surgery: ${roleInSurg}`,
      `Procedure: ${procedureLabel}`,
      `Main diagnosis: ${mainDiagTitle}`,
      `Hospital: ${hospitalName}`,
      "",
      "Review submission:",
      reviewLink,
      "",
      "NeuroLogBook is developed by MedScribe. © MedScribe. All rights reserved.",
      "This is an automated message. Please do not reply to this email, as this inbox is not monitored.",
    ].join("\n");
  }

  /** Ensures a space after each comma (e.g. "a,b,c" -> "a, b, c"). */
  private normalizeCommaSpacing(s: string): string {
    if (!s || typeof s !== "string") return s;
    return s.replace(/,\s*/g, ", ").trim();
  }

  private getSubmissionReviewEmailHtml(
    candidateName: string,
    supervisorName: string,
    submission: ISubDoc,
    status: "approved" | "rejected",
    review?: string
  ): string {
    const statusText = status === "approved" ? "Approved" : "Rejected";

    // Extract all submission data (use populated relations: candidate, supervisor, calSurg, mainDiag)
    const subAny = submission as any;
    const submissionDate = submission.timeStamp ? new Date(submission.timeStamp).toLocaleString() : "N/A";
    const reviewDate = new Date().toLocaleString();
    
    // Candidate information
    const candidate = subAny.candidate;
    const candidateRegNum = candidate?.regNum || "N/A";
    const candidateRank = candidate?.rank || "N/A";
    const candidateDegree = candidate?.regDeg || "N/A";
    const candidateEmail = candidate?.email || "N/A";
    const candidatePhone = candidate?.phoneNum || "N/A";
    
    // Procedure details (calSurg relation)
    const procDoc = subAny.calSurg;
    const hospital = procDoc?.hospital;
    const hospitalEngName = hospital?.engName || "N/A";
    const hospitalArabName = hospital?.arabName || "N/A";
    const arabProc = procDoc?.arabProc;
    const arabProcTitle = arabProc?.title || "N/A";
    const procDate = procDoc?.procDate ? new Date(procDoc.procDate).toLocaleDateString() : "N/A";
    const patientName = procDoc?.patientName || "N/A";
    const patientDob = procDoc?.patientDob ? new Date(procDoc.patientDob).toLocaleDateString() : "N/A";
    const patientGender = procDoc?.gender || "N/A";
    
    // Main diagnosis
    const mainDiag = subAny.mainDiag;
    const mainDiagTitle = mainDiag?.title || "N/A";
    
    // Procedure names
    const procedureNames = submission.procedureName && submission.procedureName.length > 0 
      ? submission.procedureName.join(", ") 
      : "N/A";
    
    // Diagnosis names
    const diagnosisNames = submission.diagnosisName && submission.diagnosisName.length > 0 
      ? submission.diagnosisName.join(", ") 
      : "N/A";
    
    // CPT codes: alpha + num only (e.g. "MNR 62270")
    const procCptDocs = subAny.procCpts;
    const cptCodesList = procCptDocs && procCptDocs.length > 0
      ? procCptDocs.map((cpt: any) => `${cpt.alphaCode || ""} ${cpt.numCode || ""}`.trim()).join("<br>")
      : "N/A";
    
    // ICD codes: code only, no description
    const icdDocs = subAny.icds;
    const icdCodesList = icdDocs && icdDocs.length > 0
      ? icdDocs.map((icd: any) => icd.icdCode || "").join("<br>")
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
    
    // Instruments and consumables (normalize comma spacing: ensure space after each comma)
    const insUsed = this.normalizeCommaSpacing(submission.insUsed || "N/A");
    const consUsed = this.normalizeCommaSpacing(submission.consUsed || "N/A");
    const consDetails = submission.consDetails || "N/A";
    
    // Documentation
    const surgNotes = (submission as any).surgNotes || "N/A";
    const intEvents = (submission as any).IntEvents || "N/A";

    const statusBg = status === "approved" ? "#d1fae5" : "#fee2e2";
    const statusFg = status === "approved" ? "#047857" : "#b91c1c";
    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Submission ${statusText}</title></head>
<body style="margin:0; padding:0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 1rem; line-height: 1.5; color: #4b5563; background-color: #eff6ff;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #eff6ff;">
    <tr>
      <td style="padding: 32px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 560px; margin: 0 auto;">
          <tr>
            <td style="padding: 0 0 16px; text-align: center;">
              <span style="display: inline-block; padding: 8px 16px; background-color: #dbeafe; color: #1d4ed8; font-size: 0.875rem; font-weight: 600; border-radius: 9999px;">NeuroLogBook</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 0 8px; font-size: 1.5rem; font-weight: 700; color: #111827; text-align: center;">Submission ${statusText}</td>
          </tr>
          <tr>
            <td style="padding: 24px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 0.5rem; box-shadow: 0 1px 3px 0 rgba(0,0,0,0.1);">
              <p style="margin: 0 0 16px; font-size: 1rem; color: #4b5563; line-height: 1.5;">Hello ${candidateName},</p>
              <p style="margin: 0 0 20px; font-size: 1rem; color: #4b5563; line-height: 1.5;">Your submission has been <strong style="color: ${statusFg};">${statusText.toLowerCase()}</strong> by ${supervisorName}.</p>

              ${review ? `
              <div style="margin: 20px 0; background-color: ${statusBg}; border: 1px solid ${statusFg}; border-radius: 0.5rem; padding: 16px;">
                <h3 style="font-size: 1.125rem; font-weight: 600; color: #111827; margin: 0 0 8px;">Review Comments</h3>
                <p style="margin: 0; font-size: 1rem; color: ${statusFg}; white-space: pre-wrap;">${review}</p>
              </div>
              ` : ''}

              <div style="margin: 20px 0; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 16px;">
                <h3 style="font-size: 1.125rem; font-weight: 600; color: #111827; margin: 0 0 12px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb;">Basic Information</h3>
                <p style="margin: 0 0 6px; font-size: 1rem; color: #4b5563;"><strong style="color: #374151;">Submission Date:</strong> ${submissionDate}</p>
                <p style="margin: 0 0 6px; font-size: 1rem; color: #4b5563;"><strong style="color: #374151;">Submission Status:</strong> <span style="color: ${statusFg}; font-weight: 600;">${statusText}</span></p>
                <p style="margin: 0; font-size: 1rem; color: #4b5563;"><strong style="color: #374151;">Review Date:</strong> ${reviewDate}</p>
              </div>

              <div style="margin: 20px 0; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 16px;">
                <h3 style="font-size: 1.125rem; font-weight: 600; color: #111827; margin: 0 0 12px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb;">Procedure Information</h3>
                <p style="margin: 0 0 6px; font-size: 1rem; color: #4b5563;"><strong style="color: #374151;">Procedure Date:</strong> ${procDate}</p>
                <p style="margin: 0 0 6px; font-size: 1rem; color: #4b5563;"><strong style="color: #374151;">Hospital (English):</strong> ${hospitalEngName}</p>
                <p style="margin: 0 0 6px; font-size: 1rem; color: #4b5563;"><strong style="color: #374151;">Hospital (Arabic):</strong> ${hospitalArabName}</p>
                <p style="margin: 0 0 6px; font-size: 1rem; color: #4b5563;"><strong style="color: #374151;">Patient Name:</strong> ${patientName}</p>
                <p style="margin: 0 0 6px; font-size: 1rem; color: #4b5563;"><strong style="color: #374151;">Patient Date of Birth:</strong> ${patientDob}</p>
                <p style="margin: 0 0 6px; font-size: 1rem; color: #4b5563;"><strong style="color: #374151;">Patient Gender:</strong> ${patientGender}</p>
                <p style="margin: 0 0 6px; font-size: 1rem; color: #4b5563;"><strong style="color: #374151;">Arabic Procedure Title:</strong> ${arabProcTitle}</p>
                <p style="margin: 0; font-size: 1rem; color: #4b5563;"><strong style="color: #374151;">All Procedure Names:</strong> ${procedureNames}</p>
              </div>

              <div style="margin: 20px 0; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 16px;">
                <h3 style="font-size: 1.125rem; font-weight: 600; color: #111827; margin: 0 0 12px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb;">CPT Codes</h3>
                <div style="font-size: 1rem; color: #4b5563; white-space: pre-wrap;">${cptCodesList}</div>
              </div>

              <div style="margin: 20px 0; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 16px;">
                <h3 style="font-size: 1.125rem; font-weight: 600; color: #111827; margin: 0 0 12px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb;">Diagnosis Information</h3>
                <p style="margin: 0 0 6px; font-size: 1rem; color: #4b5563;"><strong style="color: #374151;">Main Diagnosis:</strong> ${mainDiagTitle}</p>
                <p style="margin: 0; font-size: 1rem; color: #4b5563;"><strong style="color: #374151;">All Diagnosis Names:</strong> ${diagnosisNames}</p>
              </div>

              <div style="margin: 20px 0; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 16px;">
                <h3 style="font-size: 1.125rem; font-weight: 600; color: #111827; margin: 0 0 12px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb;">ICD Codes</h3>
                <div style="font-size: 1rem; color: #4b5563; white-space: pre-wrap;">${icdCodesList}</div>
              </div>

              <div style="margin: 20px 0; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 16px;">
                <h3 style="font-size: 1.125rem; font-weight: 600; color: #111827; margin: 0 0 12px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb;">Surgical Details</h3>
                <p style="margin: 0 0 6px; font-size: 1rem; color: #4b5563;"><strong style="color: #374151;">Role in Surgery:</strong> ${roleInSurg}</p>
                ${submission.assRoleDesc ? `<p style="margin: 0 0 6px; font-size: 1rem; color: #4b5563;"><strong style="color: #374151;">Assistant Role Description:</strong> ${assRoleDesc}</p>` : ''}
                <p style="margin: 0 0 6px; font-size: 1rem; color: #4b5563;"><strong style="color: #374151;">Other Surgeon Rank:</strong> ${otherSurgRank}</p>
                <p style="margin: 0 0 6px; font-size: 1rem; color: #4b5563;"><strong style="color: #374151;">Other Surgeon Name:</strong> ${otherSurgName}</p>
                <p style="margin: 0 0 6px; font-size: 1rem; color: #4b5563;"><strong style="color: #374151;">Revision Surgery:</strong> ${isItRevSurg}</p>
                ${submission.preOpClinCond ? `<p style="margin: 0 0 6px; font-size: 1rem; color: #4b5563;"><strong style="color: #374151;">Pre-operative Clinical Condition:</strong> ${preOpClinCond}</p>` : ''}
                ${(submission as any).spOrCran ? `<p style="margin: 0 0 6px; font-size: 1rem; color: #4b5563;"><strong style="color: #374151;">Spinal or Cranial:</strong> ${spOrCran}</p>` : ''}
                ${(submission as any).pos ? `<p style="margin: 0 0 6px; font-size: 1rem; color: #4b5563;"><strong style="color: #374151;">Position:</strong> ${position}</p>` : ''}
                ${(submission as any).approach ? `<p style="margin: 0 0 6px; font-size: 1rem; color: #4b5563;"><strong style="color: #374151;">Approach:</strong> ${approach}</p>` : ''}
                ${(submission as any).clinPres ? `<p style="margin: 0 0 6px; font-size: 1rem; color: #4b5563;"><strong style="color: #374151;">Clinical Presentation:</strong> ${clinPres}</p>` : ''}
                ${(submission as any).region ? `<p style="margin: 0 0 6px; font-size: 1rem; color: #4b5563;"><strong style="color: #374151;">Region:</strong> ${region}</p>` : ''}
              </div>

              <div style="margin: 20px 0; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 16px;">
                <h3 style="font-size: 1.125rem; font-weight: 600; color: #111827; margin: 0 0 12px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb;">Instruments and Consumables</h3>
                <p style="margin: 0 0 6px; font-size: 1rem; color: #4b5563;"><strong style="color: #374151;">Instruments Used:</strong> ${insUsed}</p>
                <p style="margin: 0 0 6px; font-size: 1rem; color: #4b5563;"><strong style="color: #374151;">Consumables Used:</strong> ${consUsed}</p>
                ${submission.consDetails ? `<p style="margin: 0; font-size: 1rem; color: #4b5563;"><strong style="color: #374151;">Consumable Details:</strong> ${consDetails}</p>` : ''}
              </div>

              ${((submission as any).surgNotes || (submission as any).IntEvents) ? `
              <div style="margin: 20px 0; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 16px;">
                <h3 style="font-size: 1.125rem; font-weight: 600; color: #111827; margin: 0 0 12px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb;">Documentation</h3>
                ${(submission as any).surgNotes ? `<p style="margin: 0 0 8px; font-size: 1rem; color: #4b5563;"><strong style="color: #374151;">Surgical Notes:</strong></p><p style="margin: 0 0 12px; font-size: 1rem; color: #4b5563; white-space: pre-wrap; background-color: #f3f4f6; padding: 10px; border-radius: 0.5rem;">${surgNotes}</p>` : ''}
                ${(submission as any).IntEvents ? `<p style="margin: 0; font-size: 1rem; color: #4b5563;"><strong style="color: #374151;">Intraoperative Events:</strong></p><p style="margin: 0; font-size: 1rem; color: #4b5563; white-space: pre-wrap; background-color: #f3f4f6; padding: 10px; border-radius: 0.5rem;">${intEvents}</p>` : ''}
              </div>
              ` : ''}

              <div style="margin: 20px 0; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 16px;">
                <h3 style="font-size: 1.125rem; font-weight: 600; color: #111827; margin: 0 0 12px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb;">Candidate Information</h3>
                <p style="margin: 0 0 6px; font-size: 1rem; color: #4b5563;"><strong style="color: #374151;">Name:</strong> ${candidateName}</p>
                <p style="margin: 0 0 6px; font-size: 1rem; color: #4b5563;"><strong style="color: #374151;">Email:</strong> ${candidateEmail}</p>
                <p style="margin: 0 0 6px; font-size: 1rem; color: #4b5563;"><strong style="color: #374151;">Phone:</strong> ${candidatePhone}</p>
                <p style="margin: 0 0 6px; font-size: 1rem; color: #4b5563;"><strong style="color: #374151;">Registration Number:</strong> ${candidateRegNum}</p>
                <p style="margin: 0 0 6px; font-size: 1rem; color: #4b5563;"><strong style="color: #374151;">Rank:</strong> ${candidateRank}</p>
                <p style="margin: 0; font-size: 1rem; color: #4b5563;"><strong style="color: #374151;">Degree:</strong> ${candidateDegree}</p>
              </div>

              <div style="margin: 20px 0; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 16px;">
                <h3 style="font-size: 1.125rem; font-weight: 600; color: #111827; margin: 0 0 12px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb;">Supervisor Information</h3>
                <p style="margin: 0; font-size: 1rem; color: #4b5563;"><strong style="color: #374151;">Name:</strong> ${supervisorName}</p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 0 0; font-size: 0.75rem; color: #6b7280; text-align: center;">
              <p style="margin: 0 0 4px;">NeuroLogBook is developed by MedScribe. © MedScribe. All rights reserved.</p>
              <p style="margin: 0;">This is an automated message. Please do not reply to this email, as this inbox is not monitored.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
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
    
    const subAny = submission as any;
    const submissionDate = submission.timeStamp ? new Date(submission.timeStamp).toLocaleString() : "N/A";
    const reviewDate = new Date().toLocaleString();
    
    const candidate = subAny.candidate;
    const candidateRegNum = candidate?.regNum || "N/A";
    const candidateRank = candidate?.rank || "N/A";
    const candidateDegree = candidate?.regDeg || "N/A";
    const candidateEmail = candidate?.email || "N/A";
    const candidatePhone = candidate?.phoneNum || "N/A";
    
    const procDoc = subAny.calSurg;
    const hospital = procDoc?.hospital;
    const hospitalEngName = hospital?.engName || "N/A";
    const hospitalArabName = hospital?.arabName || "N/A";
    const arabProc = procDoc?.arabProc;
    const arabProcTitle = arabProc?.title || "N/A";
    const procDate = procDoc?.procDate ? new Date(procDoc.procDate).toLocaleDateString() : "N/A";
    const patientName = procDoc?.patientName || "N/A";
    const patientDob = procDoc?.patientDob ? new Date(procDoc.patientDob).toLocaleDateString() : "N/A";
    const patientGender = procDoc?.gender || "N/A";
    
    const mainDiag = subAny.mainDiag;
    const mainDiagTitle = mainDiag?.title || "N/A";
    
    const procedureNames = submission.procedureName && submission.procedureName.length > 0 
      ? submission.procedureName.join(", ") 
      : "N/A";
    
    const diagnosisNames = submission.diagnosisName && submission.diagnosisName.length > 0 
      ? submission.diagnosisName.join(", ") 
      : "N/A";
    
    // CPT codes: alpha + num only (e.g. "MNR 62270")
    const procCptDocs = subAny.procCpts;
    const cptCodesList = procCptDocs && procCptDocs.length > 0
      ? procCptDocs.map((cpt: any) => `${cpt.alphaCode || ""} ${cpt.numCode || ""}`.trim()).join("\n")
      : "N/A";
    
    // ICD codes: code only, no description
    const icdDocs = subAny.icds;
    const icdCodesList = icdDocs && icdDocs.length > 0
      ? icdDocs.map((icd: any) => icd.icdCode || "").join("\n")
      : "N/A";
    
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
    
    const insUsed = this.normalizeCommaSpacing(submission.insUsed || "N/A");
    const consUsed = this.normalizeCommaSpacing(submission.consUsed || "N/A");
    const consDetails = submission.consDetails || "N/A";
    
    const surgNotes = (submission as any).surgNotes || "N/A";
    const intEvents = (submission as any).IntEvents || "N/A";

    let text = `Hello ${candidateName},\n\n`;
    text += `Your submission has been ${statusText.toLowerCase()} by ${supervisorName}.\n\n`;
    
    if (review) {
      text += `═══════════════════════════════════════════════════════════\n`;
      text += `REVIEW COMMENTS\n`;
      text += `═══════════════════════════════════════════════════════════\n`;
      text += `${review}\n\n`;
    }
    
    text += `═══════════════════════════════════════════════════════════\n`;
    text += `BASIC INFORMATION\n`;
    text += `═══════════════════════════════════════════════════════════\n`;
    text += `Submission Date: ${submissionDate}\n`;
    text += `Submission Status: ${statusText}\n`;
    text += `Review Date: ${reviewDate}\n\n`;
    
    text += `═══════════════════════════════════════════════════════════\n`;
    text += `PROCEDURE INFORMATION\n`;
    text += `═══════════════════════════════════════════════════════════\n`;
    text += `Procedure Date: ${procDate}\n`;
    text += `Hospital (English): ${hospitalEngName}\n`;
    text += `Hospital (Arabic): ${hospitalArabName}\n`;
    text += `Patient Name: ${patientName}\n`;
    text += `Patient Date of Birth: ${patientDob}\n`;
    text += `Patient Gender: ${patientGender}\n`;
    text += `Arabic Procedure Title: ${arabProcTitle}\n`;
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
    text += `Name: ${supervisorName}\n\n`;
    
    text += `NeuroLogBook is developed by MedScribe. © MedScribe. All rights reserved.\n`;
    text += `This is an automated message. Please do not reply to this email, as this inbox is not monitored.`;
    
    return text;
  }

  public async generateSurgicalNotesForSubmission(
    submissionId: string,
    dataSource: DataSource
  ): Promise<{ surgicalNotes: string }> | never {
    try {
      // Validate UUID
      if (!this.uuidRegex.test(submissionId)) {
        throw new Error("Invalid submission ID format");
      }

      // Get populated submission
      const submission = await this.subService.getSubById(submissionId, dataSource);
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
   * Generate surgical notes from voice during submission creation (no submission exists yet).
   * Loads cal_surg by id and builds minimal context so the AI has procedure/patient/hospital info.
   */
  public async generateSurgicalNotesFromVoiceForCalSurg(
    calSurgId: string,
    audioBuffer: Buffer,
    mimeType: string,
    dataSource: DataSource
  ): Promise<{ surgicalNotes: string }> | never {
    try {
      if (!this.uuidRegex.test(calSurgId)) {
        throw new Error("Invalid calSurg ID format");
      }

      const calSurg = await this.calSurgService.getCalSurgById(calSurgId, dataSource);
      if (!calSurg) {
        throw new Error("CalSurg not found");
      }

      const calSurgEntity = calSurg as any;
      const minimalSubmission: any = {
        procDocId: calSurgEntity,
        calSurg: calSurgEntity,
        candDocId: null,
        supervisorDocId: null,
        mainDiagDocId: null,
        procCpts: [],
        icds: [],
        diagnosisName: [],
        procedureName: [],
        timeStamp: calSurgEntity.timeStamp || new Date(),
        roleInSurg: "N/A",
        assRoleDesc: undefined,
        otherSurgName: "",
        otherSurgRank: "",
        isItRevSurg: false,
        preOpClinCond: undefined,
        insUsed: "N/A",
        consUsed: "N/A",
        consDetails: undefined,
        surgNotes: undefined,
        IntEvents: undefined,
        spOrCran: undefined,
        pos: undefined,
        approach: undefined,
        clinPres: undefined,
        region: undefined,
      };

      const result = await this.aiAgentProvider.generateSurgicalNotesFromVoice({
        submission: minimalSubmission,
        audioBuffer,
        mimeType,
      });

      return result;
    } catch (err: any) {
      throw new Error(err.message || "Failed to generate surgical notes from voice");
    }
  }

  /**
   * Filters out submissions that already exist in the database (by subGoogleUid)
   * @param subs - Array of submissions to check
   * @param dataSource - DataSource instance
   * @returns Array of unique submissions that don't exist yet
   */
  private async filterDuplicateSubs(subs: ISub[], dataSource: DataSource): Promise<ISub[]> {
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
      const existingSubs = await this.subService.findSubsBySubGoogleUids(subGoogleUids, dataSource);
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

  /**
   * Deletes a submission by ID
   * @param id - Submission ID to delete
   * @param dataSource - DataSource instance
   * @returns Promise<boolean>
   */
  public async deleteSub(id: string, dataSource: DataSource): Promise<boolean> {
    try {
      return await this.subService.deleteSub(id, dataSource);
    } catch (error: any) {
      throw new Error(`Failed to delete submission: ${error.message}`);
    }
  }
}