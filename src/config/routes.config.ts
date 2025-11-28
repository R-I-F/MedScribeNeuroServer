import { Application } from "express";
import { HospitalRouter } from "../hospital/hospital.router";
import { ArabProcRouter } from "../arabProc/arabProc.router";
import { CalSurgRouter } from "../calSurg/calSurg.router";
import { ExternalRouter } from "../externalService/external.router";
import { container } from "./container.config";
import { CandRouter } from "../cand/cand.router";
import { ProcCptRouter } from "../procCpt/procCpt.router";
import { DiagnosisRouter } from "../diagnosis/diagnosis.router";
import { SupervisorRouter } from "../supervisor/supervisor.router";
import { MainDiagRouter } from "../mainDiag/mainDiag.router";
import { SubRouter } from "../sub/sub.router";
import { MailerRouter } from "../mailer/mailer.router";
import { AuthRouter } from "../auth/auth.router";
import { SuperAdminRouter } from "../superAdmin/superAdmin.router";
import { InstituteAdminRouter } from "../instituteAdmin/instituteAdmin.router";

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

  const supervisorRouter: SupervisorRouter = 
  container.get<SupervisorRouter>(SupervisorRouter);

  const mainDiagRouter: MainDiagRouter = 
  container.get<MainDiagRouter>(MainDiagRouter);

  const subRouter: SubRouter = 
  container.get<SubRouter>(SubRouter);

  const mailerRouter: MailerRouter =
    container.get<MailerRouter>(MailerRouter);

  const authRouter: AuthRouter =
    container.get<AuthRouter>(AuthRouter);

  const superAdminRouter: SuperAdminRouter =
    container.get<SuperAdminRouter>(SuperAdminRouter);

  const instituteAdminRouter: InstituteAdminRouter =
    container.get<InstituteAdminRouter>(InstituteAdminRouter);

  app.use("/hospital", hospitalRouter.router);
  app.use("/arabProc", arabProcRouter.router);
  app.use("/calSurg", calSurgRouter.router);
  app.use("/cand", candRouter.router);
  app.use("/procCpt", procCptRouter.router);
  app.use("/external", externalRouter.router);
  app.use("/diagnosis", diagnosisRouter.router);
  app.use("/supervisor", supervisorRouter.router);
  app.use("/mainDiag", mainDiagRouter.router);
  app.use("/sub", subRouter.router);
  app.use("/mailer", mailerRouter.router);
  app.use("/auth", authRouter.router);
  app.use("/superAdmin", superAdminRouter.router);
  app.use("/instituteAdmin", instituteAdminRouter.router);

  return app;
}
