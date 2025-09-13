import { inject, injectable } from "inversify";
import { DiagnosisService } from "./diagnosis.service";
import { IDiagnosis, IDiagnosisDoc } from "./diagnosis.interface";
import { UtilService } from "../utils/utils.service";

@injectable()
export class DiagnosisProvider {
  constructor(
    @inject(DiagnosisService) private diagnosisService: DiagnosisService,
    @inject(UtilService) private utilService: UtilService
  ) {}

  /**
   * Processes and validates diagnosis data before creating a single diagnosis
   * @param diagnosisData - Validated diagnosis data
   * @returns Promise<IDiagnosisDoc>
   */
  public async createDiagnosis(diagnosisData: IDiagnosis): Promise<IDiagnosisDoc> {
    try {
      // Business logic: Transform and validate data before service call
      const processedData = this.processDiagnosisData(diagnosisData);
      
      // Check for duplicates if needed
      await this.checkForDuplicateDiagnosis(processedData);
      
      // Call service to create diagnosis
      const newDiagnosis = await this.diagnosisService.createDiagnosis(processedData);
      
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
  public async createBulkDiagnosis(diagnosisDataArray: IDiagnosis[]): Promise<IDiagnosisDoc[]> {
    try {
      // Business logic: Process each diagnosis in the array
      const processedDataArray = diagnosisDataArray.map(data => 
        this.processDiagnosisData(data)
      );

      // Business logic: Check for duplicates across the array
      await this.checkForDuplicateDiagnoses(processedDataArray);

      // Business logic: Validate array constraints (e.g., max batch size)
      this.validateBulkOperationConstraints(processedDataArray);

      // Call service to create bulk diagnoses
      const newDiagnoses = await this.diagnosisService.createBulkDiagnosis(processedDataArray);
      
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
      neuroLogName: diagnosisData.neuroLogName ? this.utilService.stringToLowerCaseTrim(diagnosisData.neuroLogName) : undefined // Sanitize optional field using utils service
    };

    return processedData;
  }

  /**
   * Checks for duplicate diagnosis based on ICD code
   * @param diagnosisData - Diagnosis data to check
   * @throws Error if duplicate found
   */
  private async checkForDuplicateDiagnosis(diagnosisData: IDiagnosis): Promise<void> {
    // Business logic: Implement duplicate checking logic here
    // This could involve querying existing diagnoses
    // For now, we'll skip this check, but the structure is ready
  }

  /**
   * Checks for duplicate diagnoses across the array
   * @param diagnosisDataArray - Array of diagnosis data to check
   * @throws Error if duplicates found
   */
  private async checkForDuplicateDiagnoses(diagnosisDataArray: IDiagnosis[]): Promise<void> {
    // Business logic: Check for duplicates within the array itself
    const icdCodes = diagnosisDataArray.map(data => data.icdCode);
    const uniqueIcdCodes = new Set(icdCodes);
    
    if (icdCodes.length !== uniqueIcdCodes.size) {
      throw new Error("Duplicate ICD codes found in the request");
    }

    // Business logic: Check against existing diagnoses in database
    // This could involve querying existing diagnoses
    // For now, we'll skip this check, but the structure is ready
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
   * Additional provider methods can be added here as needed
   * Examples:
   * - updateDiagnosis()
   * - deleteDiagnosis()
   * - getDiagnosisById()
   * - searchDiagnoses()
   */
}
