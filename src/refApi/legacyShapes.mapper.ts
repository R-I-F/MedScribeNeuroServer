import {
  IRefDepartment,
  IRefMainDiag,
  IRefDiagnosis,
  IRefProcCpt,
  IRefLectureTopic,
  IRefEquipment,
  IRefConsumable,
} from "./refApi.types";

/**
 * Pure hub → local mirror-row mappers.
 *
 * The KA mirror tables keep the hub's UUIDs as their local PKs so submissions' FKs and all
 * analytics SQL stay byte-identical. The department wiring mirrors the hub exactly:
 *   - main_diags.departmentId  (direct FK)
 *   - department_diagnoses      (M2M dept↔diagnosis; diagnoses stay shared/deduped)
 *   - lecture_topics.departmentId + lectures.topicId (topic carries the department)
 *   - proc_cpts have no direct department link (transitive via main_diag_procs)
 *
 * HONEST MIRROR RULE (user directive 2026-07-15): the mirror carries EVERY field the hub
 * serves — nothing is projected away. If the hub adds a field, add it here and to the
 * mirror table in the same change.
 */

export interface MirrorDepartmentRow {
  id: string;
  code: string;
  name: string;
  arName: string | null;
  isAcademic: boolean;
  isPractical: boolean;
}

export interface MirrorMainDiagRow {
  id: string;
  title: string;
  arTitle: string | null;
  departmentId: string;
}

export interface MirrorDiagnosisRow {
  id: string;
  icdCode: string;
  icdName: string;
  icdArName: string | null;
  description: string | null;
  arDescription: string | null;
  neuroLogName: null;
}

export interface MirrorProcCptRow {
  id: string;
  title: string;
  arTitle: string | null;
  alphaCode: string;
  numCode: string;
  description: string;
  arDescription: string | null;
}

export interface MirrorLectureTopicRow {
  id: string;
  title: string;
  arTitle: string | null;
  sortOrder: number;
  departmentId: string;
}

export interface MirrorLectureRow {
  id: string;
  title: string;
  arTitle: string | null;
  lectureNumber: string | null;
  sortOrder: number | null;
  level: "msc" | "md" | null;
  topicId: string;
}

export interface MirrorEquipmentRow {
  id: string;
  equipment: string; // legacy column name — the hub's `name`
  arName: string | null;
}

export interface MirrorConsumableRow {
  id: string;
  consumables: string; // legacy column name — the hub's `name`
  arName: string | null;
}

export function toMirrorDepartment(h: IRefDepartment): MirrorDepartmentRow {
  return {
    id: h.id,
    code: h.code,
    name: h.name,
    arName: h.arName ?? null,
    isAcademic: h.isAcademic,
    isPractical: h.isPractical,
  };
}

export function toMirrorMainDiag(h: IRefMainDiag, departmentId: string): MirrorMainDiagRow {
  return { id: h.id, title: h.title, arTitle: h.arTitle ?? null, departmentId };
}

export function toMirrorDiagnosis(h: IRefDiagnosis): MirrorDiagnosisRow {
  return {
    id: h.id,
    icdCode: h.icdCode,
    icdName: h.icdName,
    icdArName: h.icdArName ?? null,
    description: h.description ?? null,
    arDescription: h.arDescription ?? null,
    neuroLogName: null,
  };
}

export function toMirrorProcCpt(h: IRefProcCpt): MirrorProcCptRow {
  return {
    id: h.id,
    title: h.title,
    arTitle: h.arTitle ?? null,
    alphaCode: h.alphaCode,
    numCode: h.numCode,
    description: h.description,
    arDescription: h.arDescription ?? null,
  };
}

export function toMirrorEquipment(h: IRefEquipment): MirrorEquipmentRow {
  return { id: h.id, equipment: h.name, arName: h.arName ?? null };
}

export function toMirrorConsumable(h: IRefConsumable): MirrorConsumableRow {
  return { id: h.id, consumables: h.name, arName: h.arName ?? null };
}

/**
 * Flatten one department's hub topic→lectures tree into mirror rows: the topics (each stamped
 * with departmentId) and the lectures (each pointing at its topicId). Conforms to the hub's
 * scaled schema — `title`/`arTitle`/`lectureNumber`/`level`, no legacy `mainTopic`/`google_uid`.
 */
export function toMirrorLectureTree(
  topics: IRefLectureTopic[],
  departmentId: string
): { topics: MirrorLectureTopicRow[]; lectures: MirrorLectureRow[] } {
  const topicRows: MirrorLectureTopicRow[] = [];
  const lectureRows: MirrorLectureRow[] = [];
  for (const t of topics) {
    topicRows.push({
      id: t.id,
      title: t.title,
      arTitle: t.arTitle,
      sortOrder: t.sortOrder,
      departmentId,
    });
    for (const l of t.lectures) {
      lectureRows.push({
        id: l.id,
        title: l.title,
        arTitle: l.arTitle,
        lectureNumber: l.lectureNumber,
        sortOrder: l.sortOrder,
        level: l.level,
        topicId: t.id,
      });
    }
  }
  return { topics: topicRows, lectures: lectureRows };
}
