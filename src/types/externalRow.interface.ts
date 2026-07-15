export interface IExternalRow {
  row?: number;
  /** 1-based sheet row to start importing from (fetches full sheet then slices). */
  startRow?: number;
}
