// Removed: import { Types, Document } from "mongoose"; - Now using UUIDs directly for MariaDB

export interface IConf {
  confTitle: string;
  google_uid: string;
  presenterId: string; // UUID reference to Supervisor - MUST be a valid Supervisor UUID (enforced via FK constraint and validated in provider)
  date: Date;
}

export interface IConfDoc extends IConf {
  id: string; // UUID (replaces _id from MongoDB Document)
  createdAt: Date;
  updatedAt: Date;
  presenter?: any; // Populated presenter (SupervisorEntity) when relations are loaded
}

// Derived types for input operations
export type IConfInput = Omit<IConf, 'presenterId'> & { presenter: string }; // Accept 'presenter' in input for backward compatibility
export type IConfUpdateInput = Partial<Omit<IConf, 'presenterId'>> & { id: string; presenter?: string }; // Accept 'presenter' in update for backward compatibility

