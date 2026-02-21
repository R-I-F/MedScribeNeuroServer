export interface IPosition {
  id: string;
  position: string;
}

export interface IPositionDoc extends IPosition {}

export type IPositionInput = Pick<IPosition, "position">;
