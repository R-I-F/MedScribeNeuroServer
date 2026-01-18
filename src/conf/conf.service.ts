import { inject, injectable } from "inversify";
import { IConf, IConfDoc } from "./conf.interface";
import { AppDataSource } from "../config/database.config";
import { ConfEntity } from "./conf.mDbSchema";
import { Repository, In, Not } from "typeorm";

@injectable()
export class ConfService {
  private confRepository: Repository<ConfEntity>;

  constructor() {
    this.confRepository = AppDataSource.getRepository(ConfEntity);
  }

  public async createConf(confData: IConf): Promise<IConfDoc> | never {
    try {
      const newConf = this.confRepository.create(confData);
      const savedConf = await this.confRepository.save(newConf);
      return savedConf as unknown as IConfDoc;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getAllConfs(): Promise<IConfDoc[]> | never {
    try {
      const allConfs = await this.confRepository.find({
        relations: ["presenter"],
        order: { createdAt: "DESC" },
      });
      return allConfs as unknown as IConfDoc[];
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getConfById(id: string): Promise<IConfDoc | null> | never {
    try {
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        throw new Error("Invalid conf ID format");
      }
      const conf = await this.confRepository.findOne({
        where: { id },
        relations: ["presenter"],
      });
      return conf as unknown as IConfDoc | null;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async updateConf(id: string, updateData: Partial<IConf>): Promise<IConfDoc | null> | never {
    try {
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        throw new Error("Invalid conf ID format");
      }
      await this.confRepository.update(id, updateData);
      const updatedConf = await this.confRepository.findOne({
        where: { id },
        relations: ["presenter"],
      });
      return updatedConf as unknown as IConfDoc | null;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async deleteConf(id: string): Promise<boolean> | never {
    try {
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        throw new Error("Invalid conf ID format");
      }
      const result = await this.confRepository.delete(id);
      return (result.affected ?? 0) > 0;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async findByGoogleUid(google_uid: string, excludeId?: string): Promise<IConfDoc | null> | never {
    try {
      const where: any = { google_uid };
      if (excludeId) {
        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(excludeId)) {
          where.id = Not(excludeId);
        }
      }
      const conf = await this.confRepository.findOne({
        where,
      });
      return conf as unknown as IConfDoc | null;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async findConfsByGoogleUids(google_uids: string[]): Promise<IConfDoc[]> | never {
    try {
      const uniqueUids = [...new Set(google_uids.filter(uid => uid && uid.trim() !== ""))];
      if (uniqueUids.length === 0) {
        return [];
      }
      const confs = await this.confRepository.find({
        where: { google_uid: In(uniqueUids) },
      });
      return confs as unknown as IConfDoc[];
    } catch (err: any) {
      throw new Error(err);
    }
  }
}
