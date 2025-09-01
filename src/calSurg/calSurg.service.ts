import { Request, Response } from "express";
import { inject, injectable } from "inversify";
import { IExternal } from "../externalService/external.interface";
import { IExternalRow } from "../arabProc/interfaces/IExternalRow.interface";
import { ExternalService } from "../externalService/external.service";

injectable();
export class CalSurgService {
  constructor(
    @inject(ExternalService) private externalService: ExternalService
  ) {}

  public async createCalSurgFromExternal(validatedReq: Partial<IExternalRow>) {
    try {
    } catch (err: any) {
      throw new Error(err);
    }
  }
}
