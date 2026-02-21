export interface IEquipment {
  id: string;
  equipment: string;
}

export interface IEquipmentDoc extends IEquipment {}

export type IEquipmentInput = Pick<IEquipment, "equipment">;
export type IEquipmentUpdateInput = Partial<IEquipmentInput> & { id: string };
