import { Application } from "express";
import { container } from "./container.config";
// Using dynamic requires to avoid circular dependency with container.config.ts

export function addRoutes(app: Application) {
  // Using dynamic requires to avoid circular dependency with container.config.ts
  // NB: no /institutions route — single-institution (KA spoke) mode pins the institution
  // statically (getStaticInstitution); the frontend no longer asks.

    const { HospitalRouter } = require("../hospital/hospital.router");
    const hospitalRouter = container.get(HospitalRouter) as any;

  const { ExternalRouter } = require("../externalService/external.router");
  const externalRouter = container.get(ExternalRouter) as any;


  const { CalSurgRouter } = require("../calSurg/calSurg.router");
  const calSurgRouter = container.get(CalSurgRouter) as any;

  const { CandRouter } = require("../cand/cand.router");
  const candRouter = container.get(CandRouter) as any;

  const { SupervisorRouter } = require("../supervisor/supervisor.router");
  const supervisorRouter = container.get(SupervisorRouter) as any;

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

  const { JournalRouter } = require("../journal/journal.router");
  const journalRouter = container.get(JournalRouter) as any;

  const { ConfRouter } = require("../conf/conf.router");
  const confRouter = container.get(ConfRouter) as any;

  const { EventRouter } = require("../event/event.router");
  const eventRouter = container.get(EventRouter) as any;

  const { ClerkRouter } = require("../clerk/clerk.router");
  const clerkRouter = container.get(ClerkRouter) as any;

  const { ActivityTimelineRouter } = require("../activityTimeline/activityTimeline.router");
  const activityTimelineRouter = container.get(ActivityTimelineRouter) as any;

  const { ConsumablesRouter } = require("../consumables/consumables.router");
  const consumablesRouter = container.get(ConsumablesRouter) as any;

  const { EquipmentRouter } = require("../equipment/equipment.router");
  const equipmentRouter = container.get(EquipmentRouter) as any;

  const { BundlerRouter } = require("../bundler/bundler.router");
  const bundlerRouter = container.get(BundlerRouter) as any;

  const { ClinicalSubRouter } = require("../clinicalSub/clinicalSub.router");
  const clinicalSubRouter = container.get(ClinicalSubRouter) as any;

  const { WaBotRouter } = require("../waBot/waBot.router");
  const waBotRouter = container.get(WaBotRouter) as any;

  // Read-only reference reads (mirror-backed) at the legacy paths, + hub re-mirror webhook.
  const { ReferenceReadRouter } = require("../referenceRead/referenceRead.router");
  const referenceReadRouter = container.get(ReferenceReadRouter) as any;

  const { RefResyncRouter } = require("../refApi/refResync.router");
  const refResyncRouter = container.get(RefResyncRouter) as any;

  const { healthRateLimiter } = require("../middleware/rateLimiter.middleware");
  // Health check: use GET /health for load balancer / k8s probes. Rate-limited to throttle bot traffic.
  // Unhandled GET / and POST / return 404 (bots/scanners get 404, not 200).
  app.get("/health", healthRateLimiter, (_req: any, res: any) => res.status(200).json({ status: "ok" }));

  app.use("/hospital", hospitalRouter.router);
  app.use("/calSurg", calSurgRouter.router);
  app.use("/cand", candRouter.router);
  app.use("/external", externalRouter.router);
  app.use("/supervisor", supervisorRouter.router);
  app.use("/sub", subRouter.router);
  app.use("/mailer", mailerRouter.router);
  app.use("/auth", authRouter.router);
  app.use("/superAdmin", superAdminRouter.router);
  app.use("/instituteAdmin", instituteAdminRouter.router);
  app.use("/instituteAdmin/reports", reportsRouter.router);
  app.use("/journal", journalRouter.router);
  app.use("/conf", confRouter.router);
  app.use("/event", eventRouter.router);
  app.use("/clerk", clerkRouter.router);
  app.use("/activityTimeline", activityTimelineRouter.router);
  app.use("/consumables", consumablesRouter.router);
  app.use("/equipment", equipmentRouter.router);
  app.use("/clinicalSub", clinicalSubRouter.router);
  app.use("/references", bundlerRouter.router);
  app.use("/candidate", bundlerRouter.router);
  app.use("/waBot", waBotRouter.router);

  // Reference reads (mirror-backed) mounted at the ORIGINAL paths: /mainDiag, /mainDiag/:id,
  // /diagnosis, /procCpt, /lecture, /lecture/:id. Writes on these paths are gone (404).
  app.use("/", referenceReadRouter.router);

  // Hub superadmin re-mirror webhook (HMAC): POST /admin/ref-resync
  app.use("/admin", refResyncRouter.router);

  return app;
}
