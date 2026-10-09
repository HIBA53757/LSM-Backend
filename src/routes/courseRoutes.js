import express from "express";
import { getCourses , getCourseById , createCourse } from "../controllers/courseController.js";
import { getModulesByCourse } from "../controllers/moduleController.js";
import { authenticate, authorize } from "../middlewares/Auth.js";

import { mockTrainer } from "../middlewares/mockTrainer.js";

const router = express.Router();

router.get("/", getCourses);

router.get("/:id", getCourseById);

router.get("/:courseId/modules", getModulesByCourse);

router.post("/",mockTrainer, authorize("admin","trainer"), createCourse);

export default router;