import "reflect-metadata";
import { inject, injectable } from "inversify";
import { DataSource } from "typeorm";
import { AiOfficeProvider } from "./aiOffice.provider";
import { AiOfficeMemberRole } from "./aiOffice.types";
import {
  IAiOfficeActivityInput,
  IAiOfficeAdminActivitiesQuery,
  IAiOfficeAdminUsersQuery,
  IAiOfficeRequestMeta,
  IAiOfficeSignupInput,
} from "./aiOffice.interface";

/** Thin passthrough (router to controller to provider), matching this codebase's module shape. */
@injectable()
export class AiOfficeController {
  constructor(@inject(AiOfficeProvider) private provider: AiOfficeProvider) {}

  public handleSignup(input: IAiOfficeSignupInput, meta: IAiOfficeRequestMeta, dataSource: DataSource) {
    return this.provider.startSignup(input, meta, dataSource);
  }

  public handleGetMe(jwtId: string, jwtRole: string, dataSource: DataSource) {
    return this.provider.getMe(jwtId, jwtRole, dataSource);
  }

  public handleListMyActivities(jwtId: string, jwtRole: string, dataSource: DataSource) {
    return this.provider.listMyActivities(jwtId, jwtRole, dataSource);
  }

  public handleCreateActivity(jwtId: string, jwtRole: string, input: IAiOfficeActivityInput, dataSource: DataSource) {
    return this.provider.createActivity(jwtId, jwtRole, input, dataSource);
  }

  public handleUpdateActivity(
    jwtId: string,
    jwtRole: string,
    activityId: string,
    input: IAiOfficeActivityInput,
    dataSource: DataSource
  ) {
    return this.provider.updateActivity(jwtId, jwtRole, activityId, input, dataSource);
  }

  public handleGetMyStats(jwtId: string, jwtRole: string, dataSource: DataSource) {
    return this.provider.getMyStats(jwtId, jwtRole, dataSource);
  }

  public handleListUsers(query: IAiOfficeAdminUsersQuery, dataSource: DataSource) {
    return this.provider.listUsersForAdmin(query, dataSource);
  }

  public handleSetAiOfficeMember(role: AiOfficeMemberRole, id: string, value: boolean, dataSource: DataSource) {
    return this.provider.setAiOfficeMember(role, id, value, dataSource);
  }

  public handleListActivities(query: IAiOfficeAdminActivitiesQuery, dataSource: DataSource) {
    return this.provider.listActivitiesForAdmin(query, dataSource);
  }

  public handleGetAdminStats(query: IAiOfficeAdminActivitiesQuery, dataSource: DataSource) {
    return this.provider.getAdminStats(query, dataSource);
  }

  public handleListAccessRequests(page: number, pageSize: number, dataSource: DataSource) {
    return this.provider.listAccessRequests(page, pageSize, dataSource);
  }
}
