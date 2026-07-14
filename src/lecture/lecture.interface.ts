export type TLectureLevel = "msc" | "md";

/**
 * Read shape of a mirrored hub lecture (scaled framework). The spoke never writes lectures —
 * they are hub-owned reference data synced by RefMirrorService.
 */
export interface ILecture {
  title: string;
  arTitle: string | null;
  topicId: string;
  lectureNumber: string | null;
  sortOrder: number | null;
  level: TLectureLevel | null;
}

export interface ILectureDoc extends ILecture {
  id: string; // hub UUID
  createdAt: Date;
  updatedAt: Date;
}
