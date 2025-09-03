import mongoose, { Document, Types } from "mongoose";

export interface IHospital {
  arabName: string;
  engName: string;
  location?: {
    long: number;
    lat: number;
  };
}

export interface IHospitalDoc extends IHospital{
  _id : Types.ObjectId
}