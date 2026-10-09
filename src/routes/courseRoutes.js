import express from "express";
import { getCourses , getCourseById , createCourse, updateCourse } from "../controllers/courseController.js";
import { getModulesByCourse } from "../controllers/moduleController.js";
import { authenticate, authorize } from "../middlewares/Auth.js";
import {ownCourse} from "../middlewares/ownCourse.js";

import { mockTrainer } from "../middlewares/mockTrainer.js";

const router = express.Router();

router.get("/", getCourses);

router.get("/:id", getCourseById);

router.get("/:courseId/modules", getModulesByCourse);

router.post("/",mockTrainer, authorize("admin","trainer"), createCourse);

router.patch("/:id",mockTrainer,authorize("trainer", "admin"),ownCourse, updateCourse);

export default router;