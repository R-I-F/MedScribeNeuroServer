import "reflect-metadata";
import { inject, injectable } from "inversify";
import { DataSource } from "typeorm";
import {
  DemoRequestProvider,
  IDemoRequestInput,
  IDemoRequestMeta,
} from "./demoRequest.provider";

/** Thin passthrough for module-shape parity (router → controller → provider). */
@injectable()
export class DemoRequestController {
  constructor(
    @inject(DemoRequestProvider) private demoRequestProvider: DemoRequestProvider
  ) {}

  public async handleSubmit(
    payload: IDemoRequestInput,
    meta: IDemoRequestMeta,
    dataSource: DataSource
  ): Promise<void> {
    return this.demoRequestProvider.submit(payload, meta, dataSource);
  }
}
