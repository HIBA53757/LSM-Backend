
import mongoose from "mongoose";

const appConfigSchema = new mongoose.Schema(
  {
    emailsEnabled: {
      type: Boolean,
      default: true,
    },

    emailDriver: {
      type: String,
      enum: ["log", "sandbox"],
      default: "log",
    },

    inactiveDays: {
      type: Number,
      default: 7,
      min: 1,
    },

    inactiveReminderFrequency: {
      type: String,
      default: "0 9 * * *", //every day at 9
    },

    trainerSummaryFrequency: {
      type: String,
      default: "0 8 * * 1", //every monday at 8
    },
  },
  { timestamps: true },
);

const AppConfig = mongoose.model("AppConfig", appConfigSchema);

export default AppConfig
