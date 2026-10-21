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
let moduleId = "";
let resourceId = "";
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

  const Module = mongoose.model("Module");
  const module = await Module.create({
    title: "Module progression test",
    description: "Module used by progression tests",
    position: 1,
    estimatedDuration: 10,
    status: "published",
    course: course._id,
  });
  moduleId = module._id.toString();

  const Resource = mongoose.model("Resource");
  const resource = await Resource.create({
    title: "Resource progression test",
    type: "article",
    content: "Test content",
    position: 1,
    status: "published",
    module: module._id,
  });
  resourceId = resource._id.toString();
});

describe("Inscription", () => {
  test("S'inscrire à un cours", async () => {
    const res = await request(app)
      .post(`/api/enrollments/courses/${courseId}/enroll`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(201);
    expect(res.body.data.enrollment.status).toBe("active");

    enrollmentId = res.body.data.enrollment._id;
  });
});



describe("Progression", () => {
  test("Récupérer une ressource initialise la progression", async () => {
    const res = await request(app)
      .get(`/api/progress/resources/${resourceId}/view`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.resource._id).toBe(resourceId);

    const progress = await mongoose.model("Progress").findOne({ enrollment: enrollmentId });
    expect(progress).not.toBeNull();
    expect(progress.percent).toBe(0);
  });

  test("Enregistrer la consultation d'une ressource", async () => {
    const res = await request(app)
      .post(`/api/progress/resources/${resourceId}/complete`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.progress.completedResources.map(String)).toContain(resourceId);
  });

  test("Consulter la progression", async () => {
    const res = await request(app)
      .get(`/api/progress/courses/${courseId}`)
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
  await mongoose.model("Resource").findByIdAndDelete(resourceId);
  await mongoose.model("Module").findByIdAndDelete(moduleId);
  await mongoose.model("Course").findByIdAndDelete(courseId);
  if (userId) {
    await mongoose.model("User").findByIdAndDelete(userId);
  }
  await mongoose.connection.close();
});
