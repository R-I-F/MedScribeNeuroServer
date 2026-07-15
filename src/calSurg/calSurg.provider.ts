import { inject, injectable } from "inversify";
import { CalSurgService } from "./calSurg.service";
import { ICalSurg, ICalSurgDoc } from "./calSurg.interface";
import { IExternalRow } from "../types/externalRow.interface";
import { ExternalService } from "../externalService/external.service";
import { UtilService } from "../utils/utils.service";
import { HospitalService } from "../hospital/hospital.service";
import { IHospitalDoc } from "../hospital/hospital.interface";
import { ClerkProcService } from "../clerkProc/clerkProc.service";
import { PatientNameService } from "./patientName.service";
import { DataSource } from "typeorm";

/** Webapp create input: the clerk types a free-text procedure phrase (learning pipeline). */
export interface ICalSurgClerkInput {
  hospital: string;
  patientName: string;
  gender: "male" | "female";
  procedureText: string;
  surgeryDate: Date;
  patientDob?: Date;
  departmentId?: string;
  clerkId: string | null;
}

@injectable()
export class CalSurgProvider {
  constructor(
    @inject(CalSurgService) private calSurgService: CalSurgService,
    @inject(ExternalService) private externalService: ExternalService,
    @inject(UtilService) private utilService: UtilService,
    @inject(HospitalService) private hospitalService: HospitalService,
    @inject(ClerkProcService) private clerkProcService: ClerkProcService,
    @inject(PatientNameService) private patientNameService: PatientNameService
  ) {}

  /**
   * Webapp create path (plan §2 + §6): resolve the clerk's phrase through the learning
   * pipeline (clerk_procs), fill the bilingual patient-name slots, then persist. The
   * surgery saves even when the hub search or Gemini fail (unresolved fields stay NULL).
   */
  public async createCalSurgFromClerkInput(input: ICalSurgClerkInput, dataSource: DataSource): Promise<ICalSurgDoc> {
    const departmentId = input.departmentId ?? (await this.getDefaultDepartmentId(dataSource));

    const clerkProc = departmentId
      ? await this.clerkProcService.resolveOrCreate(input.procedureText, departmentId, input.clerkId, dataSource)
      : null;

    const names = await this.patientNameService.bilingual(input.patientName);

    const payload: ICalSurg = {
      timeStamp: new Date(),
      patientName: input.patientName,
      patientNameAr: names.ar,
      patientNameEn: names.en,
      patientDob: input.patientDob ?? input.surgeryDate,
      gender: input.gender,
      hospital: input.hospital,
      procCpt: clerkProc?.procCptId ?? undefined,
      clerkProcId: clerkProc?.id ?? null,
      procDate: input.surgeryDate,
      departmentId: departmentId ?? undefined,
    };
    return this.createCalSurg(payload, dataSource);
  }

  /** Default department (REF_DEPT_CODE, NS) resolved against the mirror. */
  private async getDefaultDepartmentId(dataSource: DataSource): Promise<string | null> {
    const code = process.env.REF_DEPT_CODE || "NS";
    const rows = await dataSource.query(`SELECT "id" FROM "departments" WHERE "code" = $1`, [code]);
    return rows[0]?.id ?? null;
  }

  /** Learned clerk phrases for the default department (create-form typeahead). */
  public async getClerkProcs(dataSource: DataSource) {
    const departmentId = await this.getDefaultDepartmentId(dataSource);
    if (!departmentId) return [];
    return this.clerkProcService.listByDepartment(departmentId, dataSource);
  }

  /**
   * Processes and validates calSurg data before creating a single calSurg
   * @param calSurgData - Validated calSurg data
   * @returns Promise<ICalSurgDoc>
   */
  public async createCalSurg(calSurgData: ICalSurg, dataSource: DataSource): Promise<ICalSurgDoc> {
    try {
      // Business logic: Transform and validate data before service call
      const processedData = this.processCalSurgData(calSurgData);
      
      // Call service to create calSurg
      const newCalSurg = await this.calSurgService.createCalSurg(processedData, dataSource);
      
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
  public async createBulkCalSurg(calSurgDataArray: ICalSurg[], dataSource: DataSource): Promise<ICalSurgDoc[]> {
    try {
      // Business logic: Process each calSurg in the array
      const processedDataArray = calSurgDataArray.map(data => 
        this.processCalSurgData(data)
      );

      // Business logic: Validate array constraints (e.g., max batch size)
      this.validateBulkOperationConstraints(processedDataArray);

      // Call service to create bulk calSurgs
      const newCalSurgs = await this.calSurgService.createBulkCalSurg(processedDataArray, dataSource);
      
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
  public async createCalSurgFromExternal(validatedReq: Partial<IExternalRow>, dataSource: DataSource) {
    try {
      // Business logic: Build API string based on request parameters
      const apiString = this.buildExternalApiString(validatedReq);
      
      // Business logic: Fetch external data
      const externalData = await this.externalService.fetchExternalData(apiString);
      
      if (!externalData.success) {
        return externalData;
      }

      // When startRow is set, keep only rows from that index (1-based → 0-based slice)
      const startRow = validatedReq.startRow;
      if (startRow != null && startRow > 1 && Array.isArray(externalData?.data?.data)) {
        externalData.data.data = externalData.data.data.slice(startRow - 1);
      }

      // Business logic: Process external data and create calSurg records
      const totalRows = externalData?.data?.data?.length ?? 0;
      const processedItems = await this.processExternalData(externalData, dataSource);
      const skippedNoLocation = totalRows - processedItems.length;
      if (skippedNoLocation > 0) {
        console.warn(`[calSurg] ${skippedNoLocation} row(s) skipped: "Location" not found in hospitals (check spelling/name in sheet).`);
      }

      // Business logic: Filter out duplicates before bulk creation
      const uniqueCalSurgs = await this.filterDuplicateCalSurgs(processedItems, dataSource);
      const skippedDuplicates = processedItems.length - uniqueCalSurgs.length;
      if (skippedDuplicates > 0) {
        console.warn(`[calSurg] ${skippedDuplicates} row(s) skipped: already exist in DB (duplicate google_uid).`);
      }

      // Business logic: Create bulk calSurgs (only new ones)
      if (uniqueCalSurgs.length === 0) {
        return [];
      }
      const newCalSurgs = await this.createBulkCalSurg(uniqueCalSurgs, dataSource);
      
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
  public async getCalSurgById(calSurgId: string, dataSource: DataSource): Promise<ICalSurgDoc> {
    try {
      // Business logic: Validate ID format if needed
      this.validateObjectId(calSurgId);
      
      // Call service to get calSurg
      const calSurg = await this.calSurgService.getCalSurgById(calSurgId, dataSource);
      
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
  public async getAllCalSurg(dataSource: DataSource): Promise<ICalSurgDoc[]> {
    try {
      // Call service to get all calSurgs
      const calSurgs = await this.calSurgService.getAllCalSurg(dataSource);
      
      return calSurgs;
    } catch (error: any) {
      // Handle business logic errors
      throw new Error(`Failed to get all calSurgs: ${error.message}`);
    }
  }

  /**
   * Dashboard: calSurg within last 60 days, stripped of formLink and google_uid
   * @returns Promise<CalendarProcedure[]>
   */
  public async getCalSurgDashboard(dataSource: DataSource): Promise<any[]> {
    try {
      return await this.calSurgService.getCalSurgDashboard(dataSource);
    } catch (error: any) {
      throw new Error(`Failed to get calSurg dashboard: ${error.message}`);
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
  }, dataSource: DataSource): Promise<ICalSurgDoc[]> {
    try {
      // Business logic: Determine which filtering method to use
      if (filters.startDate && filters.endDate) {
        // Date range filtering
        const startDate = new Date(filters.startDate);
        const endDate = new Date(filters.endDate);
        return await this.calSurgService.getCalSurgByDateRange(startDate, endDate, dataSource);
      }
      
      if (filters.month) {
        // Month filtering (YYYY-MM format)
        const [year, month] = filters.month.split('-').map(Number);
        return await this.calSurgService.getCalSurgByMonth(year, month, dataSource);
      }
      
      if (filters.year) {
        // Year filtering - get entire year (January to December)
        const year = parseInt(filters.year);
        return await this.calSurgService.getCalSurgByYear(year, dataSource);
      }
      
      if (filters.day) {
        // Day filtering
        const day = new Date(filters.day);
        return await this.calSurgService.getCalSurgByDay(day, dataSource);
      }
      
      // No filters provided, return all
      return await this.calSurgService.getAllCalSurg(dataSource);
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
      patientNameAr: calSurgData.patientNameAr,
      patientNameEn: calSurgData.patientNameEn,
      patientDob: calSurgData.patientDob,
      gender: calSurgData.gender,
      hospital: calSurgData.hospital,
      procCpt: calSurgData.procCpt,
      clerkProcId: calSurgData.clerkProcId,
      departmentId: calSurgData.departmentId,
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
    // Business logic: Build API string. When startRow is set we fetch full sheet and slice later.
    if (validatedReq.row && !validatedReq.startRow) {
      return `${process.env.GETTER_API_ENDPOINT}?spreadsheetName=calSurgLogSheet&sheetName=Form%20Responses%201&row=${validatedReq.row}`;
    }
    return `${process.env.GETTER_API_ENDPOINT}?spreadsheetName=calSurgLogSheet&sheetName=Form%20Responses%201`;
  }

  /**
   * Processes external data and converts it to calSurg format
   * @param externalData - External data from API
   * @returns Array of processed calSurg items
   */
  private async processExternalData(externalData: any, dataSource: DataSource): Promise<ICalSurg[]> {
    // Business logic: Get reference data for mapping
    // Use hospitalService instead of direct Mongoose model (hospital may still be MongoDB)
    const hospitals: IHospitalDoc[] = await this.hospitalService.getAllHospitals(dataSource);
    // Handle both MongoDB (_id) and MariaDB (id) formats
    const hospitalsMap = new Map(hospitals.map(h => {
      const hospitalId = (h as any).id || (h as any)._id?.toString() || '';
      return [h.engName, { ...h, id: hospitalId }];
    }));

    // Procedure resolution matches ONLY exact proc_cpts titles (EN `title` or AR `arTitle`).
    // The colloquial-name alias lookup was dropped with arab_procs (user decision 2026-07-15,
    // migration 610120): sheet rows whose procedure doesn't match import with no procedure.
    const procRows: Array<{ id: string; title: string; arTitle: string | null }> = await dataSource.query(
      `SELECT "id", "title", "arTitle" FROM "proc_cpts"`
    );
    const procAliasMap = new Map<string, string>();
    for (const p of procRows) {
      if (p.title) procAliasMap.set(p.title, p.id);
      if (p.arTitle) procAliasMap.set(p.arTitle, p.id);
    }

    const items: ICalSurg[] = [];

    // Business logic: Process each external data item
    for (let i: number = 0; i < externalData.data.data.length; i++) {
      const rawItem = externalData.data.data[i];

      // Business logic: Sanitize and validate data
      const sanPatientName = this.utilService.sanitizeName(rawItem["Patient Name"]);
      const location: any = hospitalsMap.get(rawItem["Location"]);
      const procCptId: string | undefined = procAliasMap.get(rawItem["Procedure"]);

      // Business logic: Create record if hospital exists; procedure is optional (null when not detected)
      if (location) {
        const normalizedItem: ICalSurg = {
          timeStamp: this.utilService.stringToDateConverter(rawItem["Timestamp"]),
          patientName: sanPatientName,
          patientDob: rawItem["Patient DOB"]
            ? this.utilService.stringToDateConverter(String(rawItem["Patient DOB"]))
            : this.utilService.stringToDateConverter(rawItem["Timestamp"]), // fallback if DOB missing
          gender: rawItem["Gender"],
          hospital: location.id, // Use UUID directly (handles both MongoDB _id and MariaDB id)
          procCpt: procCptId, // UUID when the colloquial name matched an alias; undefined → null when not detected
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
    // Business logic: Basic UUID validation (calSurg now uses UUID instead of ObjectId)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!id || typeof id !== 'string' || !uuidRegex.test(id)) {
      throw new Error("Invalid UUID format");
    }
  }

  /**
   * Filters out calSurgs that already exist in the database (by google_uid)
   * @param calSurgs - Array of calSurgs to check
   * @returns Array of unique calSurgs that don't exist yet
   */
  private async filterDuplicateCalSurgs(calSurgs: ICalSurg[], dataSource: DataSource): Promise<ICalSurg[]> {
    try {
      // Extract all google_uids from the calSurgs array
      const googleUids = calSurgs
        .map(cs => cs.google_uid)
        .filter((uid): uid is string => Boolean(uid && uid.trim() !== ""));

      if (googleUids.length === 0) {
        // If no google_uids, return all (they might be new entries without uids)
        return calSurgs;
      }

      // Find all existing calSurgs with these google_uids in one query
      const existingCalSurgs = await this.calSurgService.findCalSurgsByGoogleUids(googleUids, dataSource);
      const existingUidsSet = new Set(
        existingCalSurgs
          .map(cs => cs.google_uid)
          .filter((uid): uid is string => Boolean(uid))
      );

      // Filter out calSurgs that already exist
      const uniqueCalSurgs = calSurgs.filter(cs => {
        if (!cs.google_uid || cs.google_uid.trim() === "") {
          // If no google_uid, include it (might be a new entry)
          return true;
        }
        // Only include if it doesn't exist in the database
        return !existingUidsSet.has(cs.google_uid.trim());
      });

      return uniqueCalSurgs;
    } catch (err: any) {
      throw new Error(`Failed to filter duplicate calSurgs: ${err.message}`);
    }
  }

  /**
   * Updates a calSurg by ID
   * @param id - CalSurg ID to update
   * @param updateData - Partial calSurg data to update
   * @returns Promise<ICalSurgDoc>
   */
  public async updateCalSurg(id: string, updateData: Partial<ICalSurg>, dataSource: DataSource): Promise<ICalSurgDoc> {
    try {
      // Business logic: Validate ID format
      this.validateObjectId(id);

      // Business logic: Process update data (sanitize patient name if provided)
      const processedUpdateData: Partial<ICalSurg> = { ...updateData };
      if (updateData.patientName !== undefined) {
        processedUpdateData.patientName = this.utilService.sanitizeName(updateData.patientName);
      }

      // Call service to update calSurg
      const updatedCalSurg = await this.calSurgService.updateCalSurg(id, processedUpdateData, dataSource);

      return updatedCalSurg;
    } catch (error: any) {
      // Handle business logic errors
      throw new Error(`Failed to update calSurg: ${error.message}`);
    }
  }

  /**
   * Deletes a calSurg by ID
   * @param id - CalSurg ID to delete
   * @returns Promise<boolean>
   */
  public async deleteCalSurg(id: string, dataSource: DataSource): Promise<boolean> {
    try {
      return await this.calSurgService.deleteCalSurg(id, dataSource);
    } catch (error: any) {
      throw new Error(`Failed to delete calSurg: ${error.message}`);
    }
  }

  /**
   * Additional provider methods can be added here as needed
   * Examples:
   * - searchCalSurgs()
   * - validateCalSurgData()
   */
}
