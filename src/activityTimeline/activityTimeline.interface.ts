export type ActivityType = "submission" | "attendance";

export interface IActivityTimelineItem {
  id: string;
  type: ActivityType;
  datetime: string;
  title: string;
  metadata?: {
    submissionId?: string;
    subStatus?: string;
    patientName?: string | null;
    procedureName?: string[];
    eventId?: string;
    eventType?: string;
    eventTitle?: string;
    points?: number;
  };
}
