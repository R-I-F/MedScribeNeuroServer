import { injectable } from "inversify";
import { ISuperAdmin, ISuperAdminDoc } from "./superAdmin.interface";
import { SuperAdmin } from "./superAdmin.schema";
import { Types } from "mongoose";

@injectable()
export class SuperAdminProvider {
  public async createSuperAdmin(validatedReq: Partial<ISuperAdmin>): Promise<ISuperAdminDoc> | never {
    try {
      const superAdmin = new SuperAdmin(validatedReq);
      return await superAdmin.save();
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getAllSuperAdmins(): Promise<ISuperAdminDoc[]> | never {
    try {
      return await SuperAdmin.find().exec();
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getSuperAdminById(id: string): Promise<ISuperAdminDoc | null> | never {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new Error("Invalid super admin ID");
      }
      return await SuperAdmin.findById(id).exec();
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getSuperAdminByEmail(email: string): Promise<ISuperAdminDoc | null> | never {
    try {
      return await SuperAdmin.findOne({ email }).exec();
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async updateSuperAdmin(validatedReq: Partial<ISuperAdmin> & { id: string }): Promise<ISuperAdminDoc | null> | never {
    try {
      const { id, ...updateData } = validatedReq;
      if (!Types.ObjectId.isValid(id)) {
        throw new Error("Invalid super admin ID");
      }
      return await SuperAdmin.findByIdAndUpdate(id, updateData, { new: true }).exec();
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async deleteSuperAdmin(id: string): Promise<boolean> | never {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new Error("Invalid super admin ID");
      }
      const result = await SuperAdmin.findByIdAndDelete(id).exec();
      return result !== null;
    } catch (err: any) {
      throw new Error(err);
    }
  }
}

