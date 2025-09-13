import { inject, injectable } from "inversify";
import { CalSurgService } from "./calSurg.service";
import { ICalSurg, ICalSurgDoc } from "./calSurg.interface";
import { IExternalRow } from "../arabProc/interfaces/IExternalRow.interface";
import { ExternalService } from "../externalService/external.service";
import { UtilService } from "../utils/utils.service";
import { Hospital } from "../hospital/hospital.schema";
import { IHospitalDoc } from "../hospital/hospital.interface";
import { IArabProcDoc } from "../arabProc/arabProc.interface";
import { ArabProc } from "../arabProc/arabProc.schema";

@injectable()
export class CalSurgProvider {
  constructor(
    @inject(CalSurgService) private calSurgService: CalSurgService,
    @inject(ExternalService) private externalService: ExternalService,
    @inject(UtilService) private utilService: UtilService
  ) {}

  /**
   * Processes and validates calSurg data before creating a single calSurg
   * @param calSurgData - Validated calSurg data
   * @returns Promise<ICalSurgDoc>
   */
  public async createCalSurg(calSurgData: ICalSurg): Promise<ICalSurgDoc> {
    try {
      // Business logic: Transform and validate data before service call
      const processedData = this.processCalSurgData(calSurgData);
      
      // Call service to create calSurg
      const newCalSurg = await this.calSurgService.createCalSurg(processedData);
      
      return newCalSurg;
    } catch (error: any) {
      // Handle business logic errors
      throw new Error(`Failed to create calSurg: ${error.message}`);
    }
  }

  /**
   * Processes and validates bulk calSurg data before creating multiple calSurgs
   * @param calSurgDataArray - Validated array of calSurg data
   * @returns Promise<ICalSurgDoc[]>
   */
  public async createBulkCalSurg(calSurgDataArray: ICalSurg[]): Promise<ICalSurgDoc[]> {
    try {
      // Business logic: Process each calSurg in the array
      const processedDataArray = calSurgDataArray.map(data => 
        this.processCalSurgData(data)
      );

      // Business logic: Validate array constraints (e.g., max batch size)
      this.validateBulkOperationConstraints(processedDataArray);

      // Call service to create bulk calSurgs
      const newCalSurgs = await this.calSurgService.createBulkCalSurg(processedDataArray);
      
      return newCalSurgs;
    } catch (error: any) {
      // Handle business logic errors
      throw new Error(`Failed to create bulk calSurgs: ${error.message}`);
    }
  }

  /**
   * Processes external data and creates calSurg records from external source
   * @param validatedReq - Validated external request data
   * @returns Promise<ICalSurgDoc[] | any>
   */
  public async createCalSurgFromExternal(validatedReq: Partial<IExternalRow>) {
    try {
      // Business logic: Build API string based on request parameters
      const apiString = this.buildExternalApiString(validatedReq);
      
      // Business logic: Fetch external data
      const externalData = await this.externalService.fetchExternalData(apiString);
      
      if (!externalData.success) {
        return externalData;
      }

      // Business logic: Process external data and create calSurg records
      const processedItems = await this.processExternalData(externalData);
      
      // Business logic: Create bulk calSurgs
      const newCalSurgs = await this.createBulkCalSurg(processedItems);
      
      return newCalSurgs;
    } catch (error: any) {
      // Handle business logic errors
      throw new Error(`Failed to create calSurg from external: ${error.message}`);
    }
  }

  /**
   * Gets a single calSurg by ID with populated references
   * @param calSurgId - The calSurg ID to retrieve
   * @returns Promise<ICalSurgDoc>
   */
  public async getCalSurgById(calSurgId: string): Promise<ICalSurgDoc> {
    try {
      // Business logic: Validate ID format if needed
      this.validateObjectId(calSurgId);
      
      // Call service to get calSurg
      const calSurg = await this.calSurgService.getCalSurgById(calSurgId);
      
      return calSurg;
    } catch (error: any) {
      // Handle business logic errors
      throw new Error(`Failed to get calSurg by ID: ${error.message}`);
    }
  }

  /**
   * Gets all calSurg records with populated references
   * @returns Promise<ICalSurgDoc[]>
   */
  public async getAllCalSurg(): Promise<ICalSurgDoc[]> {
    try {
      // Call service to get all calSurgs
      const calSurgs = await this.calSurgService.getAllCalSurg();
      
      return calSurgs;
    } catch (error: any) {
      // Handle business logic errors
      throw new Error(`Failed to get all calSurgs: ${error.message}`);
    }
  }

  /**
   * Gets calSurg records with optional date filtering
   * @param filters - Optional date filtering parameters (pre-validated by validator)
   * @returns Promise<ICalSurgDoc[]>
   */
  public async getCalSurgWithFilters(filters: {
    startDate?: string;
    endDate?: string;
    month?: string;
    year?: string;
    day?: string;
  }): Promise<ICalSurgDoc[]> {
    try {
      // Business logic: Determine which filtering method to use
      if (filters.startDate && filters.endDate) {
        // Date range filtering
        const startDate = new Date(filters.startDate);
        const endDate = new Date(filters.endDate);
        return await this.calSurgService.getCalSurgByDateRange(startDate, endDate);
      }
      
      if (filters.month) {
        // Month filtering (YYYY-MM format)
        const [year, month] = filters.month.split('-').map(Number);
        return await this.calSurgService.getCalSurgByMonth(year, month);
      }
      
      if (filters.year) {
        // Year filtering - get entire year (January to December)
        const year = parseInt(filters.year);
        return await this.calSurgService.getCalSurgByYear(year);
      }
      
      if (filters.day) {
        // Day filtering
        const day = new Date(filters.day);
        return await this.calSurgService.getCalSurgByDay(day);
      }
      
      // No filters provided, return all
      return await this.calSurgService.getAllCalSurg();
    } catch (error: any) {
      // Handle business logic errors
      throw new Error(`Failed to get calSurg with filters: ${error.message}`);
    }
  }

  /**
   * Processes and transforms calSurg data according to business rules
   * @param calSurgData - Raw calSurg data
   * @returns Processed calSurg data
   */
  private processCalSurgData(calSurgData: ICalSurg): ICalSurg {
    // Business logic: Transform data as needed
    const processedData: ICalSurg = {
      timeStamp: calSurgData.timeStamp,
      patientName: this.utilService.sanitizeName(calSurgData.patientName), // Sanitize patient name
      patientDob: calSurgData.patientDob,
      gender: calSurgData.gender,
      hospital: calSurgData.hospital,
      arabProc: calSurgData.arabProc,
      procDate: calSurgData.procDate,
      google_uid: calSurgData.google_uid,
      formLink: calSurgData.formLink
    };

    return processedData;
  }

  /**
   * Builds the external API string based on request parameters
   * @param validatedReq - Validated external request data
   * @returns API string
   */
  private buildExternalApiString(validatedReq: Partial<IExternalRow>): string {
    // Business logic: Build API string
    if (validatedReq.row) {
      return `${process.env.GETTER_API_ENDPOINT}?spreadsheetName=calSurgLogSheet&sheetName=Form%20Responses%201&row=${validatedReq.row}`;
    } else {
      return `${process.env.GETTER_API_ENDPOINT}?spreadsheetName=calSurgLogSheet&sheetName=Form%20Responses%201`;
    }
  }

  /**
   * Processes external data and converts it to calSurg format
   * @param externalData - External data from API
   * @returns Array of processed calSurg items
   */
  private async processExternalData(externalData: any): Promise<ICalSurg[]> {
    // Business logic: Get reference data for mapping
    const hospitals: IHospitalDoc[] = await Hospital.find({});
    const hospitalsMap = new Map(hospitals.map(h => [h.engName, h]));

    const arabicProcs: IArabProcDoc[] = await ArabProc.find({});
    const arabicProcsMap = new Map(arabicProcs.map(p => [p.title, p]));

    const items: ICalSurg[] = [];

    // Business logic: Process each external data item
    for (let i: number = 0; i < externalData.data.data.length; i++) {
      const rawItem = externalData.data.data[i];
      
      // Business logic: Sanitize and validate data
      const sanPatientName = this.utilService.sanitizeName(rawItem["Patient Name"]);
      const location: IHospitalDoc | undefined = hospitalsMap.get(rawItem["Location"]);
      const arabicProc: IArabProcDoc | undefined = arabicProcsMap.get(rawItem["Procedure"]);
      
      // Business logic: Only create record if both references exist
      if (location && arabicProc) {
        const normalizedItem: ICalSurg = {
          timeStamp: this.utilService.stringToDateConverter(rawItem["Timestamp"]),
          patientName: sanPatientName,
          patientDob: rawItem["Patient DOB"],
          gender: rawItem["Gender"],
          hospital: location._id,
          arabProc: arabicProc._id,
          procDate: this.utilService.stringToDateConverter(rawItem["Operation Date"]),
          google_uid: rawItem["uid"],
          formLink: rawItem["Link"]
        };
        items.push(normalizedItem);
      }
    }

    return items;
  }

  /**
   * Validates bulk operation constraints
   * @param calSurgDataArray - Array of calSurg data
   * @throws Error if constraints violated
   */
  private validateBulkOperationConstraints(calSurgDataArray: ICalSurg[]): void {
    // Business logic: Validate bulk operation limits
    const maxBatchSize = 1000; // Example constraint
    
    if (calSurgDataArray.length > maxBatchSize) {
      throw new Error(`Bulk operation exceeds maximum batch size of ${maxBatchSize}`);
    }

    if (calSurgDataArray.length === 0) {
      throw new Error("Bulk operation requires at least one calSurg record");
    }
  }

  /**
   * Validates ObjectId format
   * @param id - ObjectId string to validate
   * @throws Error if invalid format
   */
  private validateObjectId(id: string): void {
    // Business logic: Basic ObjectId validation
    if (!id || typeof id !== 'string' || id.length !== 24) {
      throw new Error("Invalid ObjectId format");
    }
  }

  /**
   * Additional provider methods can be added here as needed
   * Examples:
   * - updateCalSurg()
   * - deleteCalSurg()
   * - searchCalSurgs()
   * - validateCalSurgData()
   */
}
