
import JobRun from "../models/jobRun.js";

export async function runJob(jobName, jobFunction) {
  const jobRun = await JobRun.create({
    jobName,
    status: "running",
    startedAt: new Date(),
  });

  try {
    const result = await jobFunction();

    jobRun.status = "success";
    jobRun.finishedAt = new Date();
    jobRun.details = result ?? {};
    await jobRun.save();

    return result;
  } catch (error) {
    jobRun.status = "failed";
    jobRun.finishedAt = new Date();
    jobRun.error = error.message;
    await jobRun.save();

    throw error;
  }
}
