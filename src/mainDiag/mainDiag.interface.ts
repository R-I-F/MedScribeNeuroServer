export interface IMainDiag {
  title: string;
  procs: string[]; // Array of UUIDs (replaces Types.ObjectId[])
  diagnosis: string[]; // Array of UUIDs (replaces Types.ObjectId[])
}

export interface IMainDiagDoc extends IMainDiag {
  id: string; // UUID (replaces _id from MongoDB)
  createdAt: Date;
  updatedAt: Date;
}

// Input interface for creating mainDiag with codes
export interface IMainDiagInput {
  title: string;
  procsArray?: string[]; // Array of numCodes
  diagnosis?: string[]; // Array of icdCodes
}

// Input interface for updating mainDiag with codes (appends to existing arrays)
export interface IMainDiagUpdateInput {
  id: string;
  title?: string;
  procs?: string[]; // Array of numCodes to append
  diagnosis?: string[]; // Array of icdCodes to append
}