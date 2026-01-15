import { Request, Response } from "express";
import { matchedData } from "express-validator";
import { inject, injectable } from "inversify";
import { LectureProvider } from "./lecture.provider";
import { ILectureInput, ILectureUpdateInput } from "./lecture.interface";

@injectable()
export class LectureController {
  constructor(
    @inject(LectureProvider) private lectureProvider: LectureProvider
  ) {}

  public async handlePostLecture(
    req: Request,
    res: Response
  ) {
    const validatedReq = matchedData(req) as ILectureInput;
    try {
      return await this.lectureProvider.createLecture(validatedReq);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleGetAllLectures(
    req: Request,
    res: Response
  ) {
    try {
      return await this.lectureProvider.getAllLectures();
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleGetLectureById(
    req: Request,
    res: Response
  ) {
    const validatedReq = matchedData(req) as { id: string };
    // Ensure id is extracted from params
    validatedReq.id = req.params.id;
    try {
      return await this.lectureProvider.getLectureById(validatedReq.id);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleUpdateLecture(
    req: Request,
    res: Response
  ) {
    const validatedReq = matchedData(req) as ILectureUpdateInput;
    // Merge id from params into validatedReq
    validatedReq.id = req.params.id;
    try {
      return await this.lectureProvider.updateLecture(validatedReq);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleDeleteLecture(
    req: Request,
    res: Response
  ) {
    const validatedReq = matchedData(req) as { id: string };
    // Ensure id is extracted from params
    validatedReq.id = req.params.id;
    try {
      return await this.lectureProvider.deleteLecture(validatedReq.id);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handlePostBulkLecturesFromExternal(
    req: Request,
    res: Response
  ) {
    const validatedReq = matchedData(req) as { 
      spreadsheetName?: string; 
      sheetName?: string; 
      row?: number; 
      mainTopic: string; 
    };
    try {
      return await this.lectureProvider.createLecturesFromExternal(validatedReq);
    } catch (err: any) {
      throw new Error(err);
    }
  }
}

