export interface IDepartment {
  id: string;
  name: string;
  arName: string;
  code: string;
  isAcademic: boolean;
  isPractical: boolean;
  isActive: boolean;
  nActiveUsers: number;
  nTotalUsers: number;
  nAllowedActiveUsers: number;
  createdAt: Date;
  updatedAt: Date;
}
