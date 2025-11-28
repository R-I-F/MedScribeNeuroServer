import { injectable } from "inversify";
import { IInstituteAdmin, IInstituteAdminDoc } from "./instituteAdmin.interface";
import { InstituteAdmin } from "./instituteAdmin.schema";
import { Types } from "mongoose";

@injectable()
export class InstituteAdminProvider {
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
}

