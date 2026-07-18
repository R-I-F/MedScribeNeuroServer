export interface IEquipment {
  id: string;
  equipment: string;
  /** Arabic display name (hub-mirrored; additive — legacy consumers ignore it). */
  arName?: string | null;
}

export interface IEquipmentDoc extends IEquipment {}

export type IEquipmentInput = Pick<IEquipment, "equipment">;
export type IEquipmentUpdateInput = Partial<IEquipmentInput> & { id: string };
