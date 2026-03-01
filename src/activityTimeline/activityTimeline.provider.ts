import { injectable } from "inversify";
import { DataSource } from "typeorm";
import { SubmissionEntity } from "../sub/sub.mDbSchema";
import { EventAttendanceEntity } from "../event/eventAttendance.mDbSchema";
import { UserRole } from "../types/role.types";
import { IActivityTimelineItem } from "./activityTimeline.interface";

@injectable()
export class ActivityTimelineProvider {
  /**
   * Returns the latest 10 activities for the candidate user: submissions + attendance.
   * Only candidates have timeline data; others receive [].
   */
  public async getActivityTimeline(
    userId: string,
    role: string,
    dataSource: DataSource
  ): Promise<IActivityTimelineItem[]> {
    if (role !== UserRole.CANDIDATE) {
      return [];
    }

    const subRepo = dataSource.getRepository(SubmissionEntity);
    const attRepo = dataSource.getRepository(EventAttendanceEntity);

    const [subs, attendances] = await Promise.all([
      subRepo.find({
        where: { candDocId: userId },
        select: { id: true, createdAt: true, subStatus: true, procedureName: true, procDocId: true },
        relations: ["calSurg"],
        order: { createdAt: "DESC" },
        take: 50,
      }),
      attRepo.find({
        where: { candidateId: userId },
        relations: ["event", "event.lecture", "event.journal", "event.conf"],
        order: { createdAt: "DESC" },
        take: 50,
      }),
    ]);

    const items: IActivityTimelineItem[] = [];

    for (const s of subs) {
      const calSurg = (s as any).calSurg;
      items.push({
        id: s.id,
        type: "submission",
        datetime: s.createdAt.toISOString(),
        title: `Surgery submission (${s.subStatus})`,
        metadata: {
          submissionId: s.id,
          subStatus: s.subStatus,
          patientName: calSurg?.patientName ?? null,
          procedureName: (s as any).procedureName ?? [],
        },
      });
    }

    for (const a of attendances) {
      const ev = (a as any).event;
      const eventTitle = ev?.lecture?.lectureTitle ?? ev?.journal?.journalTitle ?? ev?.conf?.confTitle ?? "Event";
      const eventType = ev?.type ?? "event";
      items.push({
        id: a.id,
        type: "attendance",
        datetime: a.createdAt.toISOString(),
        title: `Attended ${eventType}: ${eventTitle}`,
        metadata: {
          eventId: a.eventId,
          eventType,
          eventTitle,
          points: a.points,
        },
      });
    }

    items.sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());
    return items.slice(0, 10);
  }
}
