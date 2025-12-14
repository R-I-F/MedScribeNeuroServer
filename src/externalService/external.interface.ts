export interface IExternal {
  fetchExternalData(endpoint: string): Promise<any>;
  updateGoogleSheetReview(data: { googleUid: string; status: string }): Promise<any>;
}

export interface IExternalQuery {
  spreadsheetName: string;
  sheetName: string;
  row?: number;
}

export interface IExternalResponse {
  success: boolean;
  data: {
    headers: any[];
    data: any[];
    totalRows: number;
    totalColumns: number;
  };
  timestamp: any;
}
