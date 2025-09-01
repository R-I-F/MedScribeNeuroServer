export interface IExternal {
  fetchExternalData(endpoint: string): Promise<any>;
}

export interface IExternalQuery {
  spreadsheetName: string;
  sheetName: string;
  row?: number;
}
