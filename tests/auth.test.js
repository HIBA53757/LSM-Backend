
import request from "supertest";
import mongoose from "mongoose";
import { createHash } from "node:crypto";
import app from "../src/app.js";
import { connectDB } from "../src/config/database.js";

let userId = "";
const testEmail = `auth_${Date.now()}@test.com`;
const User = mongoose.model("User");

beforeAll(async () => {
    process.env.EMAIL_DRIVER = "log";
  await connectDB();
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

  test("Forgot password : demande de réinitialisation réussie", async () => {
    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: testEmail });

    expect(res.statusCode).toBe(200);

    // Vérifier que le token haché et sa date d'expiration sont enregistrés.
    const user = await User.findById(userId).select(
      "+resetPasswordToken +resetPasswordExpires"
    );

    expect(user.resetPasswordToken).toBeTruthy();
    expect(user.resetPasswordExpires).toBeInstanceOf(Date);
    expect(user.resetPasswordExpires.getTime()).toBeGreaterThan(Date.now());
  });

  test("Reset password : réinitialisation avec un token valide", async () => {
    // On prépare un token connu pour pouvoir tester sa validation.
    const resetToken = "test-reset-token-123";
    const hashedToken = createHash("sha256")
      .update(resetToken)
      .digest("hex");

    await User.findByIdAndUpdate(userId, {
      resetPasswordToken: hashedToken,
      resetPasswordExpires: new Date(Date.now() + 15 * 60 * 1000),
    });

    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({
        email: testEmail,
        token: resetToken,
        password: "NouveauMotDePasse123",
      });

    expect(res.statusCode).toBe(200);

    // Vérifier que le token est supprimé après son utilisation.
    const user = await User.findById(userId).select(
      "+resetPasswordToken +resetPasswordExpires"
    );

    expect(user.resetPasswordToken).toBeNull();
    expect(user.resetPasswordExpires).toBeNull();

    // Vérifier que le nouveau mot de passe fonctionne.
    const loginRes = await request(app).post("/api/auth/login").send({
      email: testEmail,
      password: "NouveauMotDePasse123",
    });

    expect(loginRes.statusCode).toBe(200);
    expect(loginRes.body).toHaveProperty("token");
  });

  test("Reset password : un token déjà utilisé est refusé", async () => {
    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({
        email: testEmail,
        token: "test-reset-token-123",
        password: "EncoreUnNouveauMotDePasse123",
      });

    expect(res.statusCode).not.toBe(200);
  });
});

afterAll(async () => {
  if (userId) {
    await User.findByIdAndDelete(userId);
  }

  await mongoose.connection.close();
});
