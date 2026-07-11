import { Request, Response } from "express";
import { inject, injectable } from "inversify";
import { matchedData } from "express-validator";
import { AppDataSource } from "../config/database.config";
import { MainDiagService } from "../mainDiag/mainDiag.service";
import { DiagnosisProvider } from "../diagnosis/diagnosis.provider";
import { ProcCptService } from "../procCpt/procCpt.service";
import { LectureProvider } from "../lecture/lecture.provider";

/**
 * Read-only reference endpoints (KA spoke).
 *
 * Replaces the legacy CRUD controllers for `/mainDiag`, `/diagnosis`, `/procCpt`,
 * `/lecture`. Reads come from the LOCAL MIRROR TABLES via the kept services (which the
 * reference mirror keeps synced from the hub) so IDs and shapes are byte-identical to the
 * old endpoints and submissions' FKs are preserved. All writes on these paths are gone (404).
 */
@injectable()
export class ReferenceReadController {
  constructor(
    @inject(MainDiagService) private mainDiagService: MainDiagService,
    @inject(DiagnosisProvider) private diagnosisProvider: DiagnosisProvider,
    @inject(ProcCptService) private procCptService: ProcCptService,
    @inject(LectureProvider) private lectureProvider: LectureProvider
  ) {}

  private ds(req: Request) {
    return (req as any).institutionDataSource || AppDataSource;
  }

  public async getAllMainDiags(req: Request, _res: Response) {
    return this.mainDiagService.getAllMainDiags(this.ds(req));
  }

  public async getMainDiagById(req: Request, _res: Response) {
    const validated = matchedData(req) as { id: string };
    const id = validated.id ?? req.params.id;
    return this.mainDiagService.getMainDiagById({ id }, this.ds(req));
  }

  public async getAllDiagnoses(req: Request, _res: Response) {
    return this.diagnosisProvider.getAllDiagnoses(this.ds(req));
  }

  public async getAllProcCpts(req: Request, _res: Response) {
    return this.procCptService.getAllProcCpts(this.ds(req));
  }

  public async getAllLectures(req: Request, _res: Response) {
    const list = await this.lectureProvider.getAllLectures(this.ds(req));
    // Preserve the legacy shape: strip createdAt/updatedAt/google_uid.
    return list.map(({ createdAt, updatedAt, google_uid, ...rest }: any) => rest);
  }

  public async getLectureById(req: Request, _res: Response) {
    const id = req.params.id;
    return this.lectureProvider.getLectureById(id, this.ds(req));
  }
}
