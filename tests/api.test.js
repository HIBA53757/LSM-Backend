// ============================================================
// TESTS AUTOMATISÉS — COMPORTEMENTS CRITIQUES DE L'API LMS
// ============================================================
// On teste uniquement les parcours essentiels :
//   1. Un utilisateur peut s'inscrire et se connecter
//   2. Il peut consulter les cours
//   3. Il peut s'inscrire à un cours et démarrer sa progression
// ============================================================

import request from "supertest";
import mongoose from "mongoose";
import app from "../src/app.js";

// --- Connexion à MongoDB avant tous les tests ---
beforeAll(async () => {
  await mongoose.connect(
    process.env.MONGO_URI || "mongodb://localhost:27017/lms",
  );
});

// --- Variables partagées entre les tests ---
let token = "";
let userId = "";
let courseId = "";
let enrollmentId = "";
const testEmail = `test_${Date.now()}@test.com`;

// ============================================================
//               AUTHENTIFICATION
// ============================================================
describe("Authentification", () => {
  test("Inscription réussie", async () => {
    // On crée un nouvel utilisateur
    const res = await request(app).post("/api/auth/register").send({
      name: "Testeur",
      email: testEmail,
      password: "MotDePasse123",
    });

    // On vérifie que l'utilisateur est bien créé
    expect(res.statusCode).toBe(201);
    expect(res.body.user.email).toBe(testEmail);

    userId = res.body.user.id;
  });

  test("Connexion réussie", async () => {
    // On se connecte avec les identifiants créés
    const res = await request(app).post("/api/auth/login").send({
      email: testEmail,
      password: "MotDePasse123",
    });

    // On vérifie qu'on reçoit un token
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("token");

    token = res.body.token;
  });

  test("Connexion refusée avec mauvais mot de passe", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: testEmail,
      password: "Mauvais",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Invalid credentials.");
  });
});

// ============================================================
//                     COURS
// ============================================================
describe("Cours", () => {
  // On insère un cours publié pour avoir des données fiables
  beforeAll(async () => {
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

  test("Récupérer la liste des cours", async () => {
    const res = await request(app).get("/api/courses");

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("Récupérer un cours par ID", async () => {
    const res = await request(app).get(`/api/courses/${courseId}`);

    expect(res.statusCode).toBe(200);
    expect(res.body._id).toBe(courseId);
    expect(res.body).toHaveProperty("title");
  });

  afterAll(async () => {
    await mongoose.model("Course").findByIdAndDelete(courseId);
  });
});

// ============================================================
//              INSCRIPTION + PROGRESSION
// ============================================================
describe("Inscription et Progression", () => {
  let progCourseId = "";

  // On crée un cours pour l'inscription et la progression
  beforeAll(async () => {
    const Course = mongoose.model("Course");
    const course = await Course.create({
      title: "Cours Progression",
      description: "Test progression",
      objectives: ["Objectif"],
      level: "beginner",
      category: "Test",
      estimatedDuration: 5,
      status: "published",
      publishedAt: new Date(),
      trainer: new mongoose.Types.ObjectId(),
    });
    progCourseId = course._id.toString();
  });

  test("S'inscrire à un cours", async () => {
    const res = await request(app)
      .post(`/api/courses/${progCourseId}/enroll`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(201);
    expect(res.body.enrollment.status).toBe("active");

    enrollmentId = res.body.enrollment._id;
  });

  test("Démarrer la progression", async () => {
    const res = await request(app)
      .post(`/api/progress/courses/${progCourseId}/progress/start`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.progress.percent).toBe(0);
  });

  test("Consulter la progression", async () => {
    const res = await request(app)
      .get(`/api/progress/courses/${progCourseId}/progression`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("percent");
    expect(res.body).toHaveProperty("modules");
  });

  test("Annuler l'inscription", async () => {
    const res = await request(app)
      .patch(`/api/enrollments/${enrollmentId}/cancel`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.enrollment.status).toBe("dropped");
  });

  afterAll(async () => {
    await mongoose.model("Progress").deleteMany({ course: progCourseId });
    await mongoose.model("Enrollment").deleteMany({ course: progCourseId });
    await mongoose.model("Course").findByIdAndDelete(progCourseId);
  });
});

// ============================================================
//               NETTOYAGE FINAL
// ============================================================
afterAll(async () => {
  if (userId) {
    await mongoose.model("User").findByIdAndDelete(userId);
  }
  await mongoose.connection.close();
});
