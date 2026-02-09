/**
 * Maps submission entities to secure API response shape.
 * Strips redundant, sensitive, and unnecessary fields per spec.
 */
type PlainObject = Record<string, unknown>;

const OMIT_SUBMISSION = ["procDocId", "supervisorDocId", "mainDiagDocId", "candidate"] as const;

function omitKeys<T extends PlainObject>(obj: T, keys: readonly string[]): PlainObject {
  if (!obj || typeof obj !== "object") return obj;
  const result: PlainObject = {};
  for (const [k, v] of Object.entries(obj)) {
    if (!keys.includes(k)) result[k] = v;
  }
  return result;
}

function mapHospital(obj: unknown): PlainObject | undefined {
  if (!obj || typeof obj !== "object") return undefined;
  const o = obj as PlainObject;
  const picked: PlainObject = {};
  if (o.id != null) picked.id = o.id;
  if (o.engName != null) picked.engName = o.engName;
  return picked;
}

function mapArabProc(obj: unknown): PlainObject | undefined {
  if (!obj || typeof obj !== "object") return undefined;
  const o = obj as PlainObject;
  const picked: PlainObject = {};
  if (o.id != null) picked.id = o.id;
  if (o.title != null) picked.title = o.title;
  if (o.alphaCode != null) picked.alphaCode = o.alphaCode;
  if (o.numCode != null) picked.numCode = o.numCode;
  if (o.description != null) picked.description = o.description;
  return picked;
}

function mapCalSurg(obj: unknown): PlainObject | undefined {
  if (!obj || typeof obj !== "object") return undefined;
  const o = obj as PlainObject;
  const result: PlainObject = {};
  if (o.id != null) result.id = o.id;
  if (o.patientName != null) result.patientName = o.patientName;
  if (o.patientDob != null) result.patientDob = o.patientDob;
  if (o.gender != null) result.gender = o.gender;
  if (o.procDate != null) result.procDate = o.procDate;
  if (o.hospital) result.hospital = mapHospital(o.hospital);
  if (o.arabProc) result.arabProc = mapArabProc(o.arabProc);
  return result;
}

function mapSupervisor(obj: unknown): PlainObject | undefined {
  if (!obj || typeof obj !== "object") return undefined;
  const o = obj as PlainObject;
  const result: PlainObject = {};
  if (o.id != null) result.id = o.id;
  if (o.fullName != null) result.fullName = o.fullName;
  if (o.position != null) result.position = o.position;
  return result;
}

function mapMainDiag(obj: unknown): PlainObject | undefined {
  if (!obj || typeof obj !== "object") return undefined;
  const o = obj as PlainObject;
  const result: PlainObject = {};
  if (o.id != null) result.id = o.id;
  if (o.title != null) result.title = o.title;
  return result;
}

function mapProcCpt(obj: unknown): PlainObject {
  if (!obj || typeof obj !== "object") return {};
  const o = obj as PlainObject;
  const result: PlainObject = {};
  if (o.id != null) result.id = o.id;
  if (o.title != null) result.title = o.title;
  if (o.alphaCode != null) result.alphaCode = o.alphaCode;
  if (o.numCode != null) result.numCode = o.numCode;
  if (o.description != null) result.description = o.description;
  return result;
}

function mapIcd(obj: unknown): PlainObject {
  if (!obj || typeof obj !== "object") return {};
  const o = obj as PlainObject;
  const result: PlainObject = {};
  if (o.id != null) result.id = o.id;
  if (o.icdCode != null) result.icdCode = o.icdCode;
  if (o.icdName != null) result.icdName = o.icdName;
  return result;
}

export function toCandidateSubmissionResponse(sub: PlainObject): PlainObject {
  const base = omitKeys(sub, OMIT_SUBMISSION as unknown as string[]);
  if (base.calSurg) base.calSurg = mapCalSurg(base.calSurg);
  if (base.supervisor) base.supervisor = mapSupervisor(base.supervisor);
  if (base.mainDiag) base.mainDiag = mapMainDiag(base.mainDiag);
  if (Array.isArray(base.procCpts)) base.procCpts = base.procCpts.map(mapProcCpt);
  if (Array.isArray(base.icds)) base.icds = base.icds.map(mapIcd);
  return base;
}

export function toCandidateSubmissionsResponse(subs: PlainObject[]): PlainObject[] {
  return subs.map(toCandidateSubmissionResponse);
}

// --- Supervisor submission response (trimmed nested payloads) ---

function mapHospitalForSupervisor(obj: unknown): PlainObject | undefined {
  if (!obj || typeof obj !== "object") return undefined;
  const o = obj as PlainObject;
  const picked: PlainObject = {};
  if (o.id != null) picked.id = o.id;
  if (o.arabName != null) picked.arabName = o.arabName;
  if (o.engName != null) picked.engName = o.engName;
  return picked;
}

function mapArabProcForSupervisor(obj: unknown): PlainObject | undefined {
  if (!obj || typeof obj !== "object") return undefined;
  const o = obj as PlainObject;
  const picked: PlainObject = {};
  if (o.id != null) picked.id = o.id;
  if (o.title != null) picked.title = o.title;
  if (o.alphaCode != null) picked.alphaCode = o.alphaCode;
  if (o.description != null) picked.description = o.description;
  return picked;
}

function mapCalSurgForSupervisor(obj: unknown): PlainObject | undefined {
  if (!obj || typeof obj !== "object") return undefined;
  const o = obj as PlainObject;
  const result: PlainObject = {};
  if (o.id != null) result.id = o.id;
  if (o.timeStamp != null) result.timeStamp = o.timeStamp;
  if (o.patientName != null) result.patientName = o.patientName;
  if (o.patientDob != null) result.patientDob = o.patientDob;
  if (o.gender != null) result.gender = o.gender;
  if (o.procDate != null) result.procDate = o.procDate;
  if (o.createdAt != null) result.createdAt = o.createdAt;
  if (o.hospital != null) result.hospital = mapHospitalForSupervisor(o.hospital);
  if (o.arabProc != null) result.arabProc = mapArabProcForSupervisor(o.arabProc);
  return result;
}

function mapCandidateForSupervisor(obj: unknown): PlainObject | null | undefined {
  if (obj == null) return obj as null | undefined;
  if (typeof obj !== "object") return undefined;
  const o = obj as PlainObject;
  const result: PlainObject = {};
  if (o.id != null) result.id = o.id;
  if (o.email != null) result.email = o.email;
  if (o.fullName != null) result.fullName = o.fullName;
  if (o.regNum != null) result.regNum = o.regNum;
  if (o.phoneNum != null) result.phoneNum = o.phoneNum;
  if (o.nationality != null) result.nationality = o.nationality;
  if (o.rank != null) result.rank = o.rank;
  if (o.regDeg != null) result.regDeg = o.regDeg;
  if (o.approved != null) result.approved = o.approved;
  if (o.role != null) result.role = o.role;
  return result;
}

function mapIcdForSupervisor(obj: unknown): PlainObject {
  if (!obj || typeof obj !== "object") return {};
  const o = obj as PlainObject;
  const result: PlainObject = {};
  if (o.id != null) result.id = o.id;
  if (o.icdCode != null) result.icdCode = o.icdCode;
  if (o.icdName != null) result.icdName = o.icdName;
  return result;
}

function mapMainDiagForSupervisor(obj: unknown): PlainObject | undefined {
  if (!obj || typeof obj !== "object") return undefined;
  const o = obj as PlainObject;
  const result: PlainObject = {};
  if (o.id != null) result.id = o.id;
  if (o.title != null) result.title = o.title;
  return result;
}

function mapProcCptForSupervisor(obj: unknown): PlainObject {
  if (!obj || typeof obj !== "object") return {};
  const o = obj as PlainObject;
  const result: PlainObject = {};
  if (o.id != null) result.id = o.id;
  if (o.title != null) result.title = o.title;
  if (o.alphaCode != null) result.alphaCode = o.alphaCode;
  if (o.numCode != null) result.numCode = o.numCode;
  if (o.description != null) result.description = o.description;
  return result;
}

function mapSupervisorForSupervisor(obj: unknown): PlainObject | undefined {
  if (!obj || typeof obj !== "object") return undefined;
  const o = obj as PlainObject;
  const result: PlainObject = {};
  if (o.fullName != null) result.fullName = o.fullName;
  return result;
}

export function toSupervisorSubmissionResponse(sub: PlainObject): PlainObject {
  const out: PlainObject = { ...sub };
  if (out.calSurg != null) out.calSurg = mapCalSurgForSupervisor(out.calSurg);
  if (out.candidate != null) out.candidate = mapCandidateForSupervisor(out.candidate);
  if (Array.isArray(out.icds)) out.icds = (out.icds as unknown[]).map((item) => mapIcdForSupervisor(item));
  if (out.mainDiag != null) out.mainDiag = mapMainDiagForSupervisor(out.mainDiag);
  if (Array.isArray(out.procCpts)) out.procCpts = (out.procCpts as unknown[]).map((item) => mapProcCptForSupervisor(item));
  if (out.supervisor != null) out.supervisor = mapSupervisorForSupervisor(out.supervisor);
  return out;
}

export function toSupervisorSubmissionsResponse(subs: PlainObject[]): PlainObject[] {
  return subs.map(toSupervisorSubmissionResponse);
}
