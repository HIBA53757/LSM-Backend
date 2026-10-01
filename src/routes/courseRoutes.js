import express from "express";
import { getCourses , getCourseById } from "../controllers/courseController.js";
import { getModulesByCourse } from "../controllers/moduleController.js";

const router = express.Router();

router.get("/", getCourses);

router.get("/:id", getCourseById);

router.get("/:courseId/modules", getModulesByCourse);

export default router;