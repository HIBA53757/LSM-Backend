
import mongoose from "mongoose";

const jobRunSchema = new mongoose.Schema(
  {
    jobName: {
      type: String,
      required: true,
      enum: ["inactiveReminder", "trainerSummary"],
    },
    status: {
      type: String,
      required: true,
      enum: ["running", "success", "failed"],
      default: "running",
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    finishedAt: {
      type: Date,
      default: null,
    },
    error: {
      type: String,
      default: null,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

const JobRun =  mongoose.model("JobRun", jobRunSchema);
export default JobRun;
