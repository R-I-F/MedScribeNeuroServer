import { inject, injectable } from "inversify";
import { DataSource } from "typeorm";
import { DiagnosisService } from "./diagnosis.service";
import { IDiagnosis, IDiagnosisDoc, IDiagnosisUpdateInput } from "./diagnosis.interface";
import { UtilService } from "../utils/utils.service";

@injectable()
export class DiagnosisProvider {
  constructor(
    @inject(DiagnosisService) private diagnosisService: DiagnosisService,
    @inject(UtilService) private utilService: UtilService
  ) {}

  /**
   * Retrieves all diagnoses from the database
   * @returns Promise<IDiagnosisDoc[]>
   */
  public async getAllDiagnoses(dataSource: DataSource): Promise<IDiagnosisDoc[]> {
    try {
      return await this.diagnosisService.getAllDiagnoses(dataSource);
    } catch (error: any) {
      throw new Error(`Failed to retrieve diagnoses: ${error.message}`);
    }
  }

  /**
   * Processes and validates diagnosis data before creating a single diagnosis
   * @param diagnosisData - Validated diagnosis data
   * @returns Promise<IDiagnosisDoc>
   */
  public async createDiagnosis(diagnosisData: IDiagnosis, dataSource: DataSource): Promise<IDiagnosisDoc> {
    try {
      // Business logic: Transform and validate data before service call
      const processedData = this.processDiagnosisData(diagnosisData);
      
      // Check for duplicates if needed
      await this.checkForDuplicateDiagnosis(processedData, dataSource);
      
      // Call service to create diagnosis
      const newDiagnosis = await this.diagnosisService.createDiagnosis(processedData, dataSource);
      
      return newDiagnosis;
    } catch (error: any) {
      // Handle business logic errors
      throw new Error(`Failed to create diagnosis: ${error.message}`);
    }
  }

  /**
   * Processes and validates bulk diagnosis data before creating multiple diagnoses
   * @param diagnosisDataArray - Validated array of diagnosis data
   * @returns Promise<IDiagnosisDoc[]>
   */
  public async createBulkDiagnosis(diagnosisDataArray: IDiagnosis[], dataSource: DataSource): Promise<IDiagnosisDoc[]> {
    try {
      // Business logic: Process each diagnosis in the array
      const processedDataArray = diagnosisDataArray.map(data => 
        this.processDiagnosisData(data)
      );

      // Business logic: Check for duplicates across the array
      await this.checkForDuplicateDiagnoses(processedDataArray, dataSource);

      // Business logic: Validate array constraints (e.g., max batch size)
      this.validateBulkOperationConstraints(processedDataArray);

      // Call service to create bulk diagnoses
      const newDiagnoses = await this.diagnosisService.createBulkDiagnosis(processedDataArray, dataSource);
      
      return newDiagnoses;
    } catch (error: any) {
      // Handle business logic errors
      throw new Error(`Failed to create bulk diagnoses: ${error.message}`);
    }
  }

  /**
   * Processes and transforms diagnosis data according to business rules
   * @param diagnosisData - Raw diagnosis data
   * @returns Processed diagnosis data
   */
  private processDiagnosisData(diagnosisData: IDiagnosis): IDiagnosis {
    // Business logic: Transform data as needed
    const processedData: IDiagnosis = {
      icdCode: diagnosisData.icdCode.trim().toUpperCase(), // Normalize ICD code
      icdName: this.utilService.stringToLowerCaseTrim(diagnosisData.icdName), // Sanitize name using utils service
      neuroLogName: diagnosisData.neuroLogName ? diagnosisData.neuroLogName.map(name => this.utilService.stringToLowerCaseTrim(name)) : undefined // Sanitize optional field array using utils service
    };

    return processedData;
  }

  /**
   * Checks for duplicate diagnosis based on ICD code or ICD name
   * @param diagnosisData - Diagnosis data to check
   * @throws Error if duplicate found
   */
  private async checkForDuplicateDiagnosis(diagnosisData: IDiagnosis, dataSource: DataSource): Promise<void> {
    try {
      const existingDiagnosis = await this.diagnosisService.findExistingDiagnosis(
        diagnosisData.icdCode,
        diagnosisData.icdName,
        dataSource
      );

      if (existingDiagnosis) {
        if (existingDiagnosis.icdCode === diagnosisData.icdCode) {
          throw new Error(`Diagnosis with ICD code '${diagnosisData.icdCode}' already exists`);
        }
        if (existingDiagnosis.icdName === diagnosisData.icdName) {
          throw new Error(`Diagnosis with ICD name '${diagnosisData.icdName}' already exists`);
        }
      }
    } catch (error: any) {
      throw new Error(`Duplicate check failed: ${error.message}`);
    }
  }

  /**
   * Checks for duplicate diagnoses across the array
   * @param diagnosisDataArray - Array of diagnosis data to check
   * @throws Error if duplicates found
   */
  private async checkForDuplicateDiagnoses(diagnosisDataArray: IDiagnosis[], dataSource: DataSource): Promise<void> {
    // Business logic: Check for duplicates within the array itself
    const icdCodes = diagnosisDataArray.map(data => data.icdCode);
    const icdNames = diagnosisDataArray.map(data => data.icdName);
    const uniqueIcdCodes = new Set(icdCodes);
    const uniqueIcdNames = new Set(icdNames);
    
    if (icdCodes.length !== uniqueIcdCodes.size) {
      throw new Error("Duplicate ICD codes found in the request");
    }

    if (icdNames.length !== uniqueIcdNames.size) {
      throw new Error("Duplicate ICD names found in the request");
    }

    // Business logic: Check against existing diagnoses in database
    for (const diagnosisData of diagnosisDataArray) {
      await this.checkForDuplicateDiagnosis(diagnosisData, dataSource);
    }
  }

  /**
   * Validates bulk operation constraints
   * @param diagnosisDataArray - Array of diagnosis data
   * @throws Error if constraints violated
   */
  private validateBulkOperationConstraints(diagnosisDataArray: IDiagnosis[]): void {
    // Business logic: Validate bulk operation limits
    const maxBatchSize = 100; // Example constraint
    
    if (diagnosisDataArray.length > maxBatchSize) {
      throw new Error(`Bulk operation exceeds maximum batch size of ${maxBatchSize}`);
    }

    if (diagnosisDataArray.length === 0) {
      throw new Error("Bulk operation requires at least one diagnosis");
    }
  }

  /**
   * Updates a diagnosis by ID
   * @param validatedReq - Validated update request with id and optional fields
   * @returns Promise<IDiagnosisDoc | null>
   */
  public async updateDiagnosis(validatedReq: IDiagnosisUpdateInput, dataSource: DataSource): Promise<IDiagnosisDoc | null> {
    try {
      const { id, ...updateData } = validatedReq;

      // Build update fields object with business logic transformations
      const updateFields: Partial<IDiagnosis> = {};

      if (updateData.icdCode !== undefined) {
        updateFields.icdCode = updateData.icdCode.trim().toUpperCase(); // Normalize ICD code
      }

      if (updateData.icdName !== undefined) {
        updateFields.icdName = this.utilService.stringToLowerCaseTrim(updateData.icdName); // Sanitize name
      }

      if (updateData.neuroLogName !== undefined) {
        updateFields.neuroLogName = updateData.neuroLogName.map(name => 
          this.utilService.stringToLowerCaseTrim(name)
        ); // Sanitize array
      }

      // Check for duplicates if icdCode or icdName is being updated
      if (updateFields.icdCode || updateFields.icdName) {
        // Get current diagnosis to check what's changing
        const currentDiagnosis = await this.diagnosisService.getDiagnosisById(id, dataSource);
        if (!currentDiagnosis) {
          throw new Error("Diagnosis not found");
        }

        // Check for duplicates with new values
        const checkIcdCode = updateFields.icdCode || currentDiagnosis.icdCode;
        const checkIcdName = updateFields.icdName || currentDiagnosis.icdName;
        
        const existingDiagnosis = await this.diagnosisService.findExistingDiagnosis(
          checkIcdCode,
          checkIcdName,
          dataSource
        );

        if (existingDiagnosis && existingDiagnosis.id !== id) {
          if (updateFields.icdCode && existingDiagnosis.icdCode === checkIcdCode) {
            throw new Error(`Diagnosis with ICD code '${checkIcdCode}' already exists`);
          }
          if (updateFields.icdName && existingDiagnosis.icdName === checkIcdName) {
            throw new Error(`Diagnosis with ICD name '${checkIcdName}' already exists`);
          }
        }
      }

      return await this.diagnosisService.updateDiagnosis(id, updateFields, dataSource);
    } catch (error: any) {
      throw new Error(`Failed to update diagnosis: ${error.message}`);
    }
  }

  /**
   * Deletes a diagnosis by ID
   * @param id - Diagnosis ID to delete
   * @returns Promise<boolean>
   */
  public async deleteDiagnosis(id: string, dataSource: DataSource): Promise<boolean> {
    try {
      return await this.diagnosisService.deleteDiagnosis(id, dataSource);
    } catch (error: any) {
      throw new Error(`Failed to delete diagnosis: ${error.message}`);
    }
  }

  /**
   * Additional provider methods can be added here as needed
   * Examples:
   * - getDiagnosisById()
   * - searchDiagnoses()
   */
}
