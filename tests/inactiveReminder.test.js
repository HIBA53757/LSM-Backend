
import mongoose from "mongoose";
import { connectDB } from "../src/config/database.js";
import AppConfig from "../src/models/appConfig.js";
import Progress from "../src/models/progress.js";
import Enrollment from "../src/models/Enrollment.js";
import User from "../src/models/User.js";
import Course from "../src/models/course.js";
import { inactiveReminder } from "../src/jobs/inactiveReminder.js";
import dotenv from "dotenv";
import JobRun from "../src/models/jobRun.js";
import { runJob } from "../src/jobs/jobRunner.js";

dotenv.config();


describe("inactiveReminder job", () => {
    let user;
    let course;
    let enrollment;
    let progress;

    beforeAll(async () => {
        process.env.EMAIL_DRIVER = "sandbox";
        await connectDB();
    });

    beforeEach(async () => {
        await Promise.all([
            Progress.deleteMany({}),
            Enrollment.deleteMany({}),
            User.deleteMany({ email: /inactive-test/ }),
            Course.deleteMany({ title: /Inactive Test Course/ }),
            AppConfig.deleteMany({}),
        ]);

        user = await User.create({
            name: "Inactive Test Learner",
            email: `inactive-test-${Date.now()}@test.com`,
            password: "TestPassword123",
            role: "learner",
        });

        course = await Course.create({
            title: "Inactive Test Course",
            description: "Course for testing reminders",
            trainer: user._id,
            estimatedDuration: 10,
            category: "Programming",
            level: "beginner",
            status: "published",
        });

        enrollment = await Enrollment.create({
            learner: user._id,
            course: course._id,
            status: "active",
        });

        progress = await Progress.create({
            enrollment: enrollment._id,
            learner: user._id,
            course: course._id,
            completedResources: [],
            completedModules: [],
            percent: 0,
        });

        // Simulate a learner who has not progressed for 10 days.
        const oldDate = new Date();
        oldDate.setDate(oldDate.getDate() - 10);

        await Progress.collection.updateOne(
            { _id: progress._id },
            { $set: { updatedAt: oldDate } }
        );

        await AppConfig.create({
            emailsEnabled: true,
            emailDriver: "sandbox",
            inactiveDays: 7,
            inactiveReminderFrequency: "0 9 * * *",
            trainerSummaryFrequency: "0 8 * * 1",
        });
    });

    test("records the inactive reminder job execution", async () => {
        const result = await runJob("inactiveReminder", inactiveReminder);

        expect(result.sent).toBeGreaterThanOrEqual(0);

        const jobRun = await JobRun.findOne({
            jobName: "inactiveReminder",
        }).sort({ createdAt: -1 });

        expect(jobRun).not.toBeNull();
        expect(jobRun.status).toBe("success");
        expect(jobRun.finishedAt).toBeDefined();
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });
});
