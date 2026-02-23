import { inject, injectable } from "inversify";
import { AiAgentService } from "./aiAgent.service";
import {
  IGenerateSurgicalNotesInput,
  IGenerateSurgicalNotesFromVoiceInput,
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

  /**
   * Generate surgical notes from voice recording + full submission and cal_surg context.
   * Prompt excludes intraoperative events; includes cal_surg extras (timeStamp, formLink, google_uid).
   */
  public async generateSurgicalNotesFromVoice(
    input: IGenerateSurgicalNotesFromVoiceInput
  ): Promise<IGenerateSurgicalNotesResponse> | never {
    try {
      const formattedData = this.formatSubmissionData(input.submission);
      const calSurg = (input.submission as any).calSurg || (input.submission as any).procDocId;
      const calSurgExtras = calSurg && typeof calSurg === "object" ? {
        timeStamp: calSurg.timeStamp,
        formLink: calSurg.formLink,
        google_uid: calSurg.google_uid,
      } : undefined;
      const prompt = this.createPromptForVoice(formattedData, calSurgExtras);
      const audioBase64 = input.audioBuffer.toString("base64");
      const surgicalNotes = await this.aiAgentService.generateContentFromAudioAndText(
        prompt,
        audioBase64,
        input.mimeType
      );

      return {
        surgicalNotes: surgicalNotes.trim(),
      };
    } catch (err: any) {
      throw new Error(err.message || "Failed to generate surgical notes from voice");
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

  private formatDateForPrompt(value: Date | string | undefined): string {
    if (value == null) return "N/A";
    if (typeof value === "string") return value;
    if (value instanceof Date && !isNaN(value.getTime())) return value.toLocaleDateString();
    return "N/A";
  }

  private createPrompt(data: IFormattedSubmissionData): string {
    const prompt = `You are a medical professional assistant specializing in neurosurgery. Generate comprehensive, professional surgical notes based on the following submission data.

PATIENT INFORMATION:
- Name: ${data.patientInfo.name}
- Date of Birth: ${this.formatDateForPrompt(data.patientInfo.dateOfBirth)}
- Gender: ${data.patientInfo.gender}

HOSPITAL:
- Name: ${data.hospital.name}${data.hospital.arabName ? ` (${data.hospital.arabName})` : ""}

PROCEDURE:
- Procedure Name: ${data.procedure.name}
- Procedure Date: ${this.formatDateForPrompt(data.procedure.date)}
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

  /**
   * Prompt for voice-based surgical notes. Excludes intraoperative events.
   * Includes cal_surg extras (timeStamp, formLink, google_uid) when provided.
   * Output = only what was said in the voice (translated to English, structured); no context echo, no placeholders, no markdown.
   */
  private createPromptForVoice(
    data: IFormattedSubmissionData,
    calSurgExtras?: { timeStamp?: Date; formLink?: string; google_uid?: string }
  ): string {
    const prompt = `You are a medical professional assistant. Your only job is to turn the attached voice dictation into clean, professional surgical-note text in English.

RULES (strict):
1. Voice may be in any language. Transcribe and translate to English. Output in English only.
2. The case context below is for your reference only (to understand terms, procedure type, etc.). Do NOT output any of it. Do NOT repeat patient name, diagnosis, procedure name, surgeon, assistant, hospital, instruments from context, or any other context field. Your response must contain ONLY what the speaker actually said in the audio, translated and written as professional surgical notes.
3. Include ONLY what was actually said in the audio. If the speaker did not mention something (e.g. anesthesia, blood loss, complications, postoperative plan), do NOT include that section at all. No placeholders like "[Not specified in audio]", "[Not mentioned]", or "No complications were reported". Omit any section that was not stated in the dictation.
4. Use plain text only. No markdown: no asterisks (**), no bold, no headers like "Surgical Notes". No section labels unless the speaker explicitly dictated them. Prefer flowing professional prose where appropriate.
5. Structure and clean up the dictated content so it reads as proper surgical notes, but do not add information from the context. If the dictation is mostly the procedure description, your output is mostly that description—nothing else.

CASE CONTEXT (reference only; do not repeat any of this in your output):

PATIENT INFORMATION:
- Name: ${data.patientInfo.name}
- Date of Birth: ${this.formatDateForPrompt(data.patientInfo.dateOfBirth)}
- Gender: ${data.patientInfo.gender}

HOSPITAL:
- Name: ${data.hospital.name}${data.hospital.arabName ? ` (${data.hospital.arabName})` : ""}

PROCEDURE:
- Procedure Name: ${data.procedure.name}
- Procedure Date: ${this.formatDateForPrompt(data.procedure.date)}
${data.procedure.description ? `- Description: ${data.procedure.description}` : ""}
${calSurgExtras?.timeStamp ? `- Calendar/Surgery Timestamp: ${this.formatDateForPrompt(calSurgExtras.timeStamp)}` : ""}
${calSurgExtras?.formLink ? `- Form Link: ${calSurgExtras.formLink}` : ""}
${calSurgExtras?.google_uid ? `- Google UID: ${calSurgExtras.google_uid}` : ""}

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

From the attached audio only: transcribe/translate to English and output the dictated content as professional surgical notes. Do not add titles, section headers for missing content, placeholders, or any information from the context above. Plain text only.`;

    return prompt;
  }
}

