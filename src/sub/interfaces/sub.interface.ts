import { Types, Document } from "mongoose";

export type TRoleInSurg = 
  "operator" 
| "operator with supervisor scrubbed (assisted)" 
| "supervising, teaching a junior colleague (scrubbed)" 
| "assistant" 
| "observer (Scrubbed)";

export type TOtherSurgRank = 
  "professor" 
| "assistant professor" 
| "lecturer" 
| "assistant lecturer" 
| "resident (cairo university)" 
| "guest specialist" 
| "guest resident" 
| "other";

export type TInsUsed = 
  "endoscope" 
| "microscope" 
| "high speed drill" 
| "neuro-monitoring" 
| "ultrasonic aspirator" 
| "ultrasound and or doppler /intraoperative" 
| "stereotactic frame" 
| "radiofrequency device" 
| "neuronavigation" 
| "c-Arm" 
| "none";

export type TConsUsed = 
  "artificial dural graft" 
| "external ventricular drain" 
| "bone cement" 
| "intervertebral cage" 
| "nervous system stimulator" 
| "pedicle screws" 
| "lp shunt" 
| "omaya resevoir, ventricular stent" 
| "titanium mesh/ and or miniplates" 
| "vp shunt- fixed pressure" 
| "vp shunt- programmable" 
| "csf drainage system, otherwise than vp, lp and evd" 
| "other" 
| "none";



export type TMainDiagTitle = 
  "congenital anomalies, infantile hydrocephalus" 
| "cns tumors" 
| "cns infection" 
| "cranial trauma" 
| "spinal trauma" 
| "peripheral nerve diseases" 
| "neuro-vascular diseases" 
| "csf disorders- other than infantile hydrocephalus" 
| "spinal degenerative diseases" 
| "functional neurosurgery";

export type TSubStatus = "approved" | "pending" | "rejected";

export interface ISubRawData {
  "Timestamp": string;
  "Email Address": string;
  "Procedure Unique ID (prefilled)": string;
  "Select your supervisor": string;
  "Role in Surgery": string;
  "If ASSISTANT describe your role": string;
  "Other Surgeons in the operation": string;
  "Name the other surgeons": string;
  "Is it a revision surgery?": string;
  "Preoperative Clinical Condition": string;
  "Please Check if one of the following instruments were used": string;
  "Please Check if any of the following consumables were used": string;
  "Give details of the consumables": string;
  "Main Diagnosis": string;
  "Diagnosis": string;
  "Procedure": string;
  "Surgical Notes": string;
  "Intraoperative events": string;
  "Spinal or Cranial?": string;
  "Provisional Diagnosis": string;
  "Position": string;
  "Approach": string;
  "Procedure(s)": string;
  "Surgical Notes_2": string;
  "Intraoperative events_2": string;
  "Diagnosis_2": string;
  "Procedure_2": string;
  "Surgical Notes_3": string;
  "Intraoperative events_3": string;
  "Provisional Diagnosis_2": string;
  "Procedure_3": string;
  "Surgical Notes_4": string;
  "Intraoperative events_4": string;
  "Provisional Diagnosis_3": string;
  "Procedure_4": string;
  "Surgical Notes_5": string;
  "Intraoperative events_5": string;
  "Region": string;
  "Provisional Diagnosis_4": string;
  "Procedure_5": string;
  "Surgical Notes_6": string;
  "Intraoperative events_6": string;
  "Diagnosis_3": string;
  "Procedure_6": string;
  "Surgical Notes_7": string;
  "Clinical Presentation": string;
  "Provisional diagnosis": string;
  "Procedure_7": string;
  "Surgical Notes_8": string;
  "Diagnosis_4": string;
  "Clinical Condition": string;
  "Procedure_8": string;
  "Surgical notes": string;
  "Intraoperative Events": string;
  "Diagnosis_5": string;
  "Management": string;
  "Surgical notes_2": string;
  "Intraoperative Events_2": string;
  "uid": string;
  "status": string;
  "AlphaCode": string;
  "NumCode": string;
  "ICD": string;
}

export interface IDiagProc {
  diagnosisName: string[];
  procedureName: string[];
}

export interface INotesIntEvents {
  surgNotes?: string;
  IntEvents?: string;
}

export interface ICongAnom extends IDiagProc, INotesIntEvents {}

export interface ICnsTumor extends IDiagProc, INotesIntEvents {
  spOrCran?: "spinal" | "cranial";
  pos: "supine" | 'prone' | 'lateral' | 'concorde' | 'other';
  approach: string ;
}

export interface ICnsInf extends IDiagProc, INotesIntEvents {}

export interface ICranTrauma extends IDiagProc, INotesIntEvents {}

export interface ISpTrauma extends IDiagProc, INotesIntEvents {}

export interface ISpDegenDis extends IDiagProc, INotesIntEvents {
  region: "craniocervical" | "cervical" | "dorsal" | "lumbar"
}

export interface IPrhp extends IDiagProc, INotesIntEvents {}

export interface INeuroVasDis extends IDiagProc, INotesIntEvents {
  clinPres?: string;
}

export interface IFuncNeuro extends IDiagProc, INotesIntEvents {}

export interface ICsf extends IDiagProc, INotesIntEvents {}

export interface ISubBase {
  timeStamp: Date | never | undefined;
  candDocId: Types.ObjectId ;
  procDocId: Types.ObjectId ;
  supervisorDocId: Types.ObjectId ;
  roleInSurg: TRoleInSurg;
  assRoleDesc?: string;
  otherSurgRank: TOtherSurgRank;
  otherSurgName: string;
  isItRevSurg: boolean;
  preOpClinCond?: string;
  insUsed: TInsUsed;
  consUsed: TConsUsed;
  consDetails?: string;
  mainDiagDocId: Types.ObjectId | undefined;
  subGoogleUid: string;
  subStatus: "approved" | "pending" | "rejected";
  procCptDocId: Types.ObjectId[] ;
  icdDocId: Types.ObjectId[] ;
}

export interface ISubCongAnom extends ISubBase, ICongAnom {}
export interface ISubCnsTumor extends ISubBase, ICnsTumor {}
export interface ISubCnsInf extends ISubBase, ICnsInf {}
export interface ISubCranTrauma extends ISubBase, ICranTrauma {}
export interface ISubSpTrauma extends ISubBase, ISpTrauma {}
export interface ISubSpDegenDis extends ISubBase, ISpDegenDis {}
export interface ISubPrhp extends ISubBase, IPrhp {}
export interface ISubNeuroVasDis extends ISubBase, INeuroVasDis {}
export interface ISubFuncNeuro extends ISubBase, IFuncNeuro {}
export interface ISubCsf extends ISubBase, ICsf {}

export type SubPayloadMap = {
  "congenital anomalies, infantile hydrocephalus": ISubCongAnom;
  "cns tumors": ISubCnsTumor;
  "cns infection": ISubCnsInf;
  "cranial trauma": ISubCranTrauma;
  "spinal trauma": ISubSpTrauma;
  "spinal degenerative diseases": ISubSpDegenDis;
  "peripheral nerve diseases": ISubPrhp;
  "neuro-vascular diseases": ISubNeuroVasDis;
  "csf disorders- other than infantile hydrocephalus": ISubCsf;
  "functional neurosurgery": ISubFuncNeuro;
};

export type ISub =
  | ISubCongAnom
  | ISubCnsTumor
  | ISubCnsInf
  | ISubCranTrauma
  | ISubSpTrauma
  | ISubSpDegenDis
  | ISubPrhp
  | ISubNeuroVasDis
  | ISubFuncNeuro
  | ISubCsf;

export type ISubDoc = ISub & Document;