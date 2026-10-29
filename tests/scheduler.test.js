
import { jest } from "@jest/globals";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

process.env.EMAIL_DRIVER = "log";

const mockSchedule = jest.fn();

jest.unstable_mockModule("node-cron", () => ({
  default: {
    schedule: mockSchedule,
  },
}));

const { startScheduler } = await import("../src/jobs/scheduler.js");
const { connectDB } = await import("../src/config/database.js");
const { default: AppConfig } = await import("../src/models/appConfig.js");
const { default: JobRun } = await import("../src/models/jobRun.js");

const { default: User } = await import("../src/models/User.js");
const { default: Course } = await import("../src/models/course.js");
const { default: Progress } = await import("../src/models/progress.js");
const { default: Enrollment } = await import("../src/models/Enrollment.js");

describe("scheduler", () => {
  beforeAll(async () => {
    await connectDB();
  });

  beforeEach(() => {
    mockSchedule.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  test("registers the inactive reminder schedule", async () => {
    jest.spyOn(AppConfig, "findOne").mockResolvedValue({
      emailsEnabled: true,
      emailDriver: "log",
      inactiveDays: 7,
      inactiveReminderFrequency: "0 9 * * *",
      trainerSummaryFrequency: "0 8 * * 1",
    });

    await startScheduler();

    expect(mockSchedule).toHaveBeenCalledWith(
      "0 9 * * *",
      expect.any(Function)
    );
  });

  test("executes the scheduled callback and records the job", async () => {
    jest.spyOn(AppConfig, "findOne").mockResolvedValue({
      emailsEnabled: true,
      emailDriver: "log",
      inactiveDays: 7,
      inactiveReminderFrequency: "0 9 * * *",
      trainerSummaryFrequency: "0 8 * * 1",
    });

    await startScheduler();

    const callback = mockSchedule.mock.calls[0][1];

    expect(callback).toBeInstanceOf(Function);
    expect(mongoose.connection.readyState).toBe(1);

    await callback();

    const jobRun = await JobRun.findOne({
      jobName: "inactiveReminder",
    }).sort({ createdAt: -1 });

    expect(jobRun).not.toBeNull();
    expect(jobRun.status).toBe("success");
    expect(jobRun.finishedAt).toBeDefined();
  });
});
