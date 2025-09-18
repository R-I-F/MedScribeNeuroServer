import { User } from "../user/user.interface";
import { Types } from "mongoose";

export interface ISupervisor extends User {
  approvedSubs?: Types.ObjectId[];
  pendingSubs?: Types.ObjectId[];
  rejectedSubs?: Types.ObjectId[];
}

export interface ISupervisorDoc extends ISupervisor {
  _id: Types.ObjectId;
}
