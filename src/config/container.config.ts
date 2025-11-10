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
import { CalSurgProvider } from "../calSurg/calSurg.provider";

import { CandController } from "../cand/cand.controller";
import { CandRouter } from "../cand/cand.router";
import { CandService } from "../cand/cand.service";
import { CandProvider } from "../cand/cand.provider";

import { ProcCptController } from "../procCpt/procCpt.controller";
import { ProcCptRouter } from "../procCpt/procCpt.router";
import { ProcCptService } from "../procCpt/procCpt.service";

import { DiagnosisController } from "../diagnosis/diagnosis.controller";
import { DiagnosisRouter } from "../diagnosis/diagnosis.router";
import { DiagnosisService } from "../diagnosis/diagnosis.service";
import { DiagnosisProvider } from "../diagnosis/diagnosis.provider";

import { SupervisorController } from "../supervisor/supervisor.controller";
import { SupervisorRouter } from "../supervisor/supervisor.router";
import { SupervisorService } from "../supervisor/supervisor.service";
import { SupervisorProvider } from "../supervisor/supervisor.provider";

import { MainDiagController } from "../mainDiag/mainDiag.controller";
import { MainDiagRouter } from "../mainDiag/mainDiag.router";
import { MainDiagService } from "../mainDiag/mainDiag.service";
import { MainDiagProvider } from "../mainDiag/mainDiag.provider";

import { SubController } from "../sub/sub.controller";
import { SubRouter } from "../sub/sub.router";
import { SubProvider } from "../sub/sub.provider";
import { SubService } from "../sub/sub.service";

import { MailerController } from "../mailer/mailer.controller";
import { MailerRouter } from "../mailer/mailer.router";
import { MailerService } from "../mailer/mailer.service";

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
container.bind(CalSurgProvider).toSelf().inTransientScope();

container.bind(CandController).toSelf().inTransientScope();
container.bind(CandService).toSelf().inTransientScope();
container.bind(CandRouter).toSelf().inTransientScope();
container.bind(CandProvider).toSelf().inTransientScope();

container.bind(ProcCptController).toSelf().inTransientScope();
container.bind(ProcCptRouter).toSelf().inTransientScope();
container.bind(ProcCptService).toSelf().inTransientScope();

container.bind(DiagnosisController).toSelf().inTransientScope();
container.bind(DiagnosisRouter).toSelf().inTransientScope();
container.bind(DiagnosisService).toSelf().inTransientScope();
container.bind(DiagnosisProvider).toSelf().inTransientScope();

container.bind(SupervisorController).toSelf().inTransientScope();
container.bind(SupervisorRouter).toSelf().inTransientScope();
container.bind(SupervisorService).toSelf().inTransientScope();
container.bind(SupervisorProvider).toSelf().inTransientScope();

container.bind(MainDiagController).toSelf().inTransientScope();
container.bind(MainDiagRouter).toSelf().inTransientScope();
container.bind(MainDiagService).toSelf().inTransientScope();
container.bind(MainDiagProvider).toSelf().inTransientScope();

container.bind(SubController).toSelf().inTransientScope();
container.bind(SubRouter).toSelf().inTransientScope();
container.bind(SubProvider).toSelf().inTransientScope();
container.bind(SubService).toSelf().inTransientScope();

container.bind(MailerController).toSelf().inTransientScope();
container.bind(MailerRouter).toSelf().inTransientScope();
container.bind(MailerService).toSelf().inTransientScope();