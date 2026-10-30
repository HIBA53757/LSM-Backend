import { runJob } from "../jobs/jobRunner.js";
import { inactiveReminder } from "../jobs/inactiveReminder.js";
import { ValidationError } from "../utils/errors.js";
import JobRun from "../models/jobRun.js";

const availableJobs = {
  inactiveReminder,
};

export async function runJobManually(req, res, next) {
  try {
    const { name } = req.params;

    const jobFunction = availableJobs[name];

    if (!jobFunction) {
      return next(
        new ValidationError(`Unknown job name: ${name}`),
      );
    }

    const result = await runJob(name, jobFunction);

    return res.status(200).json({
      success: true,
      message: `Job '${name}' executed successfully.`,
      data: {
        jobName: name,
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
