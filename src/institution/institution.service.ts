import { DefaultDbDataSource } from "../config/defaultdb.config";
import { InstitutionEntity } from "./institution.mDbSchema";

/**
 * Internal institution shape for DataSourceManager and auth flows.
 * Database credentials come from env (SQL_*_DEFAULT); databaseName from DB.
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

let cache: IInstitution[] | null = null;

async function ensureDefaultDbInitialized(): Promise<void> {
  if (!DefaultDbDataSource.isInitialized) {
    await DefaultDbDataSource.initialize();
  }
}

function entityToInstitution(entity: InstitutionEntity): IInstitution {
  return {
    id: entity.id,
    code: entity.code,
    name: entity.name,
    database: {
      host: process.env.SQL_HOST_DEFAULT!,
      port: parseInt(process.env.SQL_PORT_DEFAULT || "3306", 10),
      database: entity.databaseName,
      username: process.env.SQL_USERNAME_DEFAULT!,
      password: process.env.SQL_PASSWORD_DEFAULT!,
    },
    isActive: entity.isActive,
    isAcademic: entity.isAcademic,
    isPractical: entity.isPractical,
    isClinical: entity.isClinical,
    department: entity.department,
  };
}

async function loadInstitutions(): Promise<IInstitution[]> {
  await ensureDefaultDbInitialized();
  const repo = DefaultDbDataSource.getRepository(InstitutionEntity);
  const rows = await repo.find({ where: { isActive: true } });
  return rows.map(entityToInstitution);
}

async function getCachedInstitutions(): Promise<IInstitution[]> {
  if (cache === null) {
    cache = await loadInstitutions();
  }
  return cache;
}

/**
 * Get institution by ID (from defaultdb)
 */
export async function getInstitutionById(id: string): Promise<IInstitution | undefined> {
  const institutions = await getCachedInstitutions();
  return institutions.find((inst) => inst.id === id);
}

/**
 * Get institution by code (from defaultdb)
 */
export async function getInstitutionByCode(code: string): Promise<IInstitution | undefined> {
  const institutions = await getCachedInstitutions();
  return institutions.find((inst) => inst.code === code);
}

/**
 * Get all active institutions (from defaultdb)
 */
export async function getAllActiveInstitutions(): Promise<IInstitution[]> {
  return getCachedInstitutions();
}

/**
 * Clear cache (e.g. after institution updates)
 */
export function clearInstitutionCache(): void {
  cache = null;
}
