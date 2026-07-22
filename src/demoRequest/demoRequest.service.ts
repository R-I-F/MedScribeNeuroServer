import "reflect-metadata";
import { injectable } from "inversify";
import { DataSource, MoreThanOrEqual } from "typeorm";
import { DemoRequestEntity } from "./demoRequest.mDbSchema";

/**
 * Repository layer for landing-page demo requests (docs/BOOK_A_DEMO_PLAN.md).
 * Business rules (honeypot, timing, caps, email budget) live in the provider.
 */
@injectable()
export class DemoRequestService {
  public async create(
    data: {
      fullName: string;
      email: string;
      organization: string | null;
      phoneNum: string | null;
      message: string | null;
      ip: string;
      userAgent: string | null;
    },
    dataSource: DataSource
  ): Promise<DemoRequestEntity> {
    const repo = dataSource.getRepository(DemoRequestEntity);
    const row = repo.create({ ...data, emailedAt: null });
    return repo.save(row);
  }

  /** Per-email cap: accepted requests for this email since `since`. */
  public async countByEmailSince(
    email: string,
    since: Date,
    dataSource: DataSource
  ): Promise<number> {
    return dataSource.getRepository(DemoRequestEntity).count({
      where: { email, createdAt: MoreThanOrEqual(since) },
    });
  }

  /** Per-IP cap: accepted requests from this IP since `since`. */
  public async countByIpSince(
    ip: string,
    since: Date,
    dataSource: DataSource
  ): Promise<number> {
    return dataSource.getRepository(DemoRequestEntity).count({
      where: { ip, createdAt: MoreThanOrEqual(since) },
    });
  }

  /** Global daily email budget: notification emails actually sent since `since`. */
  public async countEmailedSince(since: Date, dataSource: DataSource): Promise<number> {
    return dataSource.getRepository(DemoRequestEntity).count({
      // SQL comparison is never true for NULL emailedAt, so this counts sent-only rows.
      where: { emailedAt: MoreThanOrEqual(since) },
    });
  }

  public async markEmailed(id: string, dataSource: DataSource): Promise<void> {
    await dataSource
      .getRepository(DemoRequestEntity)
      .update({ id }, { emailedAt: new Date() });
  }
}
