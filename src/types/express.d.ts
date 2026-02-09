import { DataSource } from "typeorm";

declare global {
  namespace Express {
    interface Request {
      institutionId?: string;
      institutionDataSource?: DataSource;
    }
  }
}
