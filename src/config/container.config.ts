import { Container } from "inversify";
import { UtilService } from "../utils/utils.service";

import { HospitalController } from "../hospital/hospital.controller";
import { HospitalRouter } from "../hospital/hospital.router";
import { HospitalService } from "../hospital/hospital.service";

import { ExternalService } from "../externalService/external.service";
import { ExternalController } from "../externalService/external.controller";
import { ExternalRouter } from "../externalService/external.router";

import { ArabProcController } from "../arabProc/arabProc.controller";
import { ArabProcService } from "../arabProc/arabProc.service";
import { ArabProcRouter } from "../arabProc/arabProc.router";

import { CalSurgController } from "../calSurg/calSurg.controller";
import { CalSurgRouter } from "../calSurg/calSurg.router";
import { CalSurgService } from "../calSurg/calSurg.service";

import { CandController } from "../cand/cand.controller";
import { CandRouter } from "../cand/cand.router";
import { CandService } from "../cand/cand.service";
import { CandProvider } from "../cand/cand.provider";

export const container: Container = new Container();

container.bind(UtilService).toSelf().inTransientScope();

container.bind(HospitalController).toSelf().inTransientScope();
container.bind(HospitalRouter).toSelf().inTransientScope();
container.bind(HospitalService).toSelf().inTransientScope();

container.bind(ExternalService).toSelf().inTransientScope();
container.bind(ExternalController).toSelf().inTransientScope();
container.bind(ExternalRouter).toSelf().inTransientScope();

container.bind(ArabProcController).toSelf().inTransientScope();
container.bind(ArabProcService).toSelf().inTransientScope();
container.bind(ArabProcRouter).toSelf().inTransientScope();

container.bind(CalSurgController).toSelf().inTransientScope();
container.bind(CalSurgRouter).toSelf().inTransientScope();
container.bind(CalSurgService).toSelf().inTransientScope();

container.bind(CandController).toSelf().inTransientScope();
container.bind(CandService).toSelf().inTransientScope();
container.bind(CandRouter).toSelf().inTransientScope();
container.bind(CandProvider).toSelf().inTransientScope();
