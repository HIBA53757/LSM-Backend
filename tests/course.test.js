// ============================================================
// TESTS — COURS
// ============================================================

import request from "supertest";
import mongoose from "mongoose";
import app from "../src/app.js";

// --- Variables de test ---
let courseId = "";

// --- Connexion à MongoDB ---
beforeAll(async () => {
  await mongoose.connect(
    process.env.MONGO_URI || "mongodb://localhost:27017/lms",
  );

  // On insère un cours publié pour les tests
  const Course = mongoose.model("Course");
  const course = await Course.create({
    title: "Cours Test",
    description: "Description test",
    objectives: ["Objectif 1"],
    level: "beginner",
    category: "Test",
    estimatedDuration: 10,
    status: "published",
    publishedAt: new Date(),
    trainer: new mongoose.Types.ObjectId(),
  });
  courseId = course._id.toString();
});

describe("Cours", () => {
  test("Récupérer la liste des cours", async () => {
    const res = await request(app).get("/api/courses");

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data.courses)).toBe(true);
  });

  test("Récupérer un cours par ID", async () => {
    const res = await request(app).get(`/api/courses/${courseId}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.course._id).toBe(courseId);
    expect(res.body.data.course).toHaveProperty("title");
  });
});

// --- Nettoyage ---
afterAll(async () => {
  await mongoose.model("Course").findByIdAndDelete(courseId);
  await mongoose.connection.close();
});
