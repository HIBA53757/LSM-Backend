import { runJob } from "../jobs/jobRunner.js";
import { inactiveReminder } from "../jobs/inactiveReminder.js";
import { ValidationError } from "../utils/errors.js";

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