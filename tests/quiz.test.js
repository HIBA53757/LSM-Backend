import request from "supertest";
import mongoose from "mongoose";
import app from "../src/app.js";
import { connectDB } from "../src/config/database.js";
import Course from "../src/models/course.js";
import Module from "../src/models/module.js";
import Quiz from "../src/models/quiz.js";
import User from "../src/models/User.js";
import { hashPassword } from "../src/utils/jwtHelper.js";

let userId = "";
let courseId = "";
let moduleId = "";
let quizId = "";
let token = "";
let email = `test${Date.now()}@test.com`
let password = await hashPassword("Password123!")


// --- Connexion à MongoDB ---
beforeAll(async () => {
  await connectDB();

  const user = await User.create({
    name: "test",
    email,
    password,
    role: "trainer"

  })

  userId = user.id

  const Response = await request(app).post("/api/auth/login").send({
    email: email,
    password: "Password123!",
  });

  token = Response.body.token;

  const course = await Course.create({
    title: "Cours Enroll Test",
    description: "Test inscription et progression",
    objectives: ["Objectif"],
    level: "beginner",
    category: "Test",
    estimatedDuration: 5,
    status: "published",
    publishedAt: new Date(),
    trainer: userId,
  });

  courseId = course._id.toString();

  const module = await Module.create({
    title: "Module progression test",
    description: "Module used by progression tests",
    position: 1,
    estimatedDuration: 10,
    status: "published",
    course: course._id,
  });
  moduleId = module._id.toString();
});

describe("Quiz Management", () => {
  test("create Quiz", async () => {
    const response = await request(app)
      .post(`/api/quizzes`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        module: moduleId,
        title: "JavaScript Basics Quiz",
        questions: [
          {
            text: "Which keyword declares a constant in JavaScript?",
            choices: [
              {
                number: 1,
                text: "var",
              },
              {
                number: 2,
                text: "const",
              },
              {
                number: 3,
                text: "let",
              },
            ],
            correctAnswer: 2,
            points: 5,
          },
          {
            text: "Which value represents true or false?",
            choices: [
              {
                number: 1,
                text: "Boolean",
              },
              {
                number: 2,
                text: "String",
              },
            ],
            correctAnswer: 1,
            points: 5,
          },
        ],
        passingScore: 7,
        isActive: false,
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.data.quiz.isActive).toBe(false);

    quizId = response.body.data.quiz._id;
  });

  test("list quizzes for a module", async () => {
    const response = await request(app)
      .get(`/api/quizzes/modules/${moduleId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.data.quizzes.map((quiz) => quiz._id)).toContain(quizId);
  });

  test("get a quiz by ID", async () => {
    const response = await request(app)
      .get(`/api/quizzes/${quizId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.data.quiz._id).toBe(quizId);
  });

  test("patch a quiz", async () => {
    const response = await request(app)
      .patch(`/api/quizzes/${quizId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Updated JavaScript Quiz" });

    expect(response.statusCode).toBe(200);
    expect(response.body.data.quiz.title).toBe("Updated JavaScript Quiz");
  });

  test("delete a quiz", async () => {
    const response = await request(app)
      .delete(`/api/quizzes/${quizId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("Quiz deleted successfully");
    expect(await Quiz.findById(quizId)).toBeNull();
    quizId = "";
  });
});

afterAll(async () => {
    if (quizId) await Quiz.findByIdAndDelete(quizId);
    if (moduleId) await Module.findByIdAndDelete(moduleId);
    if (courseId) await Course.findByIdAndDelete(courseId);
    if (userId) await User.findByIdAndDelete(userId);

    await mongoose.connection.close();
});

