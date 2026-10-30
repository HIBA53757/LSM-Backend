import { runJob } from "../jobs/jobRunner.js";
import { inactiveReminder } from "../jobs/inactiveReminder.js";
import { trainerSummary } from "../jobs/trainerSummary.js";
import { ValidationError } from "../utils/errors.js";
import JobRun from "../models/jobRun.js";

export async function runInactiveReminder(req, res, next) {
  try {
    const result = await runJob(
      "inactiveReminder",
      inactiveReminder
    );

    return res.status(200).json({
      success: true,
      message: "Inactive reminder executed successfully.",
      data: {
        jobName: "inactiveReminder",
        result,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function runTrainerSummary(req, res, next) {
  try {
    const trainerId = req.user.id;

    const result = await runJob(
      "trainerSummary",
      () => trainerSummary(trainerId)
    );

    return res.status(200).json({
      success: true,
      message: "Trainer summary executed successfully.",
      data: {
        jobName: "trainerSummary",
        result,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getJobRuns(req, res, next) {
  try {
    const jobRuns = await JobRun.find()
      .sort({ createdAt: -1 })
      .limit(50);

    return res.status(200).json({
      success: true,
      count: jobRuns.length,
      data: jobRuns,
    });
  } catch (error) {
    next(error);
  }
}