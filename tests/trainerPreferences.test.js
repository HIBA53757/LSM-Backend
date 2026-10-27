import request from "supertest";
import mongoose from "mongoose";
import app from "../src/app.js";
import User from "../src/models/User.js";
import Course from "../src/models/course.js";
import TrainerPreference from "../src/models/TrainerPreference.js";
import { connectDB } from "../src/config/database.js";

describe("Trainer Preferences API", () => {
    let trainer;
    let otherTrainer;
    let learner;

    let trainerToken;
    let otherTrainerToken;
    let learnerToken;

    let course;
    let otherCourse;
    let preference;

    const baseUrl = "/api/preferences";

    async function registerAndLogin(email, role = "learner") {
        const password = "TestPassword123!";

        const registerResponse = await request(app)
            .post("/api/auth/register")
            .send({
                name: `Test ${email.split("@")[0]}`,
                email,
                password,
            });

        expect([200, 201]).toContain(registerResponse.status);

        const user = await User.findOne({ email });

        expect(user).not.toBeNull();

        user.role = role;
        await user.save();

        const loginResponse = await request(app)
            .post("/api/auth/login")
            .send({ email, password });

        expect(loginResponse.status).toBe(200);

        return {
            user,
            token: loginResponse.body.token || loginResponse.body.accessToken,
        };
    }

    async function createPreference(
        token = trainerToken,
        courseId = course._id
    ) {
        return request(app)
            .post(baseUrl)
            .set("Authorization", `Bearer ${token}`)
            .send({
                subscribed: true,
                courses: [courseId],
                frequency: "weekly",
            });
    }

    beforeAll(async () => {
        await connectDB();

        const trainerData = await registerAndLogin(
            `trainer-${Date.now()}@test.com`,
            "trainer"
        );

        trainer = trainerData.user;
        trainerToken = trainerData.token;

        const otherTrainerData = await registerAndLogin(
            `other-trainer-${Date.now()}@test.com`,
            "trainer"
        );

        otherTrainer = otherTrainerData.user;
        otherTrainerToken = otherTrainerData.token;

        const learnerData = await registerAndLogin(
            `learner-${Date.now()}@test.com`,
            "learner"
        );

        learner = learnerData.user;
        learnerToken = learnerData.token;

        course = await Course.create({
            title: "Test course",
            description: "Course for automated tests",
            trainer: trainer._id,
            estimatedDuration: 10,
            category: "Web Development",
            level: "beginner",
        });

        otherCourse = await Course.create({
            title: "Other trainer course",
            description: "Course owned by another trainer",
            trainer: otherTrainer._id,
            estimatedDuration: 8,
            category: "Web Development",
            level: "beginner",
        });
    }, 30000);

    beforeEach(async () => {
        await TrainerPreference.deleteMany({
            trainer: { $in: [trainer._id, otherTrainer._id] },
        });
    });
    afterAll(async () => {
        if (trainer && otherTrainer) {
            await TrainerPreference.deleteMany({
                trainer: { $in: [trainer._id, otherTrainer._id] },
            });
        }

        const courseIds = [course?._id, otherCourse?._id].filter(Boolean);

        if (courseIds.length > 0) {
            await Course.deleteMany({
                _id: { $in: courseIds },
            });
        }

        const userIds = [trainer?._id, otherTrainer?._id, learner?._id].filter(Boolean);

        if (userIds.length > 0) {
            await User.deleteMany({
                _id: { $in: userIds },
            });
        }

        await mongoose.connection.close();
    });


    // 1. Création réussie
    test("1. Créer les préférences avec des données valides", async () => {
        const response = await createPreference();

        expect(response.status).toBe(201);
        expect(response.body.preferences).toBeDefined();
        expect(response.body.preferences.subscribed).toBe(true);
    });

    // 2. Sans authentification
    test("2. Refuser la création sans authentification", async () => {
        const response = await request(app)
            .post(baseUrl)
            .send({
                subscribed: true,
                courses: [course._id],
                frequency: "weekly",
            });

        expect(response.status).toBe(401);
    });

    // 3. Rôle incorrect
    test("3. Refuser la création par un apprenant", async () => {
        const response = await request(app)
            .post(baseUrl)
            .set("Authorization", `Bearer ${learnerToken}`)
            .send({
                subscribed: true,
                courses: [course._id],
                frequency: "weekly",
            });

        expect(response.status).toBe(403);
    });

    // 4. Doublon
    test("4. Refuser la création de préférences en double", async () => {
        const first = await createPreference();
        expect(first.status).toBe(201);

        const second = await createPreference();
        expect(second.status).toBe(409);
    });

    // 5. Cours inexistant
    test("5. Refuser un cours inexistant", async () => {
        const missingCourseId = new mongoose.Types.ObjectId();

        const response = await createPreference(
            trainerToken,
            missingCourseId
        );

        expect(response.status).toBe(404);
    });

    // 6. Cours appartenant à un autre formateur
    test("6. Refuser le cours d'un autre formateur", async () => {
        const response = await createPreference(
            trainerToken,
            otherCourse._id
        );

        expect(response.status).toBe(403);
    });

    // 7. Données invalides
    test("7. Refuser une création avec un corps vide", async () => {
        const response = await request(app)
            .post(baseUrl)
            .set("Authorization", `Bearer ${trainerToken}`)
            .send({});

        expect([400, 422]).toContain(response.status);
    });

    // 8. Lecture réussie
    test("8. Récupérer ses préférences", async () => {
        const created = await createPreference();
        preference = created.body.preferences;

        const response = await request(app)
            .get(`${baseUrl}/${preference._id}`)
            .set("Authorization", `Bearer ${trainerToken}`);

        expect(response.status).toBe(200);
        expect(response.body.preferences).toBeDefined();
    });

    // 9. Lecture d'un identifiant inexistant
    test("9. Retourner 404 si les préférences n'existent pas", async () => {
        const missingId = new mongoose.Types.ObjectId();

        const response = await request(app)
            .get(`${baseUrl}/${missingId}`)
            .set("Authorization", `Bearer ${trainerToken}`);

        expect(response.status).toBe(404);
    });

    // 10. Lecture des préférences d'un autre formateur
    test("10. Empêcher un formateur de lire les préférences d'un autre", async () => {
        const created = await createPreference();
        preference = created.body.preferences;

        const response = await request(app)
            .get(`${baseUrl}/${preference._id}`)
            .set("Authorization", `Bearer ${otherTrainerToken}`);

        expect(response.status).toBe(404);
    });

    // 11. Modification réussie
    test("11. Modifier ses préférences", async () => {
        const created = await createPreference();
        preference = created.body.preferences;

        const response = await request(app)
            .patch(`${baseUrl}/${preference._id}`)
            .set("Authorization", `Bearer ${trainerToken}`)
            .send({ subscribed: false });

        expect(response.status).toBe(200);
        expect(response.body.preferences.subscribed).toBe(false);
    });

    // 12. Modification d'un identifiant inexistant
    test("12. Retourner 404 pour une modification inexistante", async () => {
        const missingId = new mongoose.Types.ObjectId();

        const response = await request(app)
            .patch(`${baseUrl}/${missingId}`)
            .set("Authorization", `Bearer ${trainerToken}`)
            .send({ subscribed: false });

        expect(response.status).toBe(404);
    });

    // 13. Modification des préférences d'un autre formateur
    test("13. Refuser la modification des préférences d'un autre formateur", async () => {
        const created = await createPreference();
        preference = created.body.preferences;

        const response = await request(app)
            .patch(`${baseUrl}/${preference._id}`)
            .set("Authorization", `Bearer ${otherTrainerToken}`)
            .send({ subscribed: false });

        expect(response.status).toBe(404);
    });

    // 14. Cours non autorisé pendant la modification
    test("14. Refuser l'ajout du cours d'un autre formateur", async () => {
        const created = await createPreference();
        preference = created.body.preferences;

        const response = await request(app)
            .patch(`${baseUrl}/${preference._id}`)
            .set("Authorization", `Bearer ${trainerToken}`)
            .send({ courses: [otherCourse._id] });

        expect(response.status).toBe(403);
    });

    // 15. Suppression réussie
    test("15. Supprimer ses préférences", async () => {
        const created = await createPreference();
        preference = created.body.preferences;

        const response = await request(app)
            .delete(`${baseUrl}/${preference._id}`)
            .set("Authorization", `Bearer ${trainerToken}`);

        expect(response.status).toBe(200);
    });

    // 16. Suppression d'un identifiant inexistant
    test("16. Retourner 404 pour une suppression inexistante", async () => {
        const missingId = new mongoose.Types.ObjectId();

        const response = await request(app)
            .delete(`${baseUrl}/${missingId}`)
            .set("Authorization", `Bearer ${trainerToken}`);

        expect(response.status).toBe(404);
    });

    // 17. Suppression des préférences d'un autre formateur
    test("17. Refuser la suppression des préférences d'un autre formateur", async () => {
        const created = await createPreference();
        preference = created.body.preferences;

        const response = await request(app)
            .delete(`${baseUrl}/${preference._id}`)
            .set("Authorization", `Bearer ${otherTrainerToken}`);

        expect(response.status).toBe(404);
    });
});
