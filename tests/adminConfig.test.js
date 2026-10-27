
import request from "supertest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import app from "../src/app.js";
import User from "../src/models/User.js";
import AppConfig from "../src/models/appConfig.js"

const TEST_URI =
  process.env.MONGO_URI_TEST ||
  "mongodb://127.0.0.1:27017/lms_test";

let adminToken;
let trainerToken;

async function createUser(role, email) {
  const user = await User.create({
    name: `${role} test`,
    email,
    password: "TestPassword123!",
    role,
    accountStatus: "active",
  });

  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1h" },
  );
}

beforeAll(async () => {
  await mongoose.connect(TEST_URI);
});

beforeEach(async () => {
  await AppConfig.deleteMany({});
  await User.deleteMany({});

  adminToken = await createUser("admin", "admin@test.com");
  trainerToken = await createUser("trainer", "trainer@test.com");
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

describe("GET /api/admin/config", () => {
  it("returns and creates the default configuration", async () => {
    const response = await request(app)
      .get("/api/admin/config")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.emailDriver).toBe("log");
    expect(response.body.data.inactiveDays).toBe(7);

    expect(await AppConfig.countDocuments()).toBe(1);
  });

  it("rejects a request without a token", async () => {
    const response = await request(app).get("/api/admin/config");

    expect(response.status).toBe(401);
  });

  it("rejects a trainer", async () => {
    const response = await request(app)
      .get("/api/admin/config")
      .set("Authorization", `Bearer ${trainerToken}`);

    expect(response.status).toBe(403);
  });
});

describe("PATCH /api/admin/config", () => {
  it("updates only the supplied field", async () => {
    await AppConfig.create({
      emailsEnabled: true,
      emailDriver: "log",
      inactiveDays: 7,
      inactiveReminderFrequency: "0 9 * * *",
      trainerSummaryFrequency: "0 8 * * 1",
    });

    const response = await request(app)
      .patch("/api/admin/config")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ inactiveDays: 10 });

    expect(response.status).toBe(200);
    expect(response.body.data.inactiveDays).toBe(10);
    expect(response.body.data.emailDriver).toBe("log");
    expect(response.body.data.emailsEnabled).toBe(true);
  });

  it("rejects a non-positive inactiveDays value", async () => {
    const response = await request(app)
      .patch("/api/admin/config")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ inactiveDays: -5 });

    expect(response.status).toBe(400);
  });

  it("rejects an invalid cron expression", async () => {
    const response = await request(app)
      .patch("/api/admin/config")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ inactiveReminderFrequency: "invalid-cron" });

    expect(response.status).toBe(400);
  });

  it("rejects fields that are not allowed", async () => {
    const response = await request(app)
      .patch("/api/admin/config")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ SMTP_PASS: "should-not-be-accepted" });

    expect(response.status).toBe(400);
  });

  it("rejects a trainer attempting to update the config", async () => {
    const response = await request(app)
      .patch("/api/admin/config")
      .set("Authorization", `Bearer ${trainerToken}`)
      .send({ inactiveDays: 10 });

    expect(response.status).toBe(403);
  });
});
