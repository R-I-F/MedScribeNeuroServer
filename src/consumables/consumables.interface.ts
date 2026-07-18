export interface IConsumable {
  id: string;
  consumables: string;
  /** Arabic display name (hub-mirrored; additive — legacy consumers ignore it). */
  arName?: string | null;
}

export interface IConsumableDoc extends IConsumable {}

export type IConsumableInput = Pick<IConsumable, "consumables">;
export type IConsumableUpdateInput = Partial<IConsumableInput> & { id: string };
