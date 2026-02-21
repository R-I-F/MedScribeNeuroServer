export interface IApproach {
  id: string;
  approach: string;
}

export interface IApproachDoc extends IApproach {}

export type IApproachInput = Pick<IApproach, "approach">;
