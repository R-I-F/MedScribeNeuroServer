import { Model, Schema, model } from "mongoose";
import { IEvent, TEventType, TEventStatus } from "./event.interface";

export const eventSchema: Schema<IEvent> = new Schema(
  {
    type: {
      type: String,
      required: [true, "event type is required"],
      enum: {
        values: ["lecture", "journal", "conf"] as TEventType[],
        message: "event type must be one of: lecture, journal, conf",
      },
    },
    lecture: {
      type: Schema.Types.ObjectId,
      ref: "Lecture",
      required: false,
    },
    journal: {
      type: Schema.Types.ObjectId,
      ref: "Journal",
      required: false,
    },
    conf: {
      type: Schema.Types.ObjectId,
      ref: "Conf",
      required: false,
    },
    dateTime: {
      type: Date,
      required: [true, "dateTime is required"],
    },
    location: {
      type: String,
      required: [true, "location is required"],
      trim: true,
    },
    presenter: {
      type: Schema.Types.ObjectId,
      required: [true, "presenter is required"],
      // Note: presenter ref (Supervisor or Cand) is enforced in provider based on type
    },
    attendance: [
      {
        candidate: {
          type: Schema.Types.ObjectId,
          ref: "Cand",
          required: true,
        },
        addedBy: {
          type: Schema.Types.ObjectId,
          required: true,
        },
        addedByRole: {
          type: String,
          enum: ["instituteAdmin", "supervisor", "candidate"],
          required: true,
        },
        flagged: {
          type: Boolean,
          default: false,
        },
        flaggedBy: {
          type: Schema.Types.ObjectId,
          required: false,
        },
        flaggedAt: {
          type: Date,
          required: false,
        },
        points: {
          type: Number,
          default: 1, // +1 for attendance, -2 if flagged
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    status: {
      type: String,
      required: [true, "event status is required"],
      enum: {
        values: ["booked", "held", "canceled"] as TEventStatus[],
        message: "event status must be one of: booked, held, canceled",
      },
      default: "booked",
    },
  },
  { timestamps: true }
);

export const Event: Model<IEvent> = model("Event", eventSchema);


