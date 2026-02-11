import { injectable } from "inversify";
import { DataSource } from "typeorm";
import { ISuperAdmin, ISuperAdminDoc } from "./superAdmin.interface";
import { SuperAdminEntity } from "./superAdmin.mDbSchema";

@injectable()
export class SuperAdminProvider {
  public async createSuperAdmin(validatedReq: Partial<ISuperAdmin>, dataSource: DataSource): Promise<ISuperAdminDoc> | never {
    try {
      const superAdminRepository = dataSource.getRepository(SuperAdminEntity);
      const newSuperAdmin = superAdminRepository.create(validatedReq);
      const savedSuperAdmin = await superAdminRepository.save(newSuperAdmin);
      return savedSuperAdmin as unknown as ISuperAdminDoc;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getAllSuperAdmins(dataSource: DataSource): Promise<ISuperAdminDoc[]> | never {
    try {
      const superAdminRepository = dataSource.getRepository(SuperAdminEntity);
      const superAdmins = await superAdminRepository.find({
        order: { createdAt: "DESC" },
      });
      return superAdmins as unknown as ISuperAdminDoc[];
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getSuperAdminById(id: string, dataSource: DataSource): Promise<ISuperAdminDoc | null> | never {
    try {
      const superAdminRepository = dataSource.getRepository(SuperAdminEntity);
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        throw new Error("Invalid super admin ID format");
      }
      const superAdmin = await superAdminRepository.findOne({
        where: { id },
      });
      return superAdmin as unknown as ISuperAdminDoc | null;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getSuperAdminByEmail(email: string, dataSource: DataSource): Promise<ISuperAdminDoc | null> | never {
    try {
      const superAdminRepository = dataSource.getRepository(SuperAdminEntity);
      const normalized = (email || "").trim().toLowerCase();
      if (!normalized) return null;
      const superAdmin = await superAdminRepository
        .createQueryBuilder("s")
        .where("LOWER(TRIM(s.email)) = :email", { email: normalized })
        .getOne();
      return superAdmin as unknown as ISuperAdminDoc | null;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async updateSuperAdmin(validatedReq: Partial<ISuperAdmin> & { id: string }, dataSource: DataSource): Promise<ISuperAdminDoc | null> | never {
    try {
      const superAdminRepository = dataSource.getRepository(SuperAdminEntity);
      const { id, ...updateData } = validatedReq;
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        throw new Error("Invalid super admin ID format");
      }
      await superAdminRepository.update(id, updateData);
      const updatedSuperAdmin = await superAdminRepository.findOne({
        where: { id },
      });
      return updatedSuperAdmin as unknown as ISuperAdminDoc | null;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async deleteSuperAdmin(id: string, dataSource: DataSource): Promise<boolean> | never {
    try {
      const superAdminRepository = dataSource.getRepository(SuperAdminEntity);
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        throw new Error("Invalid super admin ID format");
      }
      const result = await superAdminRepository.delete(id);
      return (result.affected ?? 0) > 0;
    } catch (err: any) {
      throw new Error(err);
    }
  }
}

