import type { ISubDoc } from "../../sub/interfaces/sub.interface";
import type { SubmissionReportViewModel } from "./submissionReport.types";

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  try {
    const date = d instanceof Date ? d : new Date(d);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return "—";
  }
}

function str(o: unknown): string {
  if (o == null) return "—";
  if (typeof o === "string") return o.trim() || "—";
  return String(o).trim() || "—";
}

/**
 * Maps a populated ISubDoc (from SubService.getSubById) to the view model used by the React-PDF submission report.
 * Does not modify the submission or any existing services.
 */
export function mapSubmissionToViewModel(sub: ISubDoc): SubmissionReportViewModel {
  const raw = sub as any;
  const candidate = raw.candidate;
  const calSurg = raw.calSurg;
  const supervisor = raw.supervisor;
  const mainDiag = raw.mainDiag;
  const hospital = calSurg?.hospital;
  const arabProc = calSurg?.arabProc;

  return {
    submissionId: sub.id,
    procedureDate: calSurg?.procDate ? formatDate(calSurg.procDate) : "—",
    candidate: {
      fullName: candidate?.fullName ?? "—",
      email: candidate?.email ?? "—",
      regNum: candidate?.regNum ?? "—",
      phoneNum: candidate?.phoneNum ?? "—",
      rank: candidate?.rank ?? "—",
    },
    supervisor: {
      fullName: supervisor?.fullName ?? "—",
      position: supervisor?.position ?? "—",
    },
    calSurg: {
      patientName: calSurg?.patientName ?? "—",
      patientDob: calSurg?.patientDob ? formatDate(calSurg.patientDob) : "—",
      gender: calSurg?.gender ?? "—",
      procDate: calSurg?.procDate ? formatDate(calSurg.procDate) : "—",
      hospitalName: hospital?.engName ?? hospital?.arabName ?? "—",
      arabProcTitle: arabProc?.title ?? "—",
      arabProcNumCode: arabProc?.numCode ?? arabProc?.alphaCode ?? "—",
    },
    mainDiagnosis: mainDiag?.title ?? "—",
    icds: Array.isArray(raw.icds)
      ? raw.icds.map((d: any) => ({ code: d?.icdCode ?? "—", name: d?.icdName ?? "—" }))
      : [],
    cpts: Array.isArray(raw.procCpts)
      ? raw.procCpts.map((p: any) => ({
          title: p?.title ?? "—",
          alphaCode: p?.alphaCode ?? "—",
          numCode: p?.numCode ?? "—",
          description: p?.description ?? "—",
        }))
      : [],
    roleInSurg: str(raw.roleInSurg),
    assRoleDesc: raw.assRoleDesc != null && raw.assRoleDesc !== "" ? String(raw.assRoleDesc).trim() : null,
    otherSurgRank: str(raw.otherSurgRank),
    otherSurgName: str(raw.otherSurgName),
    isItRevSurg: Boolean(raw.isItRevSurg),
    preOpClinCond: raw.preOpClinCond != null && raw.preOpClinCond !== "" ? String(raw.preOpClinCond).trim() : null,
    insUsed: str(raw.insUsed),
    consUsed: str(raw.consUsed),
    consDetails: raw.consDetails != null && raw.consDetails !== "" ? String(raw.consDetails).trim() : null,
    diagnosisName: Array.isArray(raw.diagnosisName) ? raw.diagnosisName.map(String) : [],
    procedureName: Array.isArray(raw.procedureName) ? raw.procedureName.map(String) : [],
    surgNotes: raw.surgNotes != null && raw.surgNotes !== "" ? String(raw.surgNotes).trim() : null,
    IntEvents: raw.IntEvents != null && raw.IntEvents !== "" ? String(raw.IntEvents).trim() : null,
    spOrCran: raw.spOrCran != null && raw.spOrCran !== "" ? String(raw.spOrCran).trim() : null,
    pos: raw.pos != null && raw.pos !== "" ? String(raw.pos).trim() : null,
    approach: raw.approach != null && raw.approach !== "" ? String(raw.approach).trim() : null,
    region: raw.region != null && raw.region !== "" ? String(raw.region).trim() : null,
    clinPres: raw.clinPres != null && raw.clinPres !== "" ? String(raw.clinPres).trim() : null,
    subStatus: str(raw.subStatus),
    review: raw.review != null && raw.review !== "" ? String(raw.review).trim() : null,
    reviewedAt: raw.reviewedAt ? formatDate(raw.reviewedAt) : null,
    submissionType: str(raw.submissionType),
    timeStamp: sub.timeStamp ? formatDate(sub.timeStamp) : "—",
  };
}
