import { Model, Schema, model } from "mongoose";

import { IProc } from "./proc.interface";
import { arabProcSchema } from "../arabProc/arabProc.schema";
import { hospitalSchema } from "../hospital/hospital.schema";

const procSchema: Schema<IProc> = new Schema({
    timeStamp: {
        type: Date,
        required: true
    },
    patientName: {
        type: String,
        required: true
    },
    nationalId: {
        type: Number
    },
    patientDob: {
        type: Date,
        required: true,
    },
    gender: {
        type: String,
        enum: ["male" , "female"],
        required: true,
    },
    mrn: {
        type: Number
    },
    hospital: {
        type: hospitalSchema,
        required: true,
    },
    arabProc: {
        type: arabProcSchema
    },
    procDate: {
        type: Date,
        required: true,
    },
    googleUid: {
        type: String
    }
});