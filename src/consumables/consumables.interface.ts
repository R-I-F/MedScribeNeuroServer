export interface IConsumable {
  id: string;
  consumables: string;
}

export interface IConsumableDoc extends IConsumable {}

export type IConsumableInput = Pick<IConsumable, "consumables">;
export type IConsumableUpdateInput = Partial<IConsumableInput> & { id: string };
