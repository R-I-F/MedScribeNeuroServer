import { injectable, inject } from "inversify";
import { ISub, ISubDoc } from "./interfaces/sub.interface";
import { Model } from "mongoose";
import { Sub } from "./sub.schema";

@injectable()
export class SubService {
  constructor() {}
  private subModel: Model<ISub> = Sub;

  public async createBulkSub(subData: ISub[]): Promise<ISubDoc[]> {
    try {
      // console.log("subData ", subData[0])
      const newSubArr = await this.subModel.insertMany(subData);
      return newSubArr;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  public async getAllSubs(): Promise<ISubDoc[]> {
    try {
      const allSubs = await this.subModel.find({});
      return allSubs;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  public async getSubsByCandidateId(candidateId: string): Promise<ISubDoc[]> | never {
    try {
      const subs = await this.subModel
        .find({ candDocId: candidateId })
        .populate('candDocId')
        .populate({
          path: 'procDocId',
          populate: [
            {
              path: 'hospital',
              select: '_id engName arabName location'
            },
            {
              path: 'arabProc',
              select: '_id title numCode alphaCode description'
            }
          ]
        })
        .populate('supervisorDocId')
        .populate('mainDiagDocId')
        .populate('procCptDocId')
        .populate('icdDocId')
        .exec();
      return subs;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  public async getSubsByCandidateIdAndStatus(
    candidateId: string,
    status: "approved" | "pending" | "rejected"
  ): Promise<ISubDoc[]> | never {
    try {
      const subs = await this.subModel
        .find({ candDocId: candidateId, subStatus: status })
        .populate('candDocId')
        .populate({
          path: 'procDocId',
          populate: [
            {
              path: 'hospital',
              select: '_id engName arabName location'
            },
            {
              path: 'arabProc',
              select: '_id title numCode alphaCode description'
            }
          ]
        })
        .populate('supervisorDocId')
        .populate('mainDiagDocId')
        .populate('procCptDocId')
        .populate('icdDocId')
        .exec();
      return subs;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  public async getSubsBySupervisorId(supervisorId: string): Promise<ISubDoc[]> | never {
    try {
      const subs = await this.subModel
        .find({ supervisorDocId: supervisorId })
        .populate('candDocId')
        .populate({
          path: 'procDocId',
          populate: [
            {
              path: 'hospital',
              select: '_id engName arabName location'
            },
            {
              path: 'arabProc',
              select: '_id title numCode alphaCode description'
            }
          ]
        })
        .populate('supervisorDocId')
        .populate('mainDiagDocId')
        .populate('procCptDocId')
        .populate('icdDocId')
        .exec();
      return subs;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  public async getSubsBySupervisorIdAndStatus(
    supervisorId: string,
    status: "approved" | "pending" | "rejected"
  ): Promise<ISubDoc[]> | never {
    try {
      const subs = await this.subModel
        .find({ supervisorDocId: supervisorId, subStatus: status })
        .populate('candDocId')
        .populate({
          path: 'procDocId',
          populate: [
            {
              path: 'hospital',
              select: '_id engName arabName location'
            },
            {
              path: 'arabProc',
              select: '_id title numCode alphaCode description'
            }
          ]
        })
        .populate('supervisorDocId')
        .populate('mainDiagDocId')
        .populate('procCptDocId')
        .populate('icdDocId')
        .exec();
      return subs;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  public async getSubById(subId: string): Promise<ISubDoc | null> | never {
    try {
      const sub = await this.subModel
        .findById(subId)
        .populate('candDocId')
        .populate({
          path: 'procDocId',
          populate: [
            {
              path: 'hospital',
              select: '_id engName arabName location'
            },
            {
              path: 'arabProc',
              select: '_id title numCode alphaCode description'
            }
          ]
        })
        .populate('supervisorDocId')
        .populate('mainDiagDocId')
        .populate('procCptDocId')
        .populate('icdDocId')
        .exec();
      return sub;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  public async getSubsBySupervisorIdAndCandidateId(
    supervisorId: string,
    candidateId: string
  ): Promise<ISubDoc[]> | never {
    try {
      const subs = await this.subModel
        .find({ supervisorDocId: supervisorId, candDocId: candidateId })
        .populate('candDocId')
        .populate({
          path: 'procDocId',
          populate: [
            {
              path: 'hospital',
              select: '_id engName arabName location'
            },
            {
              path: 'arabProc',
              select: '_id title numCode alphaCode description'
            }
          ]
        })
        .populate('supervisorDocId')
        .populate('mainDiagDocId')
        .populate('procCptDocId')
        .populate('icdDocId')
        .exec();
      return subs;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  public async hasSupervisorCandidateRelationship(
    supervisorId: string,
    candidateId: string
  ): Promise<boolean> | never {
    try {
      const count = await this.subModel
        .countDocuments({ supervisorDocId: supervisorId, candDocId: candidateId })
        .exec();
      return count > 0;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  public async updateSubmissionStatus(
    submissionId: string,
    status: "approved" | "rejected"
  ): Promise<ISubDoc | null> | never {
    try {
      const updatedSub = await this.subModel
        .findByIdAndUpdate(
          submissionId,
          { subStatus: status },
          { new: true }
        )
        .populate('candDocId')
        .populate({
          path: 'procDocId',
          populate: [
            {
              path: 'hospital',
              select: '_id engName arabName location'
            },
            {
              path: 'arabProc',
              select: '_id title numCode alphaCode description'
            }
          ]
        })
        .populate('supervisorDocId')
        .populate('mainDiagDocId')
        .populate('procCptDocId')
        .populate('icdDocId')
        .exec();
      return updatedSub;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  public async findSubBySubGoogleUid(subGoogleUid: string): Promise<ISubDoc | null> | never {
    try {
      if (!subGoogleUid || subGoogleUid.trim() === "") {
        return null;
      }
      return await this.subModel.findOne({ subGoogleUid: subGoogleUid.trim() }).exec();
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  public async findSubsBySubGoogleUids(subGoogleUids: string[]): Promise<ISubDoc[]> | never {
    try {
      const uniqueUids = [...new Set(subGoogleUids.filter(uid => uid && uid.trim() !== ""))];
      if (uniqueUids.length === 0) {
        return [];
      }
      return await this.subModel.find({ subGoogleUid: { $in: uniqueUids } }).exec();
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
}