/**
 * Response shapes served by the LibelusRefApi hub (the source of truth for shared
 * reference data). Mirrors the hub's `catalog.interface.ts` / `refLectures.interface.ts`.
 * All hub responses are wrapped in `{ status, statusCode, message, data }`; the client
 * unwraps `data` before returning these shapes.
 */

export interface IRefVersion {
  dataVersion: string;
  migrationCount: number;
  latestMigration: string | null;
}

export interface IRefDepartment {
  id: string;
  name: string;
  arName: string;
  code: string;
  isAcademic: boolean;
  isPractical: boolean;
}

export interface IRefMainDiag {
  id: string;
  title: string;
  arTitle: string;
}

export interface IRefDiagnosis {
  id: string;
  icdCode: string;
  icdName: string;
  icdArName: string;
  description: string;
  arDescription: string;
}

export interface IRefProcCpt {
  id: string;
  title: string;
  arTitle: string | null;
  alphaCode: string;
  numCode: string;
  description: string;
  arDescription: string | null;
}

export interface IRefLecture {
  id: string;
  lectureNumber: string | null;
  title: string;
  arTitle: string | null;
  level: "msc" | "md" | null;
  sortOrder: number;
}

export interface IRefLectureTopic {
  id: string;
  title: string;
  arTitle: string | null;
  sortOrder: number;
  lectures: IRefLecture[];
}

export interface IRefEquipment {
  id: string;
  name: string;
  arName: string;
}

export interface IRefConsumable {
  id: string;
  name: string;
  arName: string;
}

export interface IRefQuestionOption {
  id: string;
  value: string;
  arValue: string | null;
  sortOrder: number;
}

export interface IRefQuestion {
  id: string;
  key: string;
  label: string;
  arLabel: string | null;
  inputType: "single_choice" | "multi_choice" | "free_text";
  isRequired: boolean;
  sortOrder: number;
  options: IRefQuestionOption[];
}
