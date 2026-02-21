import { inject, injectable } from "inversify";
import { DataSource } from "typeorm";
import { IMainDiag, IMainDiagDoc, IMainDiagInput, IMainDiagUpdateInput } from "./mainDiag.interface";
import { MainDiagEntity } from "./mainDiag.mDbSchema";
import { ProcCptService } from "../procCpt/procCpt.service";
import { DiagnosisService } from "../diagnosis/diagnosis.service";
import { UtilService } from "../utils/utils.service";
import { AdditionalQuestionsProvider } from "../additionalQuestions/additionalQuestions.provider";
import { Repository, In } from "typeorm";
import { ProcCptEntity } from "../procCpt/procCpt.mDbSchema";
import { DiagnosisEntity } from "../diagnosis/diagnosis.mDbSchema";

@injectable()
export class MainDiagProvider {
  constructor(
    @inject(ProcCptService) private procCptService: ProcCptService,
    @inject(DiagnosisService) private diagnosisService: DiagnosisService,
    @inject(UtilService) private utilService: UtilService,
    @inject(AdditionalQuestionsProvider) private additionalQuestionsProvider: AdditionalQuestionsProvider
  ) {}

  public async createMainDiag(validatedReq: IMainDiagInput, dataSource: DataSource): Promise<IMainDiagDoc> | never {
    try {
      const mainDiagRepository = dataSource.getRepository(MainDiagEntity);
      
      // Convert procsArray (numCodes) to UUIDs using ProcCpt service
      let procUuids: string[] = [];
      if (validatedReq.procsArray && validatedReq.procsArray.length > 0) {
        const procDocs = await this.procCptService.findByNumCodes(validatedReq.procsArray, dataSource);
        procUuids = procDocs.map(doc => doc.id);
        
        // Check if all requested numCodes were found
        const foundNumCodes = procDocs.map(doc => doc.numCode);
        const missingNumCodes = validatedReq.procsArray.filter(code => !foundNumCodes.includes(code));
        if (missingNumCodes.length > 0) {
          throw new Error(`The following numCodes were not found: ${missingNumCodes.join(', ')}`);
        }
      }

      // Convert diagnosis (icdCodes) to UUIDs using Diagnosis service
      let diagnosisUuids: string[] = [];
      if (validatedReq.diagnosis && validatedReq.diagnosis.length > 0) {
        const diagnosisDocs = await this.diagnosisService.findByIcdCodes(validatedReq.diagnosis, dataSource);
        diagnosisUuids = diagnosisDocs.map(doc => doc.id);
        
        // Check if all requested icdCodes were found
        const foundIcdCodes = diagnosisDocs.map(doc => doc.icdCode);
        const missingIcdCodes = validatedReq.diagnosis.filter(code => !foundIcdCodes.includes(code));
        if (missingIcdCodes.length > 0) {
          throw new Error(`The following icdCodes were not found: ${missingIcdCodes.join(', ')}`);
        }
      }

      // Create mainDiag entity with UUIDs and sanitized title
      const mainDiagEntity = mainDiagRepository.create({
        title: this.utilService.stringToLowerCaseTrim(validatedReq.title),
      });

      // Save first to get the ID
      const savedMainDiag = await mainDiagRepository.save(mainDiagEntity);

      // Load related entities and set relationships
      if (procUuids.length > 0) {
        const procRepository = dataSource.getRepository(ProcCptEntity);
        const procEntities = await procRepository.find({
          where: { id: In(procUuids) },
        });
        savedMainDiag.procs = procEntities as ProcCptEntity[];
      }

      if (diagnosisUuids.length > 0) {
        const diagnosisRepository = dataSource.getRepository(DiagnosisEntity);
        const diagnosisEntities = await diagnosisRepository.find({
          where: { id: In(diagnosisUuids) },
        });
        savedMainDiag.diagnosis = diagnosisEntities as DiagnosisEntity[];
      }

      // Save with relationships
      const finalMainDiag = await mainDiagRepository.save(savedMainDiag);

      // Load with relations for return
      const result = await mainDiagRepository.findOne({
        where: { id: finalMainDiag.id },
        relations: ["procs", "diagnosis"],
      });

      return result as unknown as IMainDiagDoc;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getAllMainDiags(dataSource: DataSource): Promise<IMainDiagDoc[]> | never {
    try {
      const mainDiagRepository = dataSource.getRepository(MainDiagEntity);
      const allMainDiags = await mainDiagRepository.find({
        relations: ["procs", "diagnosis"],
        order: { createdAt: "DESC" },
      });
      const additionalQuestionsList = await this.additionalQuestionsProvider.getAll(dataSource);
      const aqByMainDiagId = new Map(
        additionalQuestionsList.map((aq) => [aq.mainDiagDocId, aq])
      );
      const result: IMainDiagDoc[] = allMainDiags.map((md) => {
        const doc = md as unknown as IMainDiagDoc;
        doc.additionalQuestions = aqByMainDiagId.get(md.id) ?? null;
        return doc;
      });
      return result;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getMainDiagById(id: string, dataSource: DataSource): Promise<IMainDiagDoc | null> | never {
    try {
      const mainDiagRepository = dataSource.getRepository(MainDiagEntity);
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        throw new Error("Invalid mainDiag ID format");
      }
      const mainDiag = await mainDiagRepository.findOne({
        where: { id },
        relations: ["procs", "diagnosis"],
      });
      if (!mainDiag) return null;
      const doc = mainDiag as unknown as IMainDiagDoc;
      doc.additionalQuestions = await this.additionalQuestionsProvider.getByMainDiagDocId(id, dataSource) ?? null;
      return doc;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async updateMainDiag(validatedReq: IMainDiagUpdateInput, dataSource: DataSource): Promise<IMainDiagDoc | null> | never {
    try {
      const mainDiagRepository = dataSource.getRepository(MainDiagEntity);
      const { id, ...updateData } = validatedReq;
      
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        throw new Error("Invalid mainDiag ID format");
      }

      // Fetch existing mainDiag with relations
      const existingMainDiag = await mainDiagRepository.findOne({
        where: { id },
        relations: ["procs", "diagnosis"],
      });
      
      if (!existingMainDiag) {
        throw new Error("MainDiag not found");
      }

      // Update title if provided
      if (updateData.title !== undefined) {
        existingMainDiag.title = this.utilService.stringToLowerCaseTrim(updateData.title);
      }

      // Handle procs: append new ones to existing array
      if (updateData.procs && updateData.procs.length > 0) {
        const procDocs = await this.procCptService.findByNumCodes(updateData.procs, dataSource);
        
        // Check if all requested numCodes were found
        const foundNumCodes = procDocs.map(doc => doc.numCode);
        const missingNumCodes = updateData.procs.filter(code => !foundNumCodes.includes(code));
        if (missingNumCodes.length > 0) {
          throw new Error(`The following numCodes were not found: ${missingNumCodes.join(', ')}`);
        }

        // Get new proc entities
        const newProcUuids = procDocs.map(doc => doc.id);
        const procRepository = dataSource.getRepository(ProcCptEntity);
        const newProcEntities = await procRepository.find({
          where: { id: In(newProcUuids) },
        }) as ProcCptEntity[];

        // Merge with existing procs, avoiding duplicates
        const existingProcIds = existingMainDiag.procs.map(p => p.id);
        const uniqueNewProcs = newProcEntities.filter(p => !existingProcIds.includes(p.id));
        existingMainDiag.procs = [...existingMainDiag.procs, ...uniqueNewProcs] as ProcCptEntity[];
      }

      // Handle diagnosis: append new ones to existing array
      if (updateData.diagnosis && updateData.diagnosis.length > 0) {
        const diagnosisDocs = await this.diagnosisService.findByIcdCodes(updateData.diagnosis, dataSource);
        
        // Check if all requested icdCodes were found
        const foundIcdCodes = diagnosisDocs.map(doc => doc.icdCode);
        const missingIcdCodes = updateData.diagnosis.filter(code => !foundIcdCodes.includes(code));
        if (missingIcdCodes.length > 0) {
          throw new Error(`The following icdCodes were not found: ${missingIcdCodes.join(', ')}`);
        }

        // Get new diagnosis entities
        const newDiagnosisUuids = diagnosisDocs.map(doc => doc.id);
        const diagnosisRepository = dataSource.getRepository(DiagnosisEntity);
        const newDiagnosisEntities = await diagnosisRepository.find({
          where: { id: In(newDiagnosisUuids) },
        }) as DiagnosisEntity[];

        // Merge with existing diagnosis, avoiding duplicates
        const existingDiagnosisIds = existingMainDiag.diagnosis.map(d => d.id);
        const uniqueNewDiagnosis = newDiagnosisEntities.filter(d => !existingDiagnosisIds.includes(d.id));
        existingMainDiag.diagnosis = [...existingMainDiag.diagnosis, ...uniqueNewDiagnosis] as DiagnosisEntity[];
      }

      // Save updated mainDiag
      const updatedMainDiag = await mainDiagRepository.save(existingMainDiag);

      // Load with relations for return
      const result = await mainDiagRepository.findOne({
        where: { id: updatedMainDiag.id },
        relations: ["procs", "diagnosis"],
      });

      return result as unknown as IMainDiagDoc | null;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async deleteMainDiag(id: string, dataSource: DataSource): Promise<boolean> | never {
    try {
      const mainDiagRepository = dataSource.getRepository(MainDiagEntity);
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        throw new Error("Invalid mainDiag ID format");
      }
      const result = await mainDiagRepository.delete(id);
      return (result.affected ?? 0) > 0;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  /** Remove CPT (proc) links from a mainDiag by numCodes. */
  public async removeProcsFromMainDiag(
    mainDiagId: string,
    numCodes: string[],
    dataSource: DataSource
  ): Promise<IMainDiagDoc | null> | never {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(mainDiagId)) {
      throw new Error("Invalid mainDiag ID format");
    }
    const mainDiagRepository = dataSource.getRepository(MainDiagEntity);
    const existingMainDiag = await mainDiagRepository.findOne({
      where: { id: mainDiagId },
      relations: ["procs", "diagnosis"],
    });
    if (!existingMainDiag) {
      throw new Error("MainDiag not found");
    }
    const codesToRemove = new Set(numCodes.map((c) => c.trim().toLowerCase()));
    existingMainDiag.procs = existingMainDiag.procs.filter(
      (p) => !codesToRemove.has(p.numCode?.trim().toLowerCase() ?? "")
    ) as ProcCptEntity[];
    await mainDiagRepository.save(existingMainDiag);
    const result = await mainDiagRepository.findOne({
      where: { id: mainDiagId },
      relations: ["procs", "diagnosis"],
    });
    return result as unknown as IMainDiagDoc | null;
  }

  /** Remove diagnosis (ICD) links from a mainDiag by icdCodes. */
  public async removeDiagnosisFromMainDiag(
    mainDiagId: string,
    icdCodes: string[],
    dataSource: DataSource
  ): Promise<IMainDiagDoc | null> | never {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(mainDiagId)) {
      throw new Error("Invalid mainDiag ID format");
    }
    const mainDiagRepository = dataSource.getRepository(MainDiagEntity);
    const existingMainDiag = await mainDiagRepository.findOne({
      where: { id: mainDiagId },
      relations: ["procs", "diagnosis"],
    });
    if (!existingMainDiag) {
      throw new Error("MainDiag not found");
    }
    const codesToRemove = new Set(icdCodes.map((c) => c.trim().toLowerCase()));
    existingMainDiag.diagnosis = existingMainDiag.diagnosis.filter(
      (d) => !codesToRemove.has(d.icdCode?.trim().toLowerCase() ?? "")
    ) as DiagnosisEntity[];
    await mainDiagRepository.save(existingMainDiag);
    const result = await mainDiagRepository.findOne({
      where: { id: mainDiagId },
      relations: ["procs", "diagnosis"],
    });
    return result as unknown as IMainDiagDoc | null;
  }
}
