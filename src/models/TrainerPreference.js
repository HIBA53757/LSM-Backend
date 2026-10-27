
import mongoose from "mongoose";

const trainerPreferenceSchema = new mongoose.Schema(
  {
    trainer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    subscribed: {
      type: Boolean,
      default: true,
    },

    courses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    ],

    frequency: {
      type: String,
      enum: ["daily", "weekly", "monthly"],
      default: "weekly",
    },
  },
  {
    timestamps: true,
  }
);

const TrainerPreference = mongoose.model("TrainerPreference", trainerPreferenceSchema
);

export default TrainerPreference;
