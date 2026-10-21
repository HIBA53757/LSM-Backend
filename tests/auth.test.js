
import request from "supertest";
import mongoose from "mongoose";
import app from "../src/app.js";
import { connectDB } from "../src/config/database.js";

// --- Variables de test ---
let userId = "";
const testEmail = `auth_${Date.now()}@test.com`;

// --- Connexion à MongoDB ---
beforeAll(async () => {
  await  connectDB()

});

describe("Authentification", () => {
  test("Inscription réussie", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Testeur Auth",
      email: testEmail,
      password: "MotDePasse123",
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.user.email).toBe(testEmail);

    userId = res.body.data.user.id;
  });

  test("Connexion réussie", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: testEmail,
      password: "MotDePasse123",
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("token");
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

// --- Nettoyage ---
afterAll(async () => {
  if (userId) {
    await mongoose.model("User").findByIdAndDelete(userId);
  }
  await mongoose.connection.close();
});
