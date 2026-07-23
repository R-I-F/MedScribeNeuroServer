import { injectable } from "inversify";
import { DataSource } from "typeorm";
import { LoginEventEntity } from "./loginEvent.mDbSchema";

/**
 * Appends one row to `login_events` per successful login
 * (docs/ACTIVE_USERS_ANALYTICS_PLAN.md, Stage B).
 *
 * Logins are the only "active user" signal recorded nowhere else, so this is their
 * single source of truth. FAIL-OPEN: a logging failure must never block a login, so
 * every write is wrapped and swallowed with a warning.
 */
@injectable()
export class LoginEventService {
  async record(
    dataSource: DataSource,
    entry: {
      userId: string;
      userRole: string;
      departmentId?: string | null;
      ip?: string | null;
      userAgent?: string | null;
    }
  ): Promise<void> {
    try {
      const repo = dataSource.getRepository(LoginEventEntity);
      await repo.insert({
        userId: entry.userId,
        userRole: entry.userRole,
        departmentId: entry.departmentId ?? null,
        ip: entry.ip ?? null,
        userAgent: entry.userAgent ? entry.userAgent.slice(0, 512) : null,
      });
    } catch (err: any) {
      // Never fail a login because the audit write failed.
      console.warn(
        `[LoginEvent] failed to record login for ${entry.userRole} ${entry.userId}: ${err?.message ?? err}`
      );
    }
  }
}
