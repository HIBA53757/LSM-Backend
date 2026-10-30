import request from "supertest";
import mongoose from "mongoose";
import app from "../src/app.js";
import { connectDB } from "../src/config/database.js";

let trainerToken = "";
let learnerToken = "";
let adminToken = "";

const trainerEmail = `feedback-trainer-${Date.now()}@test.com`;
const learnerEmail = `feedback-learner-${Date.now()}@test.com`;
const adminEmail = `feedback-admin-${Date.now()}@test.com`;
const password = "MotDePasse123";

beforeAll(async () => {
    await connectDB();

    // Créer un formateur
    const trainerRegister = await request(app)
        .post("/api/auth/register")
        .send({
            name: "Trainer Test",
            email: trainerEmail,
            password,
        });

    expect(trainerRegister.statusCode).toBe(201);

    // Créer un apprenant
    const learnerRegister = await request(app)
        .post("/api/auth/register")
        .send({
            name: "Learner Test",
            email: learnerEmail,
            password,
        });

    expect(learnerRegister.statusCode).toBe(201);

    // Connexion des comptes
    // Modifier le rôle du compte en formateur
    await mongoose.model("User").findOneAndUpdate(
        { email: trainerEmail },
        { $set: { role: "trainer" } }
    );

    // Se connecter après la modification du rôle
    const trainerLogin = await request(app)
        .post("/api/auth/login")
        .send({ email: trainerEmail, password });

    const learnerLogin = await request(app)
        .post("/api/auth/login")
        .send({ email: learnerEmail, password });

    trainerToken = trainerLogin.body.token;
    learnerToken = learnerLogin.body.token;
    // Le compte admin doit déjà exister dans ta base de test.
    // Remplace ces identifiants par ceux de ton admin de test.
    const adminLogin = await request(app)
        .post("/api/auth/login")
        .send({
            email: process.env.TEST_ADMIN_EMAIL,
            password: process.env.TEST_ADMIN_PASSWORD,
        });

    if (adminLogin.statusCode === 200) {
        adminToken = adminLogin.body.token;
    }
}, 15000);

describe("Feedback API", () => {
    test("Refuser la création sans authentification", async () => {
        const res = await request(app)
            .post("/api/feedback")
            .send({ message: "Bon travail", rating: 5 });

        expect(res.statusCode).toBe(401);
    });

    test("Refuser la création par un apprenant", async () => {
        const res = await request(app)
            .post("/api/feedback")
            .set("Authorization", `Bearer ${learnerToken}`)
            .send({ message: "Bon travail", rating: 5 });

        expect([401, 403]).toContain(res.statusCode);
    });

    test("Refuser la consultation de /me sans authentification", async () => {
        const res = await request(app).get("/api/feedback/me");

        expect(res.statusCode).toBe(401);
    });

    test("Refuser la consultation de /me par un formateur", async () => {
        const res = await request(app)
            .get("/api/feedback/me")
            .set("Authorization", `Bearer ${trainerToken}`);

        expect([401, 403]).toContain(res.statusCode);
    });

    test("Refuser la consultation de tous les feedbacks par un apprenant", async () => {
        const res = await request(app)
            .get("/api/feedback")
            .set("Authorization", `Bearer ${learnerToken}`);

        expect([401, 403]).toContain(res.statusCode);
    });

    test("Refuser la modification sans authentification", async () => {
        const res = await request(app)
            .put("/api/feedback/000000000000000000000001")
            .send({ message: "Message modifié" });

        expect(res.statusCode).toBe(401);
    });

    test("Refuser la suppression sans authentification", async () => {
        const res = await request(app)
            .delete("/api/feedback/000000000000000000000001");

        expect(res.statusCode).toBe(401);
    });

    test("Refuser un identifiant de feedback inexistant", async () => {
        const res = await request(app)
            .put("/api/feedback/000000000000000000000001")
            .set("Authorization", `Bearer ${trainerToken}`)
            .send({ message: "Message modifié" });

        expect([400, 403, 404]).toContain(res.statusCode);
    });

    test("Refuser la suppression d'un feedback inexistant", async () => {
        const res = await request(app)
            .delete("/api/feedback/000000000000000000000001")
            .set("Authorization", `Bearer ${trainerToken}`);

        expect([400, 403, 404]).toContain(res.statusCode);
    });
});

afterAll(async () => {
    // Supprimer uniquement les comptes créés par ce test.
    if (mongoose.connection.readyState === 1) {
        await mongoose.model("User").deleteMany({
            email: { $in: [trainerEmail, learnerEmail] },
        });

        await mongoose.connection.close();
    }
});
