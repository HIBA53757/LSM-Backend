import request from "supertest";
import mongoose from "mongoose";
import app from "../src/app.js";
import { connectDB } from "../src/config/database.js";
import User from "../src/models/User.js";
import Course from "../src/models/course.js";
import Enrollment from "../src/models/Enrollment.js";
import Progress from "../src/models/progress.js";
import { hashPassword } from "../src/utils/jwtHelper.js";

const testRunId = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
const password = "TrainerTest123!";

let trainer;
let otherTrainer;
let trainerToken;
let learnerToken;
let learners = [];
let trainerCourse;
let notStartedCourse;
let otherTrainersCourse;

beforeAll(async () => {
  await connectDB();

  const hashedPassword = await hashPassword(password);

  trainer = await User.create({
    name: "Statistics Trainer",
    email: `trainer_${testRunId}@test.com`,
    password: hashedPassword,
    role: "trainer",
  });

  otherTrainer = await User.create({
    name: "Other Statistics Trainer",
    email: `other_trainer_${testRunId}@test.com`,
    password: hashedPassword,
    role: "trainer",
  });

  learners = await User.create([
    {
      name: "Active Learner",
      email: `active_${testRunId}@test.com`,
      password: hashedPassword,
      role: "learner",
    },
    {
      name: "Completed Learner",
      email: `completed_${testRunId}@test.com`,
      password: hashedPassword,
      role: "learner",
    },
    {
      name: "Dropped Learner",
      email: `dropped_${testRunId}@test.com`,
      password: hashedPassword,
      role: "learner",
    },
    {
      name: "Not Started Learner",
      email: `not_started_${testRunId}@test.com`,
      password: hashedPassword,
      role: "learner",
    },
  ]);

  const trainerLogin = await request(app).post("/api/auth/login").send({
    email: trainer.email,
    password,
  });
  trainerToken = trainerLogin.body.token;

  const learnerLogin = await request(app).post("/api/auth/login").send({
    email: learners[0].email,
    password,
  });
  learnerToken = learnerLogin.body.token;

  const sharedCourseDetails = {
    description: "Course created for trainer route tests",
    objectives: ["Test objective"],
    level: "beginner",
    category: "Test",
    estimatedDuration: 5,
    status: "published",
    publishedAt: new Date(),
  };

  [trainerCourse, notStartedCourse, otherTrainersCourse] = await Course.create([
    {
      ...sharedCourseDetails,
      title: `Trainer Statistics Course ${testRunId}`,
      trainer: trainer._id,
    },
    {
      ...sharedCourseDetails,
      title: `Not Started Course ${testRunId}`,
      trainer: trainer._id,
    },
    {
      ...sharedCourseDetails,
      title: `Other Trainer Course ${testRunId}`,
      trainer: otherTrainer._id,
    },
  ]);

  const [
    activeEnrollment,
    completedEnrollment,
    droppedEnrollment,
    notStartedEnrollment,
    otherCourseEnrollment,
  ] = await Enrollment.create([
    {
      learner: learners[0]._id,
      course: trainerCourse._id,
      status: "active",
    },
    {
      learner: learners[1]._id,
      course: trainerCourse._id,
      status: "completed",
    },
    {
      learner: learners[2]._id,
      course: trainerCourse._id,
      status: "dropped",
    },
    {
      learner: learners[3]._id,
      course: notStartedCourse._id,
      status: "active",
    },
    {
      learner: learners[0]._id,
      course: otherTrainersCourse._id,
      status: "active",
    },
  ]);

  await Progress.create([
    {
      enrollment: activeEnrollment._id,
      learner: learners[0]._id,
      course: trainerCourse._id,
      percent: 40,
    },
    {
      enrollment: completedEnrollment._id,
      learner: learners[1]._id,
      course: trainerCourse._id,
      percent: 80,
    },
    {
      enrollment: droppedEnrollment._id,
      learner: learners[2]._id,
      course: trainerCourse._id,
      percent: 100,
    },
    {
      enrollment: otherCourseEnrollment._id,
      learner: learners[0]._id,
      course: otherTrainersCourse._id,
      percent: 90,
    },
  ]);

  // notStartedEnrollment has no Progress record.
  expect(notStartedEnrollment).toBeDefined();
});

describe("Trainer routes", () => {
  test("requires authentication on all three routes", async () => {
    const coursesResponse = await request(app).get("/api/trainer/Courses");
    const learnersResponse = await request(app).get(
      `/api/trainer/courses/${trainerCourse._id}/learners`,
    );
    const statisticsResponse = await request(app).get(
      "/api/trainer/statistics",
    );

    expect(coursesResponse.statusCode).toBe(401);
    expect(learnersResponse.statusCode).toBe(401);
    expect(statisticsResponse.statusCode).toBe(401);
  });

  test("GET /api/trainer/Courses returns only this trainer's courses", async () => {
    const response = await request(app)
      .get("/api/trainer/Courses")
      .set("Authorization", `Bearer ${trainerToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.count).toBe(2);

    const courseIds = response.body.data.courses.map((course) => course._id);

    expect(courseIds).toContain(trainerCourse._id.toString());
    expect(courseIds).toContain(notStartedCourse._id.toString());
    expect(courseIds).not.toContain(otherTrainersCourse._id.toString());
  });

  test("GET /api/trainer/courses/:courseId/learners returns active and completed learners", async () => {
    const response = await request(app)
      .get(`/api/trainer/courses/${trainerCourse._id}/learners`)
      .set("Authorization", `Bearer ${trainerToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.count).toBe(2);

    const learnerIds = response.body.data.learners.map((enrollment) =>
      enrollment.learner._id.toString(),
    );

    expect(learnerIds).toContain(learners[0]._id.toString());
    expect(learnerIds).toContain(learners[1]._id.toString());
    expect(learnerIds).not.toContain(learners[2]._id.toString());
  });

  test("a trainer cannot view learners in another trainer's course", async () => {
    const response = await request(app)
      .get(`/api/trainer/courses/${otherTrainersCourse._id}/learners`)
      .set("Authorization", `Bearer ${trainerToken}`);

    expect(response.statusCode).toBe(403);
  });

  test("GET /api/trainer/statistics returns the right counts and average", async () => {
    const response = await request(app)
      .get("/api/trainer/statistics")
      .set("Authorization", `Bearer ${trainerToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.coursesCount).toBe(2);

    const statisticsByCourseId = new Map(
      response.body.data.courses.map((course) => [course.courseId, course]),
    );

    expect(statisticsByCourseId.get(trainerCourse._id.toString())).toMatchObject({
      courseTitle: trainerCourse.title,
      enrolledLearnersCount: 2,
      averageProgress: 60,
    });

    expect(
      statisticsByCourseId.get(notStartedCourse._id.toString()),
    ).toMatchObject({
      courseTitle: notStartedCourse.title,
      enrolledLearnersCount: 1,
      averageProgress: 0,
    });

    expect(statisticsByCourseId.has(otherTrainersCourse._id.toString())).toBe(
      false,
    );
  });

  test("a learner cannot access trainer statistics", async () => {
    const response = await request(app)
      .get("/api/trainer/statistics")
      .set("Authorization", `Bearer ${learnerToken}`);

    expect(response.statusCode).toBe(403);
  });
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    const courseIds = [trainerCourse, notStartedCourse, otherTrainersCourse]
      .filter(Boolean)
      .map((course) => course._id);

    const userIds = [trainer, otherTrainer, ...learners]
      .filter(Boolean)
      .map((user) => user._id);

    if (courseIds.length) {
      await Progress.deleteMany({ course: { $in: courseIds } });
      await Enrollment.deleteMany({ course: { $in: courseIds } });
      await Course.deleteMany({ _id: { $in: courseIds } });
    }

    if (userIds.length) {
      await User.deleteMany({ _id: { $in: userIds } });
    }

    await mongoose.connection.close();
  }
});