import { Types } from "mongoose";

export interface IProcCpt {
  title: string;
  alphaCode: string;
  numCode: string;
  description: string;
}

export interface IProcCptDoc extends IProcCpt {
  _id: Types.ObjectId
}
