export interface IProcCpt {
  title: string;
  alphaCode: string;
  numCode: string;
  description: string;
}

export interface IProcCptDoc extends IProcCpt {
  id: string; // UUID (replaces _id from MongoDB)
  createdAt: Date;
  updatedAt: Date;
}

// Input types for create/update operations
export type IProcCptInput = IProcCpt;
export type IProcCptUpdateInput = Partial<IProcCpt> & { id: string };
