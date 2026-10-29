
import request from "supertest";
import mongoose from "mongoose";
import app from "../src/app.js";
import { connectDB } from "../src/config/database.js";
import Course from "../src/models/course.js";
import Enrollment from "../src/models/Enrollment.js";
import Module from "../src/models/module.js";
import Progress from "../src/models/progress.js";
import Quiz from "../src/models/quiz.js";
import QuizAttempt from "../src/models/quizAttempt.js";
import User from "../src/models/User.js";
import { hashPassword } from "../src/utils/jwtHelper.js";

let learnerId = "";
let courseId = "";
let moduleId = "";
let enrollmentId = "";
let quizId = "";
let token = "";
let questionId = "";

const password = "Password123!";
const learnerEmail = `quiz_learner_${Date.now()}@test.com`;

// Check recursively whether an object or array contains
// a correct-answer field.
function containsCorrectAnswerKey(value) {
  if (Array.isArray(value)) {
    return value.some(containsCorrectAnswerKey);
  }

  if (value !== null && typeof value === "object") {
    return Object.entries(value).some(
      ([key, nestedValue]) =>
        ["correctAnswer", "correctAnswers"].includes(key) ||
        containsCorrectAnswerKey(nestedValue)
    );
  }

  return false;
}

beforeAll(async () => {
  await connectDB();

  const learner = await User.create({
    name: "Quiz Learner",
    email: learnerEmail,
    password: await hashPassword(password),
    role: "learner",
  });
  learnerId = learner.id;

  const login = await request(app).post("/api/auth/login").send({
    email: learnerEmail,
    password,
  });

  expect(login.statusCode).toBe(200);
  expect(login.body.token).toBeDefined();

  token = login.body.token;

  const trainerId = new mongoose.Types.ObjectId();

  const course = await Course.create({
    title: "Quiz Learner Course",
    description: "Course fixture for learner quiz route tests",
    objectives: ["Complete the quiz"],
    level: "beginner",
    category: "Testing",
    estimatedDuration: 10,
    status: "published",
    publishedAt: new Date(),
    trainer: trainerId,
  });
  courseId = course.id;

  const module = await Module.create({
    title: "Quiz Learner Module",
    description: "Module fixture for learner quiz route tests",
    position: 1,
    estimatedDuration: 10,
    status: "published",
    course: course._id,
  });
  moduleId = module.id;

  const quiz = await Quiz.create({
    module: module._id,
    title: "Learner Quiz",
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
  questionId = quiz.questions[0].id;

  const enrollment = await Enrollment.create({
    learner: learner._id,
    course: course._id,
    status: "active",
  });
  enrollmentId = enrollment.id;

  await Progress.create({
    enrollment: enrollment._id,
    learner: learner._id,
    course: course._id,
    completedResources: [],
    completedModules: [],
    percent: 0,
  });
});

describe("Learner quiz routes", () => {
  test("learner can view an active quiz without seeing correct answers", async () => {
    const response = await request(app)
      .get(`/api/quizzes/${quizId}/view`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.data.quiz._id).toBe(quizId);

    // The quiz questions must not expose the answer key.
    expect(
      containsCorrectAnswerKey(response.body.data.quiz.questions)
    ).toBe(false);
  });

  test("learner can submit answers, receive the server score, and create an attempt without seeing correct answers", async () => {
    const response = await request(app)
      .post("/api/quizzes/submit")
      .set("Authorization", `Bearer ${token}`)
      .send({
        quiz: quizId,
        answers: [{ questionId, selectedChoice: 2 }],
      });

    expect(response.statusCode).toBe(200);

    // Verify that the server calculates the score correctly.
    expect(response.body.data.cleanReport.score).toBe(10);
    expect(response.body.data.cleanReport.success).toBe(true);

    // Verify that no correct-answer fields appear anywhere
    // in the response sent to the learner.
    expect(containsCorrectAnswerKey(response.body)).toBe(false);

    // Verify that the quiz attempt was saved in the database.
    const attempt = await QuizAttempt.findOne({
      quiz: quizId,
      learner: learnerId,
    });

    expect(attempt).not.toBeNull();
    expect(attempt.passed).toBe(true);
  });
});

afterAll(async () => {
  if (quizId) {
    await QuizAttempt.deleteMany({ quiz: quizId });
    await Quiz.findByIdAndDelete(quizId);
  }

  if (enrollmentId) {
    await Enrollment.findByIdAndDelete(enrollmentId);
  }

  if (courseId) {
    await Progress.deleteMany({ course: courseId });
  }

  if (moduleId) {
    await Module.findByIdAndDelete(moduleId);
  }

  if (courseId) {
    await Course.findByIdAndDelete(courseId);
  }

  if (learnerId) {
    await User.findByIdAndDelete(learnerId);
  }

  await mongoose.connection.close();
});
