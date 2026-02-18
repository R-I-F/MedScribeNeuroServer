import { injectable } from "inversify";
import { Request, Response } from "express";
import { getAllActiveInstitutions } from "./institution.service";
import { IInstitutionResponse } from "./institution.interface";

@injectable()
export class InstitutionController {
  /**
   * Get all active institutions (public endpoint)
   * Returns institution list from defaultdb without database credentials
   */
  public async handleGetAllInstitutions(
    req: Request,
    res: Response
  ): Promise<IInstitutionResponse[]> | never {
    try {
      const institutions = await getAllActiveInstitutions();

      // Map to public response format (exclude database credentials)
      const publicInstitutions: IInstitutionResponse[] = institutions.map((inst) => ({
        id: inst.id,
        code: inst.code,
        name: inst.name,
        isAcademic: inst.isAcademic,
        isPractical: inst.isPractical,
        isClinical: inst.isClinical,
        department: inst.department,
      }));

      return publicInstitutions;
    } catch (err: any) {
      throw new Error(err?.message ?? "Failed to get institutions");
    }
  }
}
