import { ICandDoc, ICandCensoredDoc } from "../cand/cand.interface";
import { ISupervisorDoc, ISupervisorCensoredDoc } from "../supervisor/supervisor.interface";

/**
 * Map a full candidate document to the censored shape (no email, phone, password, etc.).
 */
export function toCensoredCand(doc: ICandDoc): ICandCensoredDoc {
  return {
    id: doc.id,
    fullName: doc.fullName,
    regNum: doc.regNum,
    rank: doc.rank,
    regDeg: doc.regDeg,
    approved: doc.approved,
    role: doc.role,
  };
}

/**
 * Map a full supervisor document to the censored shape (no email, phone, password, etc.).
 */
export function toCensoredSupervisor(
  doc: ISupervisorDoc | (Omit<ISupervisorDoc, "password"> & { password?: string })
): ISupervisorCensoredDoc {
  return {
    id: doc.id,
    fullName: doc.fullName,
    position: doc.position,
    canValidate: doc.canValidate,
    approved: doc.approved,
    role: doc.role,
  };
}
