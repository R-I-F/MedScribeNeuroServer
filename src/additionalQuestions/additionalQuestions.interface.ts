export interface IAdditionalQuestion {
  mainDiagDocId: string;
  spOrCran: number;
  pos: number;
  approach: number;
  region: number;
  clinPres: number;
  intEvents: number;
}

export interface IAdditionalQuestionDoc extends IAdditionalQuestion {}
