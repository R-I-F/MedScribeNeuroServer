import {
  IRefMainDiag,
  IRefDiagnosis,
  IRefProcCpt,
  IRefLectureTopic,
} from "./refApi.types";

/**
 * Pure hub → local mirror-row mappers.
 *
 * The KA mirror tables (`main_diags`, `diagnoses`, `proc_cpts`, `lectures`) keep the hub's
 * UUIDs as their local PKs so submissions' FKs and all analytics SQL stay byte-identical.
 * These functions strip the hub's extra (mostly Arabic / description) fields down to the
 * columns the mirror tables actually carry. Arabic fields are intentionally dropped — the
 * mirror schema has no columns for them.
 */

export interface MirrorMainDiagRow {
  id: string;
  title: string;
}

export interface MirrorDiagnosisRow {
  id: string;
  icdCode: string;
  icdName: string;
  neuroLogName: null;
}

export interface MirrorProcCptRow {
  id: string;
  title: string;
  alphaCode: string;
  numCode: string;
  description: string;
}

export interface MirrorLectureRow {
  id: string;
  lectureTitle: string;
  mainTopic: string;
  level: "msc" | "md" | null;
  google_uid: null;
}

export function toMirrorMainDiag(h: IRefMainDiag): MirrorMainDiagRow {
  return { id: h.id, title: h.title };
}

export function toMirrorDiagnosis(h: IRefDiagnosis): MirrorDiagnosisRow {
  return { id: h.id, icdCode: h.icdCode, icdName: h.icdName, neuroLogName: null };
}

export function toMirrorProcCpt(h: IRefProcCpt): MirrorProcCptRow {
  return {
    id: h.id,
    title: h.title,
    alphaCode: h.alphaCode,
    numCode: h.numCode,
    description: h.description,
  };
}

/**
 * Flatten the hub's nested topic→lectures tree into the flat `lectures` mirror rows.
 * `mainTopic` carries the curriculum topic title; `google_uid` is always null for
 * hub-mirrored lectures.
 */
export function toMirrorLectures(topics: IRefLectureTopic[]): MirrorLectureRow[] {
  const rows: MirrorLectureRow[] = [];
  for (const topic of topics) {
    for (const lecture of topic.lectures) {
      rows.push({
        id: lecture.id,
        lectureTitle: lecture.title,
        mainTopic: topic.title,
        level: lecture.level,
        google_uid: null,
      });
    }
  }
  return rows;
}
