import { injectable, inject } from "inversify";
import { Request, Response } from "express";
import { ActivityTimelineProvider } from "./activityTimeline.provider";

@injectable()
export class ActivityTimelineController {
  constructor(
    @inject(ActivityTimelineProvider) private activityTimelineProvider: ActivityTimelineProvider
  ) {}

  public async handleGetActivityTimeline(req: Request, res: Response) {
    const dataSource = (req as any).institutionDataSource;
    if (!dataSource) {
      throw new Error("Institution DataSource not resolved");
    }
    const jwtPayload = res.locals.jwt as { id?: string; _id?: string; email: string; role: string } | undefined;
    if (!jwtPayload || (!jwtPayload.id && !jwtPayload._id)) {
      throw new Error("Unauthorized: No user ID found in token");
    }
    const userId = jwtPayload.id ?? jwtPayload._id!;
    const items = await this.activityTimelineProvider.getActivityTimeline(userId, jwtPayload.role, dataSource);
    return { items };
  }
}
