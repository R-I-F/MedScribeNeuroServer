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

  public stringToLowerCaseTrim(item: string) {
    try {
      return item.toLowerCase().trim();
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
}
