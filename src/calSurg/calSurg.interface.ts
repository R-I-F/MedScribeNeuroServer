export interface ICalSurg {
  timeStamp: Date;
  patientName: string;
  patientDob: Date;
  gender: "male" | "female";
  hospital: string; // UUID (replaces Types.ObjectId)
  arabProc?: string; // UUID (replaces Types.ObjectId, optional)
  procDate: Date;
  google_uid?: string;
  formLink?: string;
  departmentId?: string; // FK → departments; surgeries are dept-scoped (nullable during rollout)
  procCptId?: string; // FK → proc_cpts (modern procedure link; backfilled via semantic mapping)
}

export interface ICalSurgDoc extends ICalSurg {
  id: string; // UUID (replaces _id from MongoDB)
  createdAt: Date;
  updatedAt: Date;
}

// Input types for create/update operations
export type ICalSurgInput = ICalSurg;
export type ICalSurgUpdateInput = Partial<ICalSurg> & { id: string };