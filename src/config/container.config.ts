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

import { PasswordResetService } from "../passwordReset/passwordReset.service";
import { PasswordResetProvider } from "../passwordReset/passwordReset.provider";
import { PasswordResetController } from "../passwordReset/passwordReset.controller";

import { AuthController } from "../auth/auth.controller";
import { AuthRouter } from "../auth/auth.router";
import { AuthTokenService } from "../auth/authToken.service";
// import { AuthService } from "../auth/auth.service";

import { SuperAdminController } from "../superAdmin/superAdmin.controller";
import { SuperAdminRouter } from "../superAdmin/superAdmin.router";
import { SuperAdminService } from "../superAdmin/superAdmin.service";
import { SuperAdminProvider } from "../superAdmin/superAdmin.provider";

import { InstituteAdminController } from "../instituteAdmin/instituteAdmin.controller";
import { InstituteAdminRouter } from "../instituteAdmin/instituteAdmin.router";
import { InstituteAdminService } from "../instituteAdmin/instituteAdmin.service";
import { InstituteAdminProvider } from "../instituteAdmin/instituteAdmin.provider";

import { ReportsController } from "../reports/reports.controller";
import { ReportsRouter } from "../reports/reports.router";
import { ReportsService } from "../reports/reports.service";
import { ReportsProvider } from "../reports/reports.provider";

import { AiAgentService } from "../aiAgent/aiAgent.service";
import { AiAgentProvider } from "../aiAgent/aiAgent.provider";

import { LectureController } from "../lecture/lecture.controller";
import { LectureRouter } from "../lecture/lecture.router";
import { LectureService } from "../lecture/lecture.service";
import { LectureProvider } from "../lecture/lecture.provider";

import { JournalController } from "../journal/journal.controller";
import { JournalRouter } from "../journal/journal.router";
import { JournalService } from "../journal/journal.service";
import { JournalProvider } from "../journal/journal.provider";

import { ConfController } from "../conf/conf.controller";
import { ConfRouter } from "../conf/conf.router";
import { ConfService } from "../conf/conf.service";
import { ConfProvider } from "../conf/conf.provider";

import { EventController } from "../event/event.controller";
import { EventRouter } from "../event/event.router";
import { EventService } from "../event/event.service";
import { EventProvider } from "../event/event.provider";

import { ClerkController } from "../clerk/clerk.controller";
import { ClerkRouter } from "../clerk/clerk.router";
import { ClerkService } from "../clerk/clerk.service";
import { ClerkProvider } from "../clerk/clerk.provider";

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

container.bind(AuthController).toSelf().inTransientScope();
container.bind(AuthRouter).toSelf().inTransientScope();
container.bind(AuthTokenService).toSelf().inTransientScope();
// container.bind(AuthService).toSelf().inTransientScope();

container.bind(SuperAdminController).toSelf().inTransientScope();
container.bind(SuperAdminRouter).toSelf().inTransientScope();
container.bind(SuperAdminService).toSelf().inTransientScope();
container.bind(SuperAdminProvider).toSelf().inTransientScope();

container.bind(InstituteAdminController).toSelf().inTransientScope();
container.bind(InstituteAdminRouter).toSelf().inTransientScope();
container.bind(InstituteAdminService).toSelf().inTransientScope();
container.bind(InstituteAdminProvider).toSelf().inTransientScope();

container.bind(PasswordResetService).toSelf().inTransientScope();
container.bind(PasswordResetProvider).toSelf().inTransientScope();
container.bind(PasswordResetController).toSelf().inTransientScope();

container.bind(ReportsController).toSelf().inTransientScope();
container.bind(ReportsRouter).toSelf().inTransientScope();
container.bind(ReportsService).toSelf().inTransientScope();
container.bind(ReportsProvider).toSelf().inTransientScope();

container.bind(AiAgentService).toSelf().inTransientScope();
container.bind(AiAgentProvider).toSelf().inTransientScope();

container.bind(JournalController).toSelf().inTransientScope();
container.bind(JournalRouter).toSelf().inTransientScope();
container.bind(JournalService).toSelf().inTransientScope();
container.bind(JournalProvider).toSelf().inTransientScope();

container.bind(ConfController).toSelf().inTransientScope();
container.bind(ConfRouter).toSelf().inTransientScope();
container.bind(ConfService).toSelf().inTransientScope();
container.bind(ConfProvider).toSelf().inTransientScope();

container.bind(EventController).toSelf().inTransientScope();
container.bind(EventRouter).toSelf().inTransientScope();
container.bind(EventService).toSelf().inTransientScope();
container.bind(EventProvider).toSelf().inTransientScope();

container.bind(ClerkController).toSelf().inTransientScope();
container.bind(ClerkRouter).toSelf().inTransientScope();
container.bind(ClerkService).toSelf().inTransientScope();
container.bind(ClerkProvider).toSelf().inTransientScope();

container.bind(LectureController).toSelf().inTransientScope();
container.bind(LectureRouter).toSelf().inTransientScope();
container.bind(LectureService).toSelf().inTransientScope();
container.bind(LectureProvider).toSelf().inTransientScope();