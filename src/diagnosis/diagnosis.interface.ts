export interface IDiagnosis {
  icdCode: string;
  icdName: string;
  neuroLogName?: string[];
}

export interface IDiagnosisDoc extends IDiagnosis {
  id: string; // UUID (replaces _id from MongoDB)
  createdAt: Date;
  updatedAt: Date;
}

// Input types for create/update operations
export type IDiagnosisInput = IDiagnosis;
export type IDiagnosisUpdateInput = Partial<IDiagnosis> & { id: string };
