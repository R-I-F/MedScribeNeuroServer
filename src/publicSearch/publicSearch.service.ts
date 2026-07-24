import "reflect-metadata";
import { injectable } from "inversify";
import { DataSource, MoreThanOrEqual } from "typeorm";
import { PublicSearchSessionEntity } from "./publicSearchSession.mDbSchema";

/**
 * Repository layer for public-search soft-registration sessions
 * (docs/PUBLIC_SEMANTIC_SEARCH_TOOL_PLAN.md). Anti-abuse + OTP + quota rules live in the provider.
 */
@injectable()
export class PublicSearchService {
  public async create(
    data: {
      email: string;
      otpHash: string;
      maxQueries: number;
      ip: string;
      userAgent: string | null;
      otpExpiresAt: Date;
      lastSentAt: Date;
    },
    dataSource: DataSource
  ): Promise<PublicSearchSessionEntity> {
    const repo = dataSource.getRepository(PublicSearchSessionEntity);
    return repo.save(repo.create({ ...data, verified: false, queryCount: 0, attempts: 0, sendCount: 1 }));
  }

  public findById(id: string, dataSource: DataSource): Promise<PublicSearchSessionEntity | null> {
    return dataSource.getRepository(PublicSearchSessionEntity).findOne({ where: { id } });
  }

  public async deleteById(id: string, dataSource: DataSource): Promise<void> {
    await dataSource.getRepository(PublicSearchSessionEntity).delete({ id });
  }

  /** Per-email/day request cap. */
  public countByEmailSince(email: string, since: Date, dataSource: DataSource): Promise<number> {
    return dataSource
      .getRepository(PublicSearchSessionEntity)
      .count({ where: { email, createdAt: MoreThanOrEqual(since) } });
  }

  /** Per-IP/day request cap. */
  public countByIpSince(ip: string, since: Date, dataSource: DataSource): Promise<number> {
    return dataSource
      .getRepository(PublicSearchSessionEntity)
      .count({ where: { ip, createdAt: MoreThanOrEqual(since) } });
  }

  /** Global daily OTP-email budget (new sessions today). */
  public countCreatedSince(since: Date, dataSource: DataSource): Promise<number> {
    return dataSource
      .getRepository(PublicSearchSessionEntity)
      .count({ where: { createdAt: MoreThanOrEqual(since) } });
  }

  /** Per-EMAIL quota basis: total queries used across all of this email's sessions. */
  public async sumQueryCountByEmail(email: string, dataSource: DataSource): Promise<number> {
    const row = await dataSource
      .getRepository(PublicSearchSessionEntity)
      .createQueryBuilder("s")
      .select("COALESCE(SUM(s.queryCount), 0)", "sum")
      .where("s.email = :email", { email })
      .getRawOne();
    return Number(row?.sum ?? 0);
  }

  public async incrementQueryCount(id: string, dataSource: DataSource): Promise<void> {
    await dataSource.getRepository(PublicSearchSessionEntity).increment({ id }, "queryCount", 1);
  }

  public async markVerified(
    id: string,
    sessionExpiresAt: Date,
    dataSource: DataSource
  ): Promise<void> {
    await dataSource
      .getRepository(PublicSearchSessionEntity)
      .update({ id }, { verified: true, verifiedAt: new Date(), sessionExpiresAt, attempts: 0 });
  }

  public async incrementAttempts(id: string, dataSource: DataSource): Promise<number> {
    await dataSource.getRepository(PublicSearchSessionEntity).increment({ id }, "attempts", 1);
    const row = await this.findById(id, dataSource);
    return row?.attempts ?? 0;
  }

  public async updateOtp(id: string, otpHash: string, dataSource: DataSource): Promise<void> {
    await dataSource
      .getRepository(PublicSearchSessionEntity)
      .createQueryBuilder()
      .update(PublicSearchSessionEntity)
      .set({ otpHash, lastSentAt: () => "now()", sendCount: () => '"sendCount" + 1' })
      .where("id = :id", { id })
      .execute();
  }

  /** Purge unverified-expired and verified-expired sessions. */
  public async deleteExpired(dataSource: DataSource): Promise<number> {
    const res = await dataSource
      .getRepository(PublicSearchSessionEntity)
      .createQueryBuilder()
      .delete()
      .from(PublicSearchSessionEntity)
      .where('("verified" = false AND "otpExpiresAt" < now())')
      .orWhere('("verified" = true AND "sessionExpiresAt" IS NOT NULL AND "sessionExpiresAt" < now())')
      .execute();
    return res.affected ?? 0;
  }
}
