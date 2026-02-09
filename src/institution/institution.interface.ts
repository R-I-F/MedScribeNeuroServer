/**
 * Institution interfaces for public API responses
 * Note: Database credentials are never exposed in responses
 */
export interface IInstitutionResponse {
  id: string; // UUID
  code: string; // e.g., "cairo-university"
  name: string; // e.g., "Cairo University"
  isAcademic: boolean;
  isPractical: boolean;
}
