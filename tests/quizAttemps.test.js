import request from "supertest";
import mongoose from "mongoose";
import app from "../src/app.js";
import { connectDB } from "../src/config/database.js";
import Course from "../src/models/course.js";
import Enrollment from "../src/models/Enrollment.js";
import Module from "../src/models/module.js";
import Quiz from "../src/models/quiz.js";
import QuizAttempt from "../src/models/quizAttempt.js";
import User from "../src/models/User.js";
import { hashPassword } from "../src/utils/jwtHelper.js";

let trainerId = "";
let learnerId = "";
let courseId = "";
let moduleId = "";
let quizId = "";
let attemptId = "";
let trainerToken = "";
let learnerToken = "";

const password = "Password123!";
const trainerEmail = `quiz_attempt_trainer_${Date.now()}@test.com`;
const learnerEmail = `quiz_attempt_learner_${Date.now()}@test.com`;

beforeAll(async () => {
  await connectDB();

  const hashedPassword = await hashPassword(password);
  const trainer = await User.create({
    name: "Quiz Attempts Trainer",
    email: trainerEmail,
    password: hashedPassword,
    role: "trainer",
  });
  const learner = await User.create({
    name: "Quiz Attempts Learner",
    email: learnerEmail,
    password: hashedPassword,
    role: "learner",
  });
  trainerId = trainer.id;
  learnerId = learner.id;

  const [trainerLogin, learnerLogin] = await Promise.all([
    request(app).post("/api/auth/login").send({ email: trainerEmail, password }),
    request(app).post("/api/auth/login").send({ email: learnerEmail, password }),
  ]);
  trainerToken = trainerLogin.body.token;
  learnerToken = learnerLogin.body.token;

  const course = await Course.create({
    title: "Quiz Attempts Course",
    description: "Course fixture for quiz-attempt route tests",
    objectives: ["Track quiz attempts"],
    level: "beginner",
    category: "Testing",
    estimatedDuration: 10,
    status: "published",
    publishedAt: new Date(),
    trainer: trainer._id,
  });
  courseId = course.id;

  const module = await Module.create({
    title: "Quiz Attempts Module",
    description: "Module fixture for quiz-attempt route tests",
    position: 1,
    estimatedDuration: 10,
    status: "published",
    course: course._id,
  });
  moduleId = module.id;

  const quiz = await Quiz.create({
    module: module._id,
    title: "Quiz Attempts Quiz",
    questions: [
      {
        text: "Which choice is correct?",
        choices: [
          { number: 1, text: "First" },
          { number: 2, text: "Second" },
        ],
        correctAnswer: 2,
        points: 10,
      },
    ],
    passingScore: 5,
    isActive: true,
    isRequired: false,
  });
  quizId = quiz.id;

  await Enrollment.create({ learner: learner._id, course: course._id, status: "active" });
  const attempt = await QuizAttempt.create({
    learner: learner._id,
    quiz: quiz._id,
    answers: [],
    score: 10,
    passed: true,
    status: "submitted",
    submittedAt: new Date(),
  });
  attemptId = attempt.id;
});

describe("Quiz attempt routes", () => {
  test("learner can fetch their quiz attempts", async () => {
    const response = await request(app)
      .get("/api/quiz/attempts/me")
      .set("Authorization", `Bearer ${learnerToken}`);

    expect(response.statusCode).toBe(200);
    expect(JSON.stringify(response.body)).toContain(attemptId);
  });

  test("learner can fetch their attempts for an enrolled course", async () => {
    const response = await request(app)
      .get(`/api/quiz/attempts/me/courses/${courseId}`)
      .set("Authorization", `Bearer ${learnerToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.data.courses).not.toBeNull();
    expect(JSON.stringify(response.body)).toContain(attemptId);
  });

  test("trainer can fetch attempts across their courses", async () => {
    const response = await request(app)
      .get("/api/quiz/attempts")
      .set("Authorization", `Bearer ${trainerToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.data.courses.map((course) => course._id)).toContain(courseId);
    expect(JSON.stringify(response.body)).toContain(attemptId);
  });

  test("trainer can fetch attempts for a specific course", async () => {
    const response = await request(app)
      .get(`/api/quiz/attempts/courses/${courseId}`)
      .set("Authorization", `Bearer ${trainerToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.data.courses[0]._id).toBe(courseId);
    expect(JSON.stringify(response.body)).toContain(attemptId);
  });
});

afterAll(async () => {
  if (quizId) await QuizAttempt.deleteMany({ quiz: quizId });
  if (quizId) await Quiz.findByIdAndDelete(quizId);
  if (moduleId) await Module.findByIdAndDelete(moduleId);
  if (courseId) {
    await Enrollment.deleteMany({ course: courseId });
    await Course.findByIdAndDelete(courseId);
  }
  if (trainerId) await User.findByIdAndDelete(trainerId);
  if (learnerId) await User.findByIdAndDelete(learnerId);
  await mongoose.connection.close();
});
