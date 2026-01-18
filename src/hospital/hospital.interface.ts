export interface IHospital {
  arabName: string;
  engName: string;
  location?: {
    long: number;
    lat: number;
  };
}

export interface IHospitalDoc extends IHospital {
  id: string; // UUID (replaces _id from MongoDB)
  createdAt: Date;
  updatedAt: Date;
}

// Input types for create/update operations
export type IHospitalInput = IHospital;
export type IHospitalUpdateInput = Partial<IHospital> & { id: string };