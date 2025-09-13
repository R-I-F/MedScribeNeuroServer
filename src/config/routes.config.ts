import { Application } from "express";
import { HospitalRouter } from "../hospital/hospital.router";
import { ArabProcRouter } from "../arabProc/arabProc.router";
import { CalSurgRouter } from "../calSurg/calSurg.router";
import { ExternalRouter } from "../externalService/external.router";
import { container } from "./container.config";
import { CandRouter } from "../cand/cand.router";
import { ProcCptRouter } from "../procCpt/procCpt.router";
import { DiagnosisRouter } from "../diagnosis/diagnosis.router";

export function addRoutes(app: Application) {
  const hospitalRouter: HospitalRouter =
    container.get<HospitalRouter>(HospitalRouter);

  const externalRouter: ExternalRouter =
    container.get<ExternalRouter>(ExternalRouter);

  const arabProcRouter: ArabProcRouter =
    container.get<ArabProcRouter>(ArabProcRouter);

  const calSurgRouter: CalSurgRouter =  
    container.get<CalSurgRouter>(CalSurgRouter);

  const candRouter: CandRouter = 
    container.get<CandRouter>(CandRouter);

    const procCptRouter: ProcCptRouter = 
  container.get<ProcCptRouter>(ProcCptRouter);

  const diagnosisRouter: DiagnosisRouter = 
  container.get<DiagnosisRouter>(DiagnosisRouter);

  app.use("/hospital", hospitalRouter.router);
  app.use("/arabProc", arabProcRouter.router);
  app.use("/calSurg", calSurgRouter.router);
  app.use("/cand", candRouter.router);
  app.use("/procCpt", procCptRouter.router);
  app.use("/external", externalRouter.router);
  app.use("/diagnosis", diagnosisRouter.router);

  return app;
}
