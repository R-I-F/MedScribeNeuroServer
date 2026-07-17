export interface ICalSurg {
  timeStamp: Date;
  patientName: string;
  patientNameAr?: string | null; // bilingual slot (pipeline-filled)
  patientNameEn?: string | null; // bilingual slot (pipeline-filled)
  patientDob: Date;
  gender: "male" | "female";
  hospital: string; // UUID (replaces Types.ObjectId)
  procCpt?: string; // UUID → proc_cpts (denormalized from the clerk_procs row)
  clerkProcId?: string | null; // UUID → clerk_procs (what the clerk actually entered)
  procDate: Date;
  google_uid?: string;
  formLink?: string;
  departmentId?: string; // FK → departments; surgeries are dept-scoped (nullable during rollout)
  clerkId?: string | null; // FK → clerks; who registered the surgery (plan §4.4)
}

export interface ICalSurgDoc extends ICalSurg {
  id: string; // UUID (replaces _id from MongoDB)
  createdAt: Date;
  updatedAt: Date;
}

// Input types for create/update operations
export type ICalSurgInput = ICalSurg;
export type ICalSurgUpdateInput = Partial<ICalSurg> & { id: string };