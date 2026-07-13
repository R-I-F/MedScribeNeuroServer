export interface IArabProc {
  title: string;
  alphaCode: string;
  numCode: string;
  description: string;
  departmentId?: string | null; // FK → departments; dept-scoped (nullable during rollout)
}

export interface IArabProcDoc extends IArabProc {
  id: string; // UUID (replaces _id from MongoDB)
  createdAt: Date;
  updatedAt: Date;
}

// Input types for create/update operations
export type IArabProcInput = IArabProc;
export type IArabProcUpdateInput = Partial<IArabProc> & { id: string };
