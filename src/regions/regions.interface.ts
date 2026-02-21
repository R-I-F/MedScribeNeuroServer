export interface IRegion {
  id: string;
  region: string;
}

export interface IRegionDoc extends IRegion {}

export type IRegionInput = Pick<IRegion, "region">;
