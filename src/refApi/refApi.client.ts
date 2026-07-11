import "reflect-metadata";
import { injectable } from "inversify";
import axios, { AxiosInstance } from "axios";
import * as dotenv from "dotenv";
import {
  IRefVersion,
  IRefDepartment,
  IRefMainDiag,
  IRefDiagnosis,
  IRefProcCpt,
  IRefLectureTopic,
} from "./refApi.types";

dotenv.config();

/** Typed error surfaced by the hub client (network failure or non-2xx). */
export class RefApiError extends Error {
  constructor(message: string, public status?: number, public cause?: unknown) {
    super(message);
    this.name = "RefApiError";
  }
}

function normalizeBaseUrl(raw: string | undefined): string {
  if (!raw) {
    throw new Error("REF_API_URL is not set");
  }
  const trimmed = raw.trim().replace(/\/+$/, "");
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

/**
 * Typed HTTP client for the LibelusRefApi hub. Sends `X-API-Key`, unwraps the
 * `{ ..., data }` envelope, applies a request timeout, and retries once on network
 * errors / 5xx. This is the ONLY way the spoke reaches shared reference data — it never
 * touches the hub's database directly.
 */
@injectable()
export class RefApiClient {
  private http: AxiosInstance;
  private deptCode: string;

  constructor() {
    const baseURL = normalizeBaseUrl(process.env.REF_API_URL);
    const apiKey = process.env.REF_API_KEY || process.env.REF_API_KA;
    if (!apiKey) {
      throw new Error("REF_API_KEY (or REF_API_KA) is not set");
    }
    this.deptCode = process.env.REF_DEPT_CODE || "NS";
    this.http = axios.create({
      baseURL,
      timeout: parseInt(process.env.REF_API_TIMEOUT_MS || "15000", 10),
      headers: { "X-API-Key": apiKey, "Content-Type": "application/json" },
    });
  }

  public getDeptCode(): string {
    return this.deptCode;
  }

  /** GET with envelope-unwrap + retries (network error / 5xx / 429 rate-limit) with backoff. */
  private async get<T>(path: string): Promise<T> {
    const maxAttempts = 3;
    let lastErr: unknown;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const resp = await this.http.get(path);
        const body = resp.data;
        if (body && typeof body === "object" && "data" in body) {
          return (body as { data: T }).data;
        }
        return body as T;
      } catch (err: any) {
        lastErr = err;
        const status = err?.response?.status as number | undefined;
        const retryable = status === undefined || status >= 500 || status === 429;
        if (retryable && attempt < maxAttempts - 1) {
          // Back off harder on rate-limit; small pause otherwise.
          const delayMs = status === 429 ? 600 * (attempt + 1) : 200;
          await new Promise((r) => setTimeout(r, delayMs));
          continue;
        }
        throw new RefApiError(`GET ${path} failed: ${err?.message ?? "unknown error"}`, status, err);
      }
    }
    throw new RefApiError(`GET ${path} failed after retries`, undefined, lastErr);
  }

  public getVersion(): Promise<IRefVersion> {
    return this.get<IRefVersion>("/v1/version");
  }

  public getDepartments(): Promise<IRefDepartment[]> {
    return this.get<IRefDepartment[]>("/v1/departments");
  }

  public getMainDiagsByDept(deptCode: string = this.deptCode): Promise<IRefMainDiag[]> {
    return this.get<IRefMainDiag[]>(`/v1/departments/${encodeURIComponent(deptCode)}/main-diags`);
  }

  public getDiagnosesByDept(deptCode: string = this.deptCode): Promise<IRefDiagnosis[]> {
    return this.get<IRefDiagnosis[]>(`/v1/departments/${encodeURIComponent(deptCode)}/diagnoses`);
  }

  public getProcCptsByDept(deptCode: string = this.deptCode): Promise<IRefProcCpt[]> {
    return this.get<IRefProcCpt[]>(`/v1/departments/${encodeURIComponent(deptCode)}/proc-cpts`);
  }

  public getDiagnosesByMainDiag(mainDiagId: string): Promise<IRefDiagnosis[]> {
    return this.get<IRefDiagnosis[]>(`/v1/main-diags/${encodeURIComponent(mainDiagId)}/diagnoses`);
  }

  public getProcCptsByMainDiag(mainDiagId: string): Promise<IRefProcCpt[]> {
    return this.get<IRefProcCpt[]>(`/v1/main-diags/${encodeURIComponent(mainDiagId)}/proc-cpts`);
  }

  public getRefLecturesByDept(deptCode: string = this.deptCode): Promise<IRefLectureTopic[]> {
    return this.get<IRefLectureTopic[]>(`/v1/refLectures/department/${encodeURIComponent(deptCode)}`);
  }
}
