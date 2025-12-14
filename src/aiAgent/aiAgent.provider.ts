import { inject, injectable } from "inversify";
import { AiAgentService } from "./aiAgent.service";
import {
  IGenerateSurgicalNotesInput,
  IGenerateSurgicalNotesResponse,
  IFormattedSubmissionData,
} from "./aiAgent.interface";
import { ISubDoc } from "../sub/interfaces/sub.interface";

@injectable()
export class AiAgentProvider {
  constructor(@inject(AiAgentService) private aiAgentService: AiAgentService) {}

  public async generateSurgicalNotes(
    input: IGenerateSurgicalNotesInput
  ): Promise<IGenerateSurgicalNotesResponse> | never {
    try {
      const formattedData = this.formatSubmissionData(input.submission);
      const prompt = this.createPrompt(formattedData);
      const surgicalNotes = await this.aiAgentService.generateText(prompt);

      return {
        surgicalNotes: surgicalNotes.trim(),
      };
    } catch (err: any) {
      throw new Error(err.message || "Failed to generate surgical notes");
    }
  }

  private formatSubmissionData(submission: ISubDoc): IFormattedSubmissionData {
    // Type guard to check if populated fields exist
    const candDocId = submission.candDocId as any;
    const procDocId = submission.procDocId as any;
    const supervisorDocId = submission.supervisorDocId as any;
    const mainDiagDocId = submission.mainDiagDocId as any;
    const procCptDocId = submission.procCptDocId as any;
    const icdDocId = submission.icdDocId as any;

    return {
      patientInfo: {
        name: procDocId?.patientName || "N/A",
        dateOfBirth: procDocId?.patientDob || new Date(),
        gender: procDocId?.gender || "N/A",
      },
      hospital: {
        name: procDocId?.hospital?.engName || "N/A",
        arabName: procDocId?.hospital?.arabName,
      },
      procedure: {
        name: procDocId?.arabProc?.title || "N/A",
        date: procDocId?.procDate || submission.timeStamp || new Date(),
        description: procDocId?.arabProc?.description,
      },
      candidate: {
        name: candDocId?.fullName || "N/A",
        email: candDocId?.email || "N/A",
        role: candDocId?.role || "N/A",
      },
      supervisor: {
        name: supervisorDocId?.fullName || "N/A",
        email: supervisorDocId?.email || "N/A",
      },
      surgeryDetails: {
        roleInSurgery: submission.roleInSurg || "N/A",
        assistantRoleDescription: submission.assRoleDesc,
        otherSurgeons: submission.otherSurgName || "N/A",
        otherSurgeonsRank: submission.otherSurgRank || "N/A",
        isRevisionSurgery: submission.isItRevSurg || false,
        preoperativeCondition: submission.preOpClinCond,
        instrumentsUsed: submission.insUsed || "N/A",
        consumablesUsed: submission.consUsed || "N/A",
        consumablesDetails: submission.consDetails,
      },
      diagnosis: {
        mainDiagnosis: mainDiagDocId?.title || "N/A",
        diagnoses: submission.diagnosisName || [],
        procedures: submission.procedureName || [],
        cptCodes: Array.isArray(procCptDocId)
          ? procCptDocId.map((cpt: any) => ({
              code: cpt?.numCode || "N/A",
              description: cpt?.description,
            }))
          : [],
        icdCodes: Array.isArray(icdDocId)
          ? icdDocId.map((icd: any) => ({
              code: icd?.code || "N/A",
              description: icd?.description,
            }))
          : [],
      },
      surgicalData: {
        surgicalNotes: (submission as any).surgNotes,
        intraoperativeEvents: (submission as any).IntEvents,
        spinalOrCranial: (submission as any).spOrCran,
        position: (submission as any).pos,
        approach: (submission as any).approach,
        clinicalPresentation: (submission as any).clinPres,
        region: (submission as any).region,
      },
    };
  }

  private createPrompt(data: IFormattedSubmissionData): string {
    const prompt = `You are a medical professional assistant specializing in neurosurgery. Generate comprehensive, professional surgical notes based on the following submission data.

PATIENT INFORMATION:
- Name: ${data.patientInfo.name}
- Date of Birth: ${data.patientInfo.dateOfBirth.toLocaleDateString()}
- Gender: ${data.patientInfo.gender}

HOSPITAL:
- Name: ${data.hospital.name}${data.hospital.arabName ? ` (${data.hospital.arabName})` : ""}

PROCEDURE:
- Procedure Name: ${data.procedure.name}
- Procedure Date: ${data.procedure.date.toLocaleDateString()}
${data.procedure.description ? `- Description: ${data.procedure.description}` : ""}

SURGICAL TEAM:
- Candidate/Surgeon: ${data.candidate.name} (${data.candidate.email})
- Supervisor: ${data.supervisor.name} (${data.supervisor.email})
- Role in Surgery: ${data.surgeryDetails.roleInSurgery}
${data.surgeryDetails.assistantRoleDescription ? `- Assistant Role Description: ${data.surgeryDetails.assistantRoleDescription}` : ""}
- Other Surgeons: ${data.surgeryDetails.otherSurgeons} (${data.surgeryDetails.otherSurgeonsRank})
- Revision Surgery: ${data.surgeryDetails.isRevisionSurgery ? "Yes" : "No"}

PREOPERATIVE INFORMATION:
${data.surgeryDetails.preoperativeCondition ? `- Preoperative Clinical Condition: ${data.surgeryDetails.preoperativeCondition}` : ""}

EQUIPMENT AND MATERIALS:
- Instruments Used: ${data.surgeryDetails.instrumentsUsed}
- Consumables Used: ${data.surgeryDetails.consumablesUsed}
${data.surgeryDetails.consumablesDetails ? `- Consumables Details: ${data.surgeryDetails.consumablesDetails}` : ""}

DIAGNOSIS:
- Main Diagnosis: ${data.diagnosis.mainDiagnosis}
- Diagnoses: ${data.diagnosis.diagnoses.join(", ") || "N/A"}
- Procedures: ${data.diagnosis.procedures.join(", ") || "N/A"}

CPT CODES:
${data.diagnosis.cptCodes.length > 0 ? data.diagnosis.cptCodes.map(cpt => `- ${cpt.code}${cpt.description ? `: ${cpt.description}` : ""}`).join("\n") : "N/A"}

ICD CODES:
${data.diagnosis.icdCodes.length > 0 ? data.diagnosis.icdCodes.map(icd => `- ${icd.code}${icd.description ? `: ${icd.description}` : ""}`).join("\n") : "N/A"}

SURGICAL DETAILS:
${data.surgicalData.spinalOrCranial ? `- Spinal or Cranial: ${data.surgicalData.spinalOrCranial}` : ""}
${data.surgicalData.position ? `- Position: ${data.surgicalData.position}` : ""}
${data.surgicalData.approach ? `- Approach: ${data.surgicalData.approach}` : ""}
${data.surgicalData.region ? `- Region: ${data.surgicalData.region}` : ""}
${data.surgicalData.clinicalPresentation ? `- Clinical Presentation: ${data.surgicalData.clinicalPresentation}` : ""}
${data.surgicalData.surgicalNotes ? `- Existing Surgical Notes: ${data.surgicalData.surgicalNotes}` : ""}
${data.surgicalData.intraoperativeEvents ? `- Intraoperative Events: ${data.surgicalData.intraoperativeEvents}` : ""}

Please generate comprehensive, professional surgical notes that include:
1. Preoperative diagnosis
2. Postoperative diagnosis
3. Procedure performed
4. Surgeon(s) and assistant(s)
5. Anesthesia type (if available)
6. Procedure description with detailed steps
7. Findings during surgery
8. Instruments and materials used
9. Intraoperative events or complications (if any)
10. Estimated blood loss (if applicable)
11. Postoperative plan

Format the notes in a clear, professional medical format suitable for a surgical report.`;

    return prompt;
  }
}

