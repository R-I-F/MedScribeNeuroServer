import { inject, injectable } from "inversify";
import { ISupervisor, ISupervisorDoc } from "./supervisor.interface";
import { Supervisor } from "./supervisor.schema";
import { Types } from "mongoose";

@injectable()
export class SupervisorProvider {
  public async createSupervisor(validatedReq: Partial<ISupervisor>): Promise<ISupervisorDoc> | never {
    try {
      const supervisor = new Supervisor(validatedReq);
      return await supervisor.save();
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getAllSupervisors(): Promise<ISupervisorDoc[]> | never {
    try {
      return await Supervisor.find().exec();
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getSupervisorById(id: string): Promise<ISupervisorDoc | null> | never {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new Error("Invalid supervisor ID");
      }
      return await Supervisor.findById(id).exec();
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async updateSupervisor(validatedReq: Partial<ISupervisor> & { id: string }): Promise<ISupervisorDoc | null> | never {
    try {
      const { id, ...updateData } = validatedReq;
      if (!Types.ObjectId.isValid(id)) {
        throw new Error("Invalid supervisor ID");
      }
      return await Supervisor.findByIdAndUpdate(id, updateData, { new: true }).exec();
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async deleteSupervisor(id: string): Promise<boolean> | never {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new Error("Invalid supervisor ID");
      }
      const result = await Supervisor.findByIdAndDelete(id).exec();
      return result !== null;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async addToApprovedSubs(supervisorId: string, componentId: string): Promise<ISupervisorDoc | null> | never {
    try {
      if (!Types.ObjectId.isValid(supervisorId) || !Types.ObjectId.isValid(componentId)) {
        throw new Error("Invalid supervisor or component ID");
      }
      return await Supervisor.findByIdAndUpdate(
        supervisorId,
        { $addToSet: { approvedSubs: componentId } },
        { new: true }
      ).exec();
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async addToPendingSubs(supervisorId: string, componentId: string): Promise<ISupervisorDoc | null> | never {
    try {
      if (!Types.ObjectId.isValid(supervisorId) || !Types.ObjectId.isValid(componentId)) {
        throw new Error("Invalid supervisor or component ID");
      }
      return await Supervisor.findByIdAndUpdate(
        supervisorId,
        { $addToSet: { pendingSubs: componentId } },
        { new: true }
      ).exec();
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async addToRejectedSubs(supervisorId: string, componentId: string): Promise<ISupervisorDoc | null> | never {
    try {
      if (!Types.ObjectId.isValid(supervisorId) || !Types.ObjectId.isValid(componentId)) {
        throw new Error("Invalid supervisor or component ID");
      }
      return await Supervisor.findByIdAndUpdate(
        supervisorId,
        { $addToSet: { rejectedSubs: componentId } },
        { new: true }
      ).exec();
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async removeFromSubs(supervisorId: string, componentId: string): Promise<ISupervisorDoc | null> | never {
    try {
      if (!Types.ObjectId.isValid(supervisorId) || !Types.ObjectId.isValid(componentId)) {
        throw new Error("Invalid supervisor or component ID");
      }
      return await Supervisor.findByIdAndUpdate(
        supervisorId,
        { 
          $pull: { 
            approvedSubs: componentId,
            pendingSubs: componentId,
            rejectedSubs: componentId
          } 
        },
        { new: true }
      ).exec();
    } catch (err: any) {
      throw new Error(err);
    }
  }
}
