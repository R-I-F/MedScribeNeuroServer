import { Model, Schema, model } from "mongoose";

import { IHospital } from "./hospital.interface";

export const hospitalSchema: Schema<IHospital> = new Schema({
    arabName: {
        type: String,
        required: true,
        maxLength: [100, "Arabic hospital name cannot be more than 100 characters"]
    },
    engName: {
        type: String,
        required: true,
        maxLength: [100, "English hospital name cannot be more than 100 characters"]
    },
    location: {
        long: {
            type: Number,
        },
        lat: {
            type: Number,
        }
    }
}, { timestamps: true })

export const Hospital: Model<IHospital> = model("Hospital", hospitalSchema);