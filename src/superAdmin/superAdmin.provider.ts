import { injectable } from "inversify";
import { ISuperAdmin, ISuperAdminDoc } from "./superAdmin.interface";
import { AppDataSource } from "../config/database.config";
import { SuperAdminEntity } from "./superAdmin.mDbSchema";
import { Repository } from "typeorm";

@injectable()
export class SuperAdminProvider {
  private superAdminRepository: Repository<SuperAdminEntity>;

  constructor() {
    this.superAdminRepository = AppDataSource.getRepository(SuperAdminEntity);
  }

  public async createSuperAdmin(validatedReq: Partial<ISuperAdmin>): Promise<ISuperAdminDoc> | never {
    try {
      const newSuperAdmin = this.superAdminRepository.create(validatedReq);
      const savedSuperAdmin = await this.superAdminRepository.save(newSuperAdmin);
      return savedSuperAdmin as unknown as ISuperAdminDoc;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getAllSuperAdmins(): Promise<ISuperAdminDoc[]> | never {
    try {
      const superAdmins = await this.superAdminRepository.find({
        order: { createdAt: "DESC" },
      });
      return superAdmins as unknown as ISuperAdminDoc[];
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getSuperAdminById(id: string): Promise<ISuperAdminDoc | null> | never {
    try {
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        throw new Error("Invalid super admin ID format");
      }
      const superAdmin = await this.superAdminRepository.findOne({
        where: { id },
      });
      return superAdmin as unknown as ISuperAdminDoc | null;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getSuperAdminByEmail(email: string): Promise<ISuperAdminDoc | null> | never {
    try {
      const superAdmin = await this.superAdminRepository.findOne({
        where: { email },
      });
      return superAdmin as unknown as ISuperAdminDoc | null;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async updateSuperAdmin(validatedReq: Partial<ISuperAdmin> & { id: string }): Promise<ISuperAdminDoc | null> | never {
    try {
      const { id, ...updateData } = validatedReq;
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        throw new Error("Invalid super admin ID format");
      }
      await this.superAdminRepository.update(id, updateData);
      const updatedSuperAdmin = await this.superAdminRepository.findOne({
        where: { id },
      });
      return updatedSuperAdmin as unknown as ISuperAdminDoc | null;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async deleteSuperAdmin(id: string): Promise<boolean> | never {
    try {
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        throw new Error("Invalid super admin ID format");
      }
      const result = await this.superAdminRepository.delete(id);
      return (result.affected ?? 0) > 0;
    } catch (err: any) {
      throw new Error(err);
    }
  }
}

