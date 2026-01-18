import { Application } from "express";
import { container } from "./container.config";
// Using dynamic requires to avoid circular dependency with container.config.ts

export function addRoutes(app: Application) {
  // Using dynamic requires to avoid circular dependency with container.config.ts
  const { HospitalRouter } = require("../hospital/hospital.router");
  const hospitalRouter = container.get(HospitalRouter) as any;

  const { ExternalRouter } = require("../externalService/external.router");
  const externalRouter = container.get(ExternalRouter) as any;

  const { ArabProcRouter } = require("../arabProc/arabProc.router");
  const arabProcRouter = container.get(ArabProcRouter) as any;

  const { CalSurgRouter } = require("../calSurg/calSurg.router");
  const calSurgRouter = container.get(CalSurgRouter) as any;

  const { CandRouter } = require("../cand/cand.router");
  const candRouter = container.get(CandRouter) as any;

  const { ProcCptRouter } = require("../procCpt/procCpt.router");
  const procCptRouter = container.get(ProcCptRouter) as any;

  const { DiagnosisRouter } = require("../diagnosis/diagnosis.router");
  const diagnosisRouter = container.get(DiagnosisRouter) as any;

  const { SupervisorRouter } = require("../supervisor/supervisor.router");
  const supervisorRouter = container.get(SupervisorRouter) as any;

  const { MainDiagRouter } = require("../mainDiag/mainDiag.router");
  const mainDiagRouter = container.get(MainDiagRouter) as any;

  const { SubRouter } = require("../sub/sub.router");
  const subRouter = container.get(SubRouter) as any;

  const { MailerRouter } = require("../mailer/mailer.router");
  const mailerRouter = container.get(MailerRouter) as any;

  const { AuthRouter } = require("../auth/auth.router");
  const authRouter = container.get(AuthRouter) as any;

  const { SuperAdminRouter } = require("../superAdmin/superAdmin.router");
  const superAdminRouter = container.get(SuperAdminRouter) as any;

  const { InstituteAdminRouter } = require("../instituteAdmin/instituteAdmin.router");
  const instituteAdminRouter = container.get(InstituteAdminRouter) as any;

  const { ReportsRouter } = require("../reports/reports.router");
  const reportsRouter = container.get(ReportsRouter) as any;

  const { LectureRouter } = require("../lecture/lecture.router");
  const lectureRouter = container.get(LectureRouter) as any;

  const { JournalRouter } = require("../journal/journal.router");
  const journalRouter = container.get(JournalRouter) as any;

  const { ConfRouter } = require("../conf/conf.router");
  const confRouter = container.get(ConfRouter) as any;

  const { EventRouter } = require("../event/event.router");
  const eventRouter = container.get(EventRouter) as any;

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
  app.use("/instituteAdmin/reports", reportsRouter.router);
  app.use("/lecture", lectureRouter.router);
  app.use("/journal", journalRouter.router);
  app.use("/conf", confRouter.router);
  app.use("/event", eventRouter.router);

  return app;
}
