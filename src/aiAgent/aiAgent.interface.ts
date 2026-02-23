import { ISubDoc } from "../sub/interfaces/sub.interface";

export interface IGenerateSurgicalNotesInput {
  submission: ISubDoc;
}

export interface IGenerateSurgicalNotesFromVoiceInput {
  submission: ISubDoc;
  audioBuffer: Buffer;
  mimeType: string;
}

export interface IGenerateSurgicalNotesResponse {
  surgicalNotes: string;
}

export interface IFormattedSubmissionData {
  patientInfo: {
    name: string;
    dateOfBirth: Date;
    gender: string;
  };
  hospital: {
    name: string;
    arabName?: string;
  };
  procedure: {
    name: string;
    date: Date;
    description?: string;
  };
  candidate: {
    name: string;
    email: string;
    role: string;
  };
  supervisor: {
    name: string;
    email: string;
  };
  surgeryDetails: {
    roleInSurgery: string;
    assistantRoleDescription?: string;
    otherSurgeons: string;
    otherSurgeonsRank: string;
    isRevisionSurgery: boolean;
    preoperativeCondition?: string;
    instrumentsUsed: string;
    consumablesUsed: string;
    consumablesDetails?: string;
  };
  diagnosis: {
    mainDiagnosis: string;
    diagnoses: string[];
    procedures: string[];
    cptCodes: Array<{ code: string; description?: string }>;
    icdCodes: Array<{ code: string; description?: string }>;
  };
  surgicalData: {
    surgicalNotes?: string;
    intraoperativeEvents?: string;
    spinalOrCranial?: string;
    position?: string;
    approach?: string;
    clinicalPresentation?: string;
    region?: string;
  };
}

