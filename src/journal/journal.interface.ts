import { Types, Document } from "mongoose";

export interface IJournal {
  journalTitle: string;
  pdfLink: string;
  google_uid: string;
}

export interface IJournalDoc extends IJournal, Document {
  _id: Types.ObjectId;
}

// Derived types for input operations
export type IJournalInput = IJournal;
export type IJournalUpdateInput = Partial<IJournal> & { id: string };

