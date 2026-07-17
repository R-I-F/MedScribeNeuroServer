import { inject, injectable } from "inversify";
import { Rank, RegDegree } from "../cand/cand.interface";

@injectable()
export class UtilService {
  public stringToDateConverter(dateStr: string): Date | never {
    try {
      const dateObj = new Date(dateStr);
      return dateObj;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public sanitizeName(name: string) {
    try {
      return name.replace(/\*/g, "").trim();
    } catch (err: any) {
      throw new Error(err);
    }
  }

  /**
   * Patient-name privacy format (bilingual-titles plan Q8 — server-side port of the frontend
   * formatPatientNameForStore): complete first name + single-letter initials of the remaining
   * names ("أحمد محمود عبد الرحمن" → "أحمد م ع ا"). Idempotent on already-formatted names.
   */
  public formatPatientNameForStore(fullName: string): string {
    const trimmed = (fullName ?? "").trim();
    if (!trimmed) return "";
    const parts = trimmed.split(/\s+/).filter(Boolean);
    if (parts.length <= 1) return trimmed;
    const firstName = parts[0];
    const initials = parts.slice(1).map((p) => p.charAt(0)).join(" ");
    return `${firstName} ${initials}`.trim();
  }

  public yesNoToBoolean(item: string): boolean | never {
    if(typeof item !== "string") {
      throw new Error("Item must be a string");
    }
    try {
      if(item.toLowerCase().trim() === "yes"){
        return true;
      } else if(item.toLowerCase().trim() === "no"){
        return false;
      } else { return false }
    }
    catch (err: any) {
      throw new Error(err);
    }
  }

  public stringToLowerCaseTrim(item: string): string | never {
    if(typeof item !== "string") {
      throw new Error("Item must be a string");
    }
    try {
      return item.toLowerCase().trim();
    } catch (err: any) {
      throw new Error(err);
    }
  }

  /**
   * Sanitize label/title for DB: trim, lowercase, remove commas, collapse multiple spaces.
   * Use for mainDiag title, consumables, equipment, positions, approaches, regions, hospital names.
   */
  public sanitizeLabel(item: string): string | never {
    if (typeof item !== "string") {
      throw new Error("Item must be a string");
    }
    try {
      const trimmed = item.trim().toLowerCase();
      const noCommas = trimmed.replace(/,/g, " ");
      return noCommas.replace(/\s+/g, " ").trim();
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public stringToLowerCaseTrimUndefined(item: string): string | undefined | never {
    if(typeof item !== "string") {
      throw new Error("Item must be a string");
    }
    try {
      if(item.length === 0) {
        return undefined;
      }
      return item.toLowerCase().trim();
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public normalizeSubStatus(
    status: string | undefined
  ): "pending" | "approved" | "rejected" | undefined | never {
    if (typeof status === "undefined") {
      return undefined;
    }

    if (typeof status !== "string") {
      throw new Error("Status must be a string");
    }

    try {
      const trimmed = status.trim();

      if (trimmed.length === 0) {
        return "pending";
      }

      const normalized = trimmed.toLowerCase();

      if (normalized === "pending" || normalized === "approved" || normalized === "rejected") {
        return normalized;
      }

      // External sheet may use "Accepted" instead of "Approved"
      if (normalized === "accepted") {
        return "approved";
      }

      throw new Error(`Invalid sub status: ${status}`);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public stringToArrayOfLCStrings(item: string, delimiter: string = ","): string[] | undefined | never {
    
    if(typeof item !== "string") {
      throw new Error("Item must be a string");
    }
    try {
      if(item.length === 0) {
        return undefined;
      }
      return item.toLowerCase().trim().split(", ").map(str => str.trim());
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public numToStringTrim(num: number | string) {
    try {
      if (typeof num === "string") {
        return num.trim();
      }

      if (typeof num === "number") {
        return num.toString().trim();
      }

      throw new Error("Invalid num type");
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public approvedToBoolean(status: string) {
    try {
      if (typeof status === "string") {
        if (status.trim() === "Approved") {
          return true;
        }
        if (status.trim() === "") {
          return false;
        }
      }
      throw new Error("Invalid status type");
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public returnRankEnum(rank: string): Rank {
    try {
      const sanitizedRank = this.stringToLowerCaseTrim(rank);

      // check against enum values
      const match = (Object.values(Rank) as string[]).find(
        (val) => val === sanitizedRank
      );

      if (!match) {
        throw new Error(`Invalid rank: ${rank}`);
      }

      return match as Rank;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public returnRegDegree(degree: string): RegDegree {
    try {
      const sanitized = this.stringToLowerCaseTrim(degree);
      // console.log(sanitized)

      const match = (Object.values(RegDegree) as string[]).find(
        (val) => val === sanitized
      );

      if (!match) {
        throw new Error(`Invalid degree: ${degree}`);
      }

      return match as RegDegree;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public returnSubIndexes(){
    return {
      timeStamp: 0,
      candEmail: 1,
      procUid: 2,
      superEmail: 3,
      roleInProc: 4,
      ifAssDescRole: 5,
      otherSurg: 6,
      nameOtherSurg: 7,
      isItRevSurg: 8,
      preOpClinicalCond: 9,
      insUsed: 10,
      consUsed: 11,
      consDet: 12,
      mainDiag: 13,
      congAnomDiag: 14,
      congAnomProc: 15,
      congAnomProcSurgNotes: 16,
      conAnomIntEvents: 17,
      cnsTumSpOrCran: 18,
      cnsTumorProvDiag: 19,
      cnsTumorPos: 20,
      cnsTumorApp: 21,
      cnsTumorProc: 22,
      cnsTumorSurgNotes: 23,
      cnsTumorIntEvents: 24,
      cnsInfDiag: 25,
      cnsInfProc: 26,
      cnsInfSurgNotes: 27,
      cnsInfIntEvents: 28,
      cranialTraumaProvDiag: 29,
      cranialTraumaProc: 30,
      cranialTraumaSurgNotes: 31,
      cranialTraumaIntEvents: 32,
      spinalTraumaProvDiag: 33,
      spinalTraumaProc: 34,
      spinalTraumaSurgNotes: 35,
      spinalTraumaIntEvents: 36,
      spDegenDisRegion: 37,
      spDegenDisProvDiag: 38,
      spDegenDisProc: 39,
      spDegenDisSurgNotes: 40,
      spDegenDisIntEvents: 41,
      perNerveDisDiag: 42,
      perNerveDisProc: 43,
      perNerveDisSurgNotes: 44,
      neuroVasDisClinPres: 45,
      neuroVasDisProvDiag: 46,
      neuroVasDisProc: 47,
      neuroVasDisSurgNotes: 48,
      funcNeuroDiag: 49,
      funcNeuroClinicalCond: 50,
      funcProcProc: 51,
      funcProcSurgNotes: 52,
      funcProcIntEvents: 53,
      csfDiag: 54,
      csfProcMan: 55,
      csfProcSurgNotes: 56,
      csfProcIntEvents: 57,
      subUid: 58,
      subStatus: 59,
      alphaCode: 60,
      numCode: 61,
      icd: 62
    }
  }

  public extractCodes(value: unknown, delimiter: string = ","): string[] {
    if (typeof value !== "string") {
      return [];
    }

    return value
      .split(delimiter)
      .map((code) => code.trim())
      .filter((code) => code.length > 0);
  }

  public extractSpOrCran(value: unknown): "spinal" | "cranial" | undefined | never {
    if (typeof value !== "string") {
      throw new Error("Value must be a string");
    }
    try {
      const normalized = value.trim();

      if (normalized.length === 0) {
        return undefined;
      }

      if (normalized.includes("Spinal")) {
        return "spinal";
      }

      if (normalized.includes("Cranial")) {
        return "cranial";
      }
      throw new Error(`Invalid spOrCran: ${value}`);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public returnSanitizedMainDiag(mainDiagRaw: unknown): string | never {
    if (typeof mainDiagRaw !== "string") {
      throw new Error("mainDiagRaw must be a string");
    }
  
    const arr = mainDiagRaw.split(".");
    const mainDiag = arr[1];
    return mainDiag.trim().toLowerCase();
  }
}
