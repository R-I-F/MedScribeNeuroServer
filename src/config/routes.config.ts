import { Application } from "express";
import { HospitalRouter } from "../hospital/hospital.router";
import { ArabProcRouter } from "../arabProc/arabProc.router";
import { ExternalRouter } from "../externalService/external.router";
import { container } from "./container.config";

export function addRoutes(app: Application){
    const hospitalRouter: HospitalRouter = container.get<HospitalRouter>(HospitalRouter)
    const externalRouter: ExternalRouter = container.get<ExternalRouter>(ExternalRouter)
    const arabProcRouter: ArabProcRouter = container.get<ArabProcRouter>(ArabProcRouter)
    app.use("/hospital", hospitalRouter.router);
    app.use("/external", externalRouter.router);
    app.use("/arabProc", arabProcRouter.router);

    return app ;
}