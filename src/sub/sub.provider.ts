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

@injectable()
export class SubProvider {
  constructor(
    @inject(ExternalService) private externalService: ExternalService,
    @inject(UtilService) private utilService: UtilService,
    @inject(SubService) private subService: SubService
  ) {}

  public async createSubFromExternal(
    validatedReq: Partial<IExternalRow>
  ): Promise<ISub[] | any> {
    try {
      console.log("sub.provider hit")
      const apiString = this.buildExternalApiString(validatedReq);
      const externalData =
        await this.externalService.fetchExternalData(apiString);

      if (!externalData.success) {
        console.log('External data didnt succed line 42 sub.provider')
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
        subGoogleUid: rawItemArr[indexes.subUid],
        subStatus: this.utilService.normalizeSubStatus(
          rawItemArr[indexes.subStatus]
        ) as TSubStatus,
        procCptDocId: procDocIds,
        icdDocId: icdDocIds,
      };

      // console.log("google uid ", subBase.subGoogleUid)

      const subPayload = this.returnSubPayload(
        mainDiagTitle,
        subBase,
        rawItemArr,
        indexes
      );

      subPayloads.push(subPayload);
    }
    try {
      const response = await this.subService.createBulkSub(subPayloads);
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
}