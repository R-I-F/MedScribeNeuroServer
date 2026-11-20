/**
 * Verifiable E-Certificates (docs/PLATFORM_ENHANCEMENT_PLAN.md, Stage B): issuing, looking up,
 * listing and revoking the `certificates` rows. Plain SQL on the request's DataSource (the table
 * has no TypeORM entity on purpose: nothing else maps it).
 */
import { injectable } from "inversify";
import { DataSource } from "typeorm";
import { createHash, randomBytes } from "crypto";

/** Headline numbers printed on the certificate and shown on the public verify page. */
export interface CertificateSummary {
  approvedCases: number;
  byRole: Record<string, number>;
  hospitals: number;
  academicPoints: number | null;
  eventsAttended: number | null;
  clinicalApproved: number | null;
}

export interface IssuedCertificate {
  id: string;
  code: string;
  issuedAt: Date;
}

export interface CertificateListItem {
  id: string;
  code: string;
  kind: string;
  issuedAt: string;
  issuedByRole: string;
  issuedByName: string | null;
  revokedAt: string | null;
  revokedReason: string | null;
}

export interface PublicCertificateView {
  status: "valid" | "revoked";
  code: string;
  kind: string;
  candidateName: string;
  department: string | null;
  degree: string | null;
  periodFrom: string | null;
  periodTo: string | null;
  issuedAt: string;
  revokedAt: string | null;
  summary: CertificateSummary;
}

/** Crockford base32 without I, L, O, U: nothing a reader can confuse when typing it. */
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/** "LP-7K3Q-9XA2": 8 random symbols (40 bits), grouped for reading aloud. */
export function newCertificateCode(): string {
  const bytes = randomBytes(8);
  const chars = Array.from(bytes, (b) => ALPHABET[b % 32]).join("");
  return `LP-${chars.slice(0, 4)}-${chars.slice(4, 8)}`;
}

/** Accepts the code however it was typed ("lp 7k3q 9xa2", "LP7K3Q9XA2") and returns "LP-7K3Q-9XA2". */
export function canonicalCertificateCode(raw: string): string | null {
  let s = String(raw ?? "").toUpperCase().replace(/[^0-9A-Z]/g, "");
  // Strip the "LP" prefix BEFORE mapping look-alike letters, or its L would become a 1.
  if (s.length === 10 && s.startsWith("LP")) s = s.slice(2);
  const body = s.replace(/O/g, "0").replace(/[IL]/g, "1");
  if (!/^[0-9A-HJKMNP-TV-Z]{8}$/.test(body)) return null;
  return `LP-${body.slice(0, 4)}-${body.slice(4)}`;
}

export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

/** Stable JSON (sorted keys) so the same numbers always hash the same. */
function canonicalJson(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(canonicalJson).join(",")}]`;
  if (v && typeof v === "object") {
    return `{${Object.keys(v as object)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonicalJson((v as any)[k])}`)
      .join(",")}}`;
  }
  return JSON.stringify(v);
}

@injectable()
export class CertificateService {
  public async issue(
    ds: DataSource,
    input: {
      candidateId: string;
      departmentId: string | null;
      kind: "interim" | "final";
      issuedByRole: string;
      issuedById: string | null;
      periodFrom: string | null;
      periodTo: string | null;
      summary: CertificateSummary;
      aiSummary: string | null;
      aiSummaryHash: string | null;
    }
  ): Promise<IssuedCertificate> {
    const dataHash = sha256(
      canonicalJson({ candidateId: input.candidateId, periodFrom: input.periodFrom, periodTo: input.periodTo, summary: input.summary })
    );
    // A code collision (1 in 2^40 per pair) is retried rather than assumed impossible.
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = newCertificateCode();
      try {
        const rows = await ds.query(
          `INSERT INTO "certificates"
             ("code","candidateId","departmentId","kind","issuedByRole","issuedById","periodFrom","periodTo",
              "summary","dataHash","aiSummary","aiSummaryHash")
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11,$12)
           RETURNING "id", "code", "issuedAt"`,
          [
            code,
            input.candidateId,
            input.departmentId,
            input.kind,
            input.issuedByRole,
            input.issuedById,
            input.periodFrom,
            input.periodTo,
            JSON.stringify(input.summary),
            dataHash,
            input.aiSummary,
            input.aiSummaryHash,
          ]
        );
        return rows[0];
      } catch (err: any) {
        if (String(err?.message ?? "").includes("UQ_certificates_code")) continue;
        throw err;
      }
    }
    throw new Error("Could not allocate a certificate code");
  }

  /** The cached Gemini summary for this exact snapshot, if a previous certificate has one. */
  public async cachedAiSummary(ds: DataSource, candidateId: string, aiSummaryHash: string): Promise<string | null> {
    const rows = await ds.query(
      `SELECT "aiSummary" FROM "certificates"
        WHERE "candidateId" = $1 AND "aiSummaryHash" = $2 AND "aiSummary" IS NOT NULL
        ORDER BY "issuedAt" DESC LIMIT 1`,
      [candidateId, aiSummaryHash]
    );
    return rows[0]?.aiSummary ?? null;
  }

  public async listForCandidate(ds: DataSource, candidateId: string): Promise<CertificateListItem[]> {
    return ds.query(
      `SELECT c."id", c."code", c."kind",
              to_char(c."issuedAt", 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "issuedAt",
              c."issuedByRole",
              COALESCE(a."fullName", sa."fullName", cand."fullName") AS "issuedByName",
              to_char(c."revokedAt", 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "revokedAt",
              c."revokedReason"
         FROM "certificates" c
         LEFT JOIN "institute_admins" a ON a."id" = c."issuedById"
         LEFT JOIN "super_admins" sa ON sa."id" = c."issuedById"
         LEFT JOIN "candidates" cand ON cand."id" = c."issuedById"
        WHERE c."candidateId" = $1
        ORDER BY c."issuedAt" DESC`,
      [candidateId]
    );
  }

  /** For revocation: the row's candidate and department, so the caller can check scope. */
  public async findForRevoke(ds: DataSource, id: string): Promise<{ id: string; candidateId: string; departmentId: string | null; revokedAt: Date | null } | null> {
    const rows = await ds.query(
      `SELECT c."id", c."candidateId", cand."departmentId", c."revokedAt"
         FROM "certificates" c JOIN "candidates" cand ON cand."id" = c."candidateId"
        WHERE c."id" = $1`,
      [id]
    );
    return rows[0] ?? null;
  }

  public async revoke(ds: DataSource, id: string, reason: string, revokedById: string | null): Promise<boolean> {
    const result = await ds.query(
      `UPDATE "certificates" SET "revokedAt" = now(), "revokedReason" = $2, "revokedById" = $3
        WHERE "id" = $1 AND "revokedAt" IS NULL RETURNING "id"`,
      [id, reason, revokedById]
    );
    // TypeORM's query() returns [rows, affectedCount] for UPDATE ... RETURNING on Postgres,
    // not the rows alone, so counting `result` directly would always say 2.
    const rows = Array.isArray(result?.[0]) ? result[0] : result;
    return rows.length === 1;
  }

  /**
   * Public lookup by code. Returns only what a third party needs to check the document:
   * no email, phone, registration number, patient data or revocation reason.
   */
  public async publicView(ds: DataSource, code: string): Promise<PublicCertificateView | null> {
    const rows = await ds.query(
      `SELECT c."code", c."kind", c."summary",
              to_char(c."periodFrom", 'YYYY-MM-DD') AS "periodFrom",
              to_char(c."periodTo", 'YYYY-MM-DD') AS "periodTo",
              to_char(c."issuedAt", 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "issuedAt",
              to_char(c."revokedAt", 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "revokedAt",
              cand."fullName" AS "candidateName", cand."regDeg"::text AS "degree",
              d."name" AS "department"
         FROM "certificates" c
         JOIN "candidates" cand ON cand."id" = c."candidateId"
         LEFT JOIN "departments" d ON d."id" = c."departmentId"
        WHERE c."code" = $1`,
      [code]
    );
    const r = rows[0];
    if (!r) return null;
    return {
      status: r.revokedAt ? "revoked" : "valid",
      code: r.code,
      kind: r.kind,
      candidateName: r.candidateName,
      department: r.department ?? null,
      degree: r.degree ?? null,
      periodFrom: r.periodFrom ?? null,
      periodTo: r.periodTo ?? null,
      issuedAt: r.issuedAt,
      revokedAt: r.revokedAt ?? null,
      summary: r.summary,
    };
  }
}
