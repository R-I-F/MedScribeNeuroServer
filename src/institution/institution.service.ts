/**
 * Single-institution service (KA spoke) — DB-backed.
 *
 * The app serves exactly ONE institution (Kasr Al Ainy / Cairo University). Multi-tenancy is
 * gone: there is no per-institution routing and no `DataSourceManager`. The institution is now a
 * single documented row in the `institutions` table of the KA database (see
 * `institution.mDbSchema.ts` + migration `...610150`), which is the source of truth for the
 * feature flags (`isAcademic` / `isPractical` / `isClinical`) and the display name/code/department.
 *
 * `getInstitution()` loads that row once from the single `AppDataSource` and caches it.
 * The former `getStaticInstitution` / `getInstitutionById` / `getInstitutionByCode` /
 * `getAllActiveInstitutions` names are kept as thin wrappers so existing callers keep working;
 * any id/code argument is accepted and ignored (there is only one institution).
 */

import { AppDataSource, initializeDatabase } from "../config/database.config";
import { InstitutionEntity } from "./institution.mDbSchema";

/**
 * Institution shape used by auth flows and request context. Deliberately has NO per-tenant
 * `database{}` block — connections come from the single `AppDataSource`.
 */
export interface IInstitution {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  isAcademic: boolean;
  isPractical: boolean;
  isClinical: boolean;
  department: string;
}

let cached: IInstitution | null = null;

function toIInstitution(row: InstitutionEntity): IInstitution {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    isActive: row.isActive,
    isAcademic: row.isAcademic,
    isPractical: row.isPractical,
    isClinical: row.isClinical,
    department: row.department ?? "",
  };
}

/**
 * Load (once) and return the single institution from the KA database, caching it.
 * Initializes the DataSource on first use. Throws if the row is missing (seed migration
 * `CreateInstitutionsTable...610150` not applied) — fail-fast on misconfig.
 */
export async function getInstitution(): Promise<IInstitution> {
  if (cached) return cached;

  if (!AppDataSource.isInitialized) {
    await initializeDatabase();
  }

  const row = await AppDataSource.getRepository(InstitutionEntity)
    .createQueryBuilder("i")
    .orderBy("i.createdAt", "ASC")
    .getOne();

  if (!row) {
    throw new Error(
      "institutions table has no row — apply migration CreateInstitutionsTable1783782610150 (KA spoke seed)"
    );
  }

  cached = toIInstitution(row);
  return cached;
}

/**
 * Synchronous accessor for the few call sites that cannot await. Returns the warmed cache
 * (populated by `getInstitution()` at boot). Throws if called before the cache is warm — boot
 * warms it via `getAllActiveInstitutions()` before the server accepts requests.
 */
export function getStaticInstitution(): IInstitution {
  if (!cached) {
    throw new Error(
      "getStaticInstitution() called before the institution cache was warmed — call getInstitution() during boot"
    );
  }
  return cached;
}

/**
 * Get institution by ID — single-institution mode: the id is accepted and ignored,
 * always returning the one institution.
 */
export async function getInstitutionById(_id: string): Promise<IInstitution | undefined> {
  return getInstitution();
}

/**
 * Get institution by code — single-institution mode: accepted and ignored.
 */
export async function getInstitutionByCode(_code: string): Promise<IInstitution | undefined> {
  return getInstitution();
}

/**
 * Get all active institutions — single-institution mode: always the one row.
 * Also serves as the boot-time cache warmer.
 */
export async function getAllActiveInstitutions(): Promise<IInstitution[]> {
  return [await getInstitution()];
}

/**
 * Clear the cache — the row is reloaded from the DB on next use. Used by tests / after an
 * institution-settings update.
 */
export function clearInstitutionCache(): void {
  cached = null;
}
