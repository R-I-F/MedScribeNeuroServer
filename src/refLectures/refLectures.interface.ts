/** A single lecture within a curriculum topic (defaultdb reference data). */
export interface IRefLecture {
  id: string;
  lectureNumber: string | null;
  title: string;
  arTitle: string | null;
  level: "msc" | "md" | null;
  sortOrder: number;
}

/** A department curriculum topic with its ordered lectures. */
export interface IRefLectureTopic {
  id: string;
  title: string;
  arTitle: string | null;
  sortOrder: number;
  lectures: IRefLecture[];
}
