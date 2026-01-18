// Removed: import { Types, Document } from "mongoose"; - Now using UUIDs directly for MariaDB

export interface IJournal {
  journalTitle: string;
  pdfLink: string;
  google_uid: string;
}

export interface IJournalDoc extends IJournal {
  id: string; // UUID (replaces _id from MongoDB Document)
  createdAt: Date;
  updatedAt: Date;
}

// Derived types for input operations
export type IJournalInput = IJournal;
export type IJournalUpdateInput = Partial<IJournal> & { id: string };

