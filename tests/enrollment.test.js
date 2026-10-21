// ============================================================
// TESTS — INSCRIPTION ET PROGRESSION
// ============================================================

import request from "supertest";
import mongoose from "mongoose";
import app from "../src/app.js";
import { connectDB } from "../src/config/database.js";

// --- Variables de test ---
let token = "";
let userId = "";
let courseId = "";
let enrollmentId = "";
const testEmail = `enroll_${Date.now()}@test.com`;

// --- Connexion + préparation des données ---
beforeAll(async () => {
  await connectDB()

  // 1. On crée un utilisateur de test
  const registerRes = await request(app).post("/api/auth/register").send({
    name: "Testeur Enroll",
    email: testEmail,
    password: "MotDePasse123",
  });
  userId = registerRes.body.data.user.id;

  // 2. On se connecte pour récupérer le token
  const loginRes = await request(app).post("/api/auth/login").send({
    email: testEmail,
    password: "MotDePasse123",
  });
  token = loginRes.body.token;

  // 3. On crée un cours publié
  const Course = mongoose.model("Course");
  const course = await Course.create({
    title: "Cours Enroll Test",
    description: "Test inscription et progression",
    objectives: ["Objectif"],
    level: "beginner",
    category: "Test",
    estimatedDuration: 5,
    status: "published",
    publishedAt: new Date(),
    trainer: new mongoose.Types.ObjectId(),
  });
  courseId = course._id.toString();
});

describe("Inscription", () => {
  test("S'inscrire à un cours", async () => {
    const res = await request(app)
      .post(`/api/courses/${courseId}/enroll`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(201);
    expect(res.body.data.enrollment.status).toBe("active");

    enrollmentId = res.body.data.enrollment._id;
  });
});

describe("Progression", () => {
  test("Démarrer la progression", async () => {
    const res = await request(app)
      .post(`/api/progress/courses/${courseId}/progress/start`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.progress.percent).toBe(0);
  });

  test("Consulter la progression", async () => {
    const res = await request(app)
      .get(`/api/progress/courses/${courseId}/progression`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty("percent");
    expect(res.body.data).toHaveProperty("modules");
  });
});

describe("Annulation", () => {
  test("Annuler l'inscription", async () => {
    const res = await request(app)
      .patch(`/api/enrollments/${enrollmentId}/cancel`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.enrollment.status).toBe("dropped");
  });
});

// --- Nettoyage ---
afterAll(async () => {
  await mongoose.model("Progress").deleteMany({ course: courseId });
  await mongoose.model("Enrollment").deleteMany({ course: courseId });
  await mongoose.model("Course").findByIdAndDelete(courseId);
  if (userId) {
    await mongoose.model("User").findByIdAndDelete(userId);
  }
  await mongoose.connection.close();
});
