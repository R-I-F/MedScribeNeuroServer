/** An answer choice of a reference additional question. */
export interface IRefQuestionOption {
  id: string;
  value: string;
  arValue: string | null;
  sortOrder: number;
}

/**
 * A department-scoped additional-question definition from defaultdb reference data,
 * with its (possibly per-mainDiag narrowed) answer options. free_text questions
 * always carry an empty options array.
 */
export interface IRefQuestion {
  id: string;
  key: string;
  label: string;
  arLabel: string | null;
  inputType: "single_choice" | "multi_choice" | "free_text";
  isRequired: boolean;
  sortOrder: number;
  options: IRefQuestionOption[];
}
