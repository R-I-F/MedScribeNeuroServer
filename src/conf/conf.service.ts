import { inject, injectable } from "inversify";
import { DataSource } from "typeorm";
import { IConf, IConfDoc } from "./conf.interface";
import { ConfEntity } from "./conf.mDbSchema";
import { Repository, In, Not } from "typeorm";

@injectable()
export class ConfService {
  public async createConf(confData: IConf, dataSource: DataSource): Promise<IConfDoc> | never {
    try {
      const confRepository = dataSource.getRepository(ConfEntity);
      const newConf = confRepository.create(confData);
      const savedConf = await confRepository.save(newConf);
      return savedConf as unknown as IConfDoc;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getAllConfs(dataSource: DataSource): Promise<IConfDoc[]> | never {
    try {
      const confRepository = dataSource.getRepository(ConfEntity);
      const allConfs = await confRepository.find({
        relations: ["presenter"],
        order: { createdAt: "DESC" },
      });
      return allConfs as unknown as IConfDoc[];
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getConfById(id: string, dataSource: DataSource): Promise<IConfDoc | null> | never {
    try {
      const confRepository = dataSource.getRepository(ConfEntity);
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        throw new Error("Invalid conf ID format");
      }
      const conf = await confRepository.findOne({
        where: { id },
        relations: ["presenter"],
      });
      return conf as unknown as IConfDoc | null;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async updateConf(id: string, updateData: Partial<IConf>, dataSource: DataSource): Promise<IConfDoc | null> | never {
    try {
      const confRepository = dataSource.getRepository(ConfEntity);
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        throw new Error("Invalid conf ID format");
      }
      await confRepository.update(id, updateData);
      const updatedConf = await confRepository.findOne({
        where: { id },
        relations: ["presenter"],
      });
      return updatedConf as unknown as IConfDoc | null;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async deleteConf(id: string, dataSource: DataSource): Promise<boolean> | never {
    try {
      const confRepository = dataSource.getRepository(ConfEntity);
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        throw new Error("Invalid conf ID format");
      }
      const result = await confRepository.delete(id);
      return (result.affected ?? 0) > 0;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async findByGoogleUid(google_uid: string, dataSource: DataSource, excludeId?: string): Promise<IConfDoc | null> | never {
    try {
      const confRepository = dataSource.getRepository(ConfEntity);
      const where: any = { google_uid };
      if (excludeId) {
        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(excludeId)) {
          where.id = Not(excludeId);
        }
      }
      const conf = await confRepository.findOne({
        where,
      });
      return conf as unknown as IConfDoc | null;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async findConfsByGoogleUids(google_uids: string[], dataSource: DataSource): Promise<IConfDoc[]> | never {
    try {
      const confRepository = dataSource.getRepository(ConfEntity);
      const uniqueUids = [...new Set(google_uids.filter(uid => uid && uid.trim() !== ""))];
      if (uniqueUids.length === 0) {
        return [];
      }
      const confs = await confRepository.find({
        where: { google_uid: In(uniqueUids) },
      });
      return confs as unknown as IConfDoc[];
    } catch (err: any) {
      throw new Error(err);
    }
  }
}
