/**
 * View model for the submission case report PDF.
 * All fields are plain values (no TypeORM entities) for use in React-PDF components.
 */
export interface SubmissionReportViewModel {
  submissionId: string;
  /** Procedure/surgery date from cal_surg */
  procedureDate: string;
  /** Candidate */
  candidate: {
    fullName: string;
    email: string;
    regNum: string;
    phoneNum: string;
    rank: string;
  };
  /** Supervisor */
  supervisor: {
    fullName: string;
    position: string;
  };
  /** Calendar surgery (procedure) */
  calSurg: {
    patientName: string;
    patientDob: string;
    gender: string;
    procDate: string;
    hospitalName: string;
    arabProcTitle: string;
    arabProcNumCode: string;
  };
  /** Main diagnosis */
  mainDiagnosis: string;
  /** ICD codes (diagnoses) */
  icds: Array<{ code: string; name: string }>;
  /** CPT codes (procedures) */
  cpts: Array<{ title: string; alphaCode: string; numCode: string; description: string }>;
  /** Submission-specific */
  roleInSurg: string;
  assRoleDesc: string | null;
  otherSurgRank: string;
  otherSurgName: string;
  isItRevSurg: boolean;
  preOpClinCond: string | null;
  insUsed: string;
  consUsed: string;
  consDetails: string | null;
  diagnosisName: string[];
  procedureName: string[];
  surgNotes: string | null;
  IntEvents: string | null;
  spOrCran: string | null;
  pos: string | null;
  approach: string | null;
  region: string | null;
  clinPres: string | null;
  subStatus: string;
  review: string | null;
  reviewedAt: string | null;
  submissionType: string;
  timeStamp: string;
}

export interface SubmissionReportDocumentProps {
  data: SubmissionReportViewModel;
  institutionName: string;
  department?: string;
  /** Logo image: absolute file path or data URL (e.g. data:image/png;base64,...). Data URL is used when provided by the backend for reliable rendering. */
  logoPath?: string;
  /** Font family for Arabic/Unicode text (e.g. procedure title, patient name). Set when Cairo (or similar) is registered. */
  arabicFontFamily?: string;
  /** When true, enable React-PDF debug mode on Page (visual layout boxes in output). Set PDF_DEBUG=1 when running the debug script. */
  debug?: boolean;
}
