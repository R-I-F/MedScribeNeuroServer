import "reflect-metadata";
import { injectable } from "inversify";
import { DataSource, LessThan } from "typeorm";
import { PendingSignupEntity, TPendingSignupRole } from "./pendingSignup.mDbSchema";

/**
 * Repository layer for OTP-verified signup staging rows
 * (docs/OTP_SIGNUP_VERIFICATION_PLAN.md). Business rules live in the provider.
 */
@injectable()
export class PendingSignupService {
  public async create(
    data: {
      role: TPendingSignupRole;
      email: string;
      payload: Record<string, unknown>;
      otpHash: string;
      expiresAt: Date;
      lastSentAt: Date;
    },
    dataSource: DataSource
  ): Promise<PendingSignupEntity> {
    const repo = dataSource.getRepository(PendingSignupEntity);
    const row = repo.create({ ...data, attempts: 0, sendCount: 1 });
    return repo.save(row);
  }

  public async findById(id: string, dataSource: DataSource): Promise<PendingSignupEntity | null> {
    return dataSource.getRepository(PendingSignupEntity).findOne({ where: { id } });
  }

  public async deleteById(id: string, dataSource: DataSource): Promise<void> {
    await dataSource.getRepository(PendingSignupEntity).delete({ id });
  }

  /** One ACTIVE pending per (email, role): a fresh signup replaces any prior attempt. */
  public async deleteByEmailRole(
    email: string,
    role: TPendingSignupRole,
    dataSource: DataSource
  ): Promise<void> {
    await dataSource.getRepository(PendingSignupEntity).delete({ email, role });
  }

  public async incrementAttempts(id: string, dataSource: DataSource): Promise<number> {
    const repo = dataSource.getRepository(PendingSignupEntity);
    await repo.increment({ id }, "attempts", 1);
    const row = await repo.findOne({ where: { id } });
    return row?.attempts ?? 0;
  }

  /** Resend: replace the code and bump the counters. Expiry is NOT extended. */
  public async updateOtp(
    id: string,
    otpHash: string,
    dataSource: DataSource
  ): Promise<void> {
    const repo = dataSource.getRepository(PendingSignupEntity);
    await repo.update({ id }, { otpHash, lastSentAt: new Date() });
    await repo.increment({ id }, "sendCount", 1);
  }

  /** Purge sweep target: rows past their expiry (also enforced at read time). */
  public async deleteExpired(dataSource: DataSource): Promise<number> {
    const result = await dataSource
      .getRepository(PendingSignupEntity)
      .delete({ expiresAt: LessThan(new Date()) });
    return result.affected ?? 0;
  }
}
