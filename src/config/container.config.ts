import { Container } from "inversify";
import { HospitalController } from "../hospital/hospital.controller";
import { HospitalRouter } from "../hospital/hospital.router";
import { HospitalService } from "../hospital/hospital.service";

import { ExternalService } from "../externalService/external.service";
import { ExternalController } from "../externalService/external.controller";
import { ExternalRouter } from "../externalService/external.router";

import { ArabProcController } from "../arabProc/arabProc.controller";
import { ArabProcService } from "../arabProc/arabProc.service";
import { ArabProcRouter } from "../arabProc/arabProc.router";

export const container: Container = new Container();
container.bind(HospitalController).toSelf().inTransientScope();
container.bind(HospitalRouter).toSelf().inTransientScope();
container.bind(HospitalService).toSelf().inTransientScope();

container.bind(ExternalService).toSelf().inTransientScope();
container.bind(ExternalController).toSelf().inTransientScope();
container.bind(ExternalRouter).toSelf().inTransientScope();

container.bind(ArabProcController).toSelf().inTransientScope();
container.bind(ArabProcService).toSelf().inTransientScope();
container.bind(ArabProcRouter).toSelf().inTransientScope();


