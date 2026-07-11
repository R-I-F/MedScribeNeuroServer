/**
 * Static single-institution shim (KA spoke).
 *
 * The multi-tenant institutions registry (formerly loaded from defaultdb) is gone: this
 * API now serves exactly ONE institution — Kasr El Ainy — pinned from environment
 * variables. The public function signatures are preserved so the ~55 controllers and the
 * institutionResolver middleware that call these keep working untouched; they simply always
 * resolve to the single static institution regardless of the id/code passed in.
 *
 * Env (loaded via `.env.staging` in staging):
 *   INSTITUTION_ID          existing KA institution UUID (kept stable so in-flight JWTs stay valid)
 *   INSTITUTION_CODE        default "KA"
 *   INSTITUTION_NAME        default "Kasr El Ainy"
 *   INSTITUTION_DEPARTMENT  default "neurosurgery"
 *   INSTITUTION_IS_ACADEMIC / _PRACTICAL / _CLINICAL   booleans (default true)
 *   PSQL_HOST / PSQL_PORT / PSQL_DB_NAME / PSQL_USERNAME / PSQL_PASSWORD   KA database
 */

/**
 * Internal institution shape for auth flows and the (now single-source) DataSource resolution.
 * `database` is retained for interface stability; the single AppDataSource is the real source
 * of truth for connections.
 */
export interface IInstitution {
  id: string;
  code: string;
  name: string;
  database: {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
  };
  isActive: boolean;
  isAcademic: boolean;
  isPractical: boolean;
  isClinical: boolean;
  department: string;
}

function parseBool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === "") return fallback;
  const v = value.trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes";
}

let staticInstitution: IInstitution | null = null;

/**
 * Build (once) and return the single pinned KA institution from env.
 * Throws at first use if INSTITUTION_ID is not configured (fail-fast on misconfig).
 */
export function getStaticInstitution(): IInstitution {
  if (staticInstitution) {
    return staticInstitution;
  }

  const id = process.env.INSTITUTION_ID;
  if (!id) {
    throw new Error(
      "INSTITUTION_ID is required in single-institution (KA spoke) mode but is not set"
    );
  }

  staticInstitution = {
    id,
    code: process.env.INSTITUTION_CODE || "KA",
    name: process.env.INSTITUTION_NAME || "Kasr El Ainy",
    database: {
      host: process.env.PSQL_HOST!,
      port: parseInt(process.env.PSQL_PORT || "5432", 10),
      database: process.env.PSQL_DB_NAME || "ka-institute",
      username: process.env.PSQL_USERNAME!,
      password: process.env.PSQL_PASSWORD!,
    },
    isActive: true,
    isAcademic: parseBool(process.env.INSTITUTION_IS_ACADEMIC, true),
    isPractical: parseBool(process.env.INSTITUTION_IS_PRACTICAL, true),
    isClinical: parseBool(process.env.INSTITUTION_IS_CLINICAL, true),
    department: process.env.INSTITUTION_DEPARTMENT || "neurosurgery",
  };

  return staticInstitution;
}

/**
 * Get institution by ID — single-institution mode: the id is accepted and ignored,
 * always returning the static KA institution.
 */
export async function getInstitutionById(_id: string): Promise<IInstitution | undefined> {
  return getStaticInstitution();
}

/**
 * Get institution by code — single-institution mode: accepted and ignored.
 */
export async function getInstitutionByCode(_code: string): Promise<IInstitution | undefined> {
  return getStaticInstitution();
}

/**
 * Get all active institutions — single-institution mode: always the one static KA row.
 */
export async function getAllActiveInstitutions(): Promise<IInstitution[]> {
  return [getStaticInstitution()];
}

/**
 * Clear cache — no-op in single-institution mode (the static row is rebuilt from env on next use).
 */
export function clearInstitutionCache(): void {
  staticInstitution = null;
}
