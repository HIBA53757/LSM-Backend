import dotenv from "dotenv";
import mongoose from "mongoose";

import User from "../src/models/User.js";
import Course from "../src/models/course.js";
import Module from "../src/models/module.js";
import Resource from "../src/models/resource.js";
import Quiz from "../src/models/quiz.js";
import QuizAttempt from "../src/models/quizAttempt.js";
import Enrollment from "../src/models/Enrollment.js";
import Progress from "../src/models/progress.js";
import Feedback from "../src/models/Feedback.js";
import TrainerPreference from "../src/models/TrainerPreference.js";
import AppConfig from "../src/models/appConfig.js";

import { hashPassword } from "../src/utils/jwtHelper.js";

dotenv.config();

const DEMO_PREFIX = "[LSM-SEED]";

const DEMO_USERS = {
  admin: {
    name: "Demo Admin",
    email: "admin.demo@example.test",
    role: "admin",
    passwordEnv: "SEED_ADMIN_PASSWORD",
  },
  trainerOne: {
    name: "Demo Trainer One",
    email: "trainer.one@example.test",
    role: "trainer",
    passwordEnv: "SEED_TRAINER_PASSWORD",
  },
  trainerTwo: {
    name: "Demo Trainer Two",
    email: "trainer.two@example.test",
    role: "trainer",
    passwordEnv: "SEED_TRAINER_PASSWORD",
  },
  learnerOne: {
    name: "Demo Learner One",
    email: "learner.one@example.test",
    role: "learner",
    passwordEnv: "SEED_LEARNER_PASSWORD",
  },
  learnerTwo: {
    name: "Demo Learner Two",
    email: "learner.two@example.test",
    role: "learner",
    passwordEnv: "SEED_LEARNER_PASSWORD",
  },
};

function requiredEnv(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

async function upsertDemoUser(userConfig) {
  const password = requiredEnv(userConfig.passwordEnv);
  const email = userConfig.email.toLowerCase();
  const hashedPassword = await hashPassword(password);

  let user = await User.findOne({ email });

  if (!user) {
    user = new User({ email });
  }

  user.name = userConfig.name;
  user.password = hashedPassword;
  user.role = userConfig.role;
  user.accountStatus = "active";

  await user.save();
  return user;
}

async function removePreviousDemoData(trainerIds) {
  const oldCourses = await Course.find({
    trainer: { $in: trainerIds },
    title: { $regex: "^\\[LSM-SEED\\]" },
  }).select("_id");

  const courseIds = oldCourses.map((course) => course._id);

  if (courseIds.length === 0) {
    return;
  }

  const oldModules = await Module.find({
    course: { $in: courseIds },
  }).select("_id");

  const moduleIds = oldModules.map((module) => module._id);

  const oldQuizzes = await Quiz.find({
    module: { $in: moduleIds },
  }).select("_id");

  const quizIds = oldQuizzes.map((quiz) => quiz._id);

  if (quizIds.length) {
    await QuizAttempt.deleteMany({ quiz: { $in: quizIds } });
    await Quiz.deleteMany({ _id: { $in: quizIds } });
  }

  await Feedback.deleteMany({ course: { $in: courseIds } });

  await TrainerPreference.updateMany(
    { courses: { $in: courseIds } },
    { $pull: { courses: { $in: courseIds } } },
  );

  await Progress.deleteMany({ course: { $in: courseIds } });
  await Enrollment.deleteMany({ course: { $in: courseIds } });

  if (moduleIds.length) {
    await Resource.deleteMany({ module: { $in: moduleIds } });
    await Module.deleteMany({ _id: { $in: moduleIds } });
  }

  await Course.deleteMany({ _id: { $in: courseIds } });
}

async function createCourseContent(course) {
  const modules = await Module.create([
    {
      title: `${course.title} — Module 1`,
      description: "Introduction et premières notions.",
      position: 1,
      estimatedDuration: 8,
      status: "published",
      course: course._id,
    },
    {
      title: `${course.title} — Module 2`,
      description: "Exercices et notions avancées.",
      position: 2,
      estimatedDuration: 12,
      status: "published",
      course: course._id,
    },
  ]);

  const resources = await Resource.create([
    {
      title: `${course.title} — Article 1`,
      type: "article",
      content: "Contenu de démonstration du premier module.",
      description: "Article de démonstration.",
      position: 1,
      status: "published",
      module: modules[0]._id,
    },
    {
      title: `${course.title} — Article 2`,
      type: "article",
      content: "Contenu de démonstration du deuxième module.",
      description: "Article de démonstration.",
      position: 1,
      status: "published",
      module: modules[1]._id,
    },
  ]);

  const quizzes = await Quiz.create([
    {
      module: modules[0]._id,
      title: `${course.title} — Quiz 1`,
      questions: [
        {
          text: "Which keyword declares a constant in JavaScript?",
          choices: [
            { number: 1, text: "var" },
            { number: 2, text: "const" },
          ],
          correctAnswer: 2,
          points: 10,
        },
      ],
      passingScore: 5,
      isActive: true,
      isRequired: true,
    },
    {
      module: modules[1]._id,
      title: `${course.title} — Quiz 2`,
      questions: [
        {
          text: "Which status code usually means success?",
          choices: [
            { number: 1, text: "200" },
            { number: 2, text: "404" },
          ],
          correctAnswer: 1,
          points: 10,
        },
      ],
      passingScore: 5,
      isActive: true,
      isRequired: false,
    },
  ]);

  return { modules, resources, quizzes };
}

async function setOldProgressDate(progress, date) {
  // inactiveReminder vérifie Progress.updatedAt.
  // On utilise la collection directement pour conserver cette date ancienne.
  await Progress.collection.updateOne(
    { _id: progress._id },
    {
      $set: {
        createdAt: date,
        updatedAt: date,
      },
    },
  );
}

async function seed() {
  const mongoUri = requiredEnv("MONGO_URI");

  await mongoose.connect(mongoUri);

  const admin = await upsertDemoUser(DEMO_USERS.admin);
  const trainerOne = await upsertDemoUser(DEMO_USERS.trainerOne);
  const trainerTwo = await upsertDemoUser(DEMO_USERS.trainerTwo);
  const learnerOne = await upsertDemoUser(DEMO_USERS.learnerOne);
  const learnerTwo = await upsertDemoUser(DEMO_USERS.learnerTwo);

  await removePreviousDemoData([trainerOne._id, trainerTwo._id]);

  const courses = await Course.create([
    {
      title: `${DEMO_PREFIX} JavaScript`,
      description: "Cours de démonstration JavaScript.",
      objectives: ["Apprendre JavaScript", "Écrire des fonctions"],
      level: "beginner",
      category: "Programming",
      estimatedDuration: 20,
      status: "published",
      publishedAt: new Date(),
      trainer: trainerOne._id,
    },
    {
      title: `${DEMO_PREFIX} Node and Express`,
      description: "Cours de démonstration Node.js et Express.",
      objectives: ["Comprendre Node.js", "Créer une API"],
      level: "intermediate",
      category: "Backend",
      estimatedDuration: 25,
      status: "published",
      publishedAt: new Date(),
      trainer: trainerOne._id,
    },
    {
      title: `${DEMO_PREFIX} MongoDB`,
      description: "Cours de démonstration MongoDB.",
      objectives: ["Comprendre les documents", "Utiliser Mongoose"],
      level: "beginner",
      category: "Database",
      estimatedDuration: 18,
      status: "published",
      publishedAt: new Date(),
      trainer: trainerTwo._id,
    },
  ]);

  const content = new Map();

  for (const course of courses) {
    content.set(course._id.toString(), await createCourseContent(course));
  }

  const [javascriptCourse, nodeCourse, mongoCourse] = courses;
  const javascriptContent = content.get(javascriptCourse._id.toString());
  const nodeContent = content.get(nodeCourse._id.toString());
  const mongoContent = content.get(mongoCourse._id.toString());

  const appConfig =
    (await AppConfig.findOne()) ??
    (await AppConfig.create({
      emailsEnabled: true,
      emailDriver: "log",
      inactiveDays: 7,
      inactiveReminderFrequency: "0 9 * * *",
      trainerSummaryFrequency: "0 8 * * 1",
    }));

  const inactiveDays = appConfig.inactiveDays ?? 7;
  const oldDate = new Date(
    Date.now() - (inactiveDays + 1) * 24 * 60 * 60 * 1000,
  );

  const enrollments = await Enrollment.create([
    {
      learner: learnerOne._id,
      course: javascriptCourse._id,
      status: "active",
    },
    {
      learner: learnerTwo._id,
      course: javascriptCourse._id,
      status: "completed",
    },
    {
      learner: learnerOne._id,
      course: nodeCourse._id,
      status: "active",
      enrolledAt: oldDate,
    },
    {
      learner: learnerTwo._id,
      course: mongoCourse._id,
      status: "active",
    },
  ]);

  const progresses = await Progress.create([
    {
      enrollment: enrollments[0]._id,
      learner: learnerOne._id,
      course: javascriptCourse._id,
      completedResources: [javascriptContent.resources[0]._id],
      completedModules: [javascriptContent.modules[0]._id],
      percent: 50,
    },
    {
      enrollment: enrollments[1]._id,
      learner: learnerTwo._id,
      course: javascriptCourse._id,
      completedResources: javascriptContent.resources.map(
        (resource) => resource._id,
      ),
      completedModules: javascriptContent.modules.map(
        (module) => module._id,
      ),
      percent: 100,
    },
    {
      enrollment: enrollments[2]._id,
      learner: learnerOne._id,
      course: nodeCourse._id,
      completedResources: [],
      completedModules: [],
      percent: 0,
    },
    {
      enrollment: enrollments[3]._id,
      learner: learnerTwo._id,
      course: mongoCourse._id,
      completedResources: [mongoContent.resources[0]._id],
      completedModules: [mongoContent.modules[0]._id],
      percent: 50,
    },
  ]);

  await setOldProgressDate(progresses[2], oldDate);

  const javascriptQuiz = javascriptContent.quizzes[0];
  const mongoQuiz = mongoContent.quizzes[0];

  await QuizAttempt.create([
    {
      learner: learnerOne._id,
      quiz: javascriptQuiz._id,
      answers: [
        {
          question: javascriptQuiz.questions[0]._id,
          selectedChoice: 2,
          awardedPoints: 10,
        },
      ],
      score: 10,
      passed: true,
      status: "submitted",
      submittedAt: new Date(),
    },
    {
      learner: learnerTwo._id,
      quiz: mongoQuiz._id,
      answers: [
        {
          question: mongoQuiz.questions[0]._id,
          selectedChoice: 2,
          awardedPoints: 0,
        },
      ],
      score: 0,
      passed: false,
      status: "submitted",
      submittedAt: new Date(),
    },
  ]);

  await Feedback.create({
    trainer: trainerOne._id,
    learner: learnerTwo._id,
    course: javascriptCourse._id,
    progress: progresses[1]._id,
    message: "Très bon cours, les explications sont claires.",
    rating: 5,
  });

  await TrainerPreference.findOneAndUpdate(
    { trainer: trainerOne._id },
    {
      $set: {
        subscribed: true,
        courses: [javascriptCourse._id, nodeCourse._id],
        frequency: "weekly",
      },
    },
    { upsert: true, new: true, runValidators: true },
  );

  await TrainerPreference.findOneAndUpdate(
    { trainer: trainerTwo._id },
    {
      $set: {
        subscribed: false,
        courses: [mongoCourse._id],
        frequency: "monthly",
      },
    },
    { upsert: true, new: true, runValidators: true },
  );

  console.log("Seed de démonstration terminé.");
  console.log("Comptes créés/mis à jour :");
  console.log(`Admin : ${admin.email}`);
  console.log(`Formateurs : ${trainerOne.email}, ${trainerTwo.email}`);
  console.log(`Apprenants : ${learnerOne.email}, ${learnerTwo.email}`);
  console.log(`Cours : ${courses.length}`);
}

try {
  await seed();
} catch (error) {
  console.error("Seed échoué :", error.message);
  process.exitCode = 1;
} finally {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}