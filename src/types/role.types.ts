export enum UserRole {
  SUPER_ADMIN = "superAdmin",
  INSTITUTE_ADMIN = "instituteAdmin",
  SUPERVISOR = "supervisor",
  CLERK = "clerk",
  CANDIDATE = "candidate"
}

export type TUserRole = 
  | UserRole.SUPER_ADMIN 
  | UserRole.INSTITUTE_ADMIN 
  | UserRole.SUPERVISOR 
  | UserRole.CLERK
  | UserRole.CANDIDATE;

