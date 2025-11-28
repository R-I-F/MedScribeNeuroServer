export enum UserRole {
  SUPER_ADMIN = "superAdmin",
  INSTITUTE_ADMIN = "instituteAdmin",
  SUPERVISOR = "supervisor",
  CANDIDATE = "candidate"
}

export type TUserRole = 
  | UserRole.SUPER_ADMIN 
  | UserRole.INSTITUTE_ADMIN 
  | UserRole.SUPERVISOR 
  | UserRole.CANDIDATE;

