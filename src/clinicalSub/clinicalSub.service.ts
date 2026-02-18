import { injectable } from "inversify";
import { DataSource } from "typeorm";
import { IClinicalSub, IClinicalSubDoc } from "./clinicalSub.interface";
import { ClinicalSubEntity } from "./clinicalSub.mDbSchema";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@injectable()
export class ClinicalSubService {
  public async create(data: IClinicalSub, dataSource: DataSource): Promise<IClinicalSubDoc> {
    const repo = dataSource.getRepository(ClinicalSubEntity);
    const entity = repo.create(data);
    const saved = await repo.save(entity);
    const populated = await repo.findOne({
      where: { id: saved.id },
      relations: ["candidate", "supervisor"],
    });
    return (populated ?? saved) as unknown as IClinicalSubDoc;
  }

  public async getAll(dataSource: DataSource): Promise<IClinicalSubDoc[]> {
    const repo = dataSource.getRepository(ClinicalSubEntity);
    const list = await repo.find({
      relations: ["candidate", "supervisor"],
      order: { createdAt: "DESC" },
    });
    return list as unknown as IClinicalSubDoc[];
  }

  /**
   * Get clinical subs for the resolved institution.
   * When supervisorId is provided (signed-in supervisor), only subs where supervisorDocId = supervisorId.
   * When not provided (institute admin / superadmin), all subs in the institution.
   */
  public async getAssignedToSupervisorOrAll(
    dataSource: DataSource,
    options: { supervisorDocId?: string }
  ): Promise<IClinicalSubDoc[]> {
    const repo = dataSource.getRepository(ClinicalSubEntity);
    const where = options.supervisorDocId ? { supervisorDocId: options.supervisorDocId } : {};
    const list = await repo.find({
      where,
      relations: ["candidate", "supervisor"],
      order: { createdAt: "DESC" },
    });
    return list as unknown as IClinicalSubDoc[];
  }

  /**
   * Get clinical subs for the resolved institution.
   * When candDocId is provided (signed-in candidate), only subs where candDocId = candDocId.
   * When not provided (institute admin / superadmin), all subs in the institution.
   */
  public async getByCandidateOrAll(
    dataSource: DataSource,
    options: { candDocId?: string }
  ): Promise<IClinicalSubDoc[]> {
    const repo = dataSource.getRepository(ClinicalSubEntity);
    const where = options.candDocId ? { candDocId: options.candDocId } : {};
    const list = await repo.find({
      where,
      relations: ["candidate", "supervisor"],
      order: { createdAt: "DESC" },
    });
    return list as unknown as IClinicalSubDoc[];
  }

  public async getById(id: string, dataSource: DataSource): Promise<IClinicalSubDoc | null> {
    if (!UUID_REGEX.test(id)) {
      throw new Error("Invalid clinical sub ID format");
    }
    const repo = dataSource.getRepository(ClinicalSubEntity);
    const row = await repo.findOne({
      where: { id },
      relations: ["candidate", "supervisor"],
    });
    return row as unknown as IClinicalSubDoc | null;
  }

  public async update(
    id: string,
    updateData: Partial<IClinicalSub> & { review?: string | null; reviewedAt?: Date | null },
    dataSource: DataSource
  ): Promise<IClinicalSubDoc | null> {
    if (!UUID_REGEX.test(id)) {
      throw new Error("Invalid clinical sub ID format");
    }
    const repo = dataSource.getRepository(ClinicalSubEntity);
    await repo.update(id, updateData as Partial<ClinicalSubEntity>);
    const updated = await repo.findOne({
      where: { id },
      relations: ["candidate", "supervisor"],
    });
    return updated as unknown as IClinicalSubDoc | null;
  }
}
