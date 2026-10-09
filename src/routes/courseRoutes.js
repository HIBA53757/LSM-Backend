import express from "express";
import { getCourses , getCourseById , createCourse, updateCourse, publishCourse } from "../controllers/courseController.js";
import { getModulesByCourse } from "../controllers/moduleController.js";
import { authenticate, authorize } from "../middlewares/Auth.js";
import {ownCourse} from "../middlewares/ownCourse.js";

const router = express.Router();

router.get("/", getCourses);

router.get("/:id", getCourseById);

router.get("/:courseId/modules", getModulesByCourse);

router.post("/",authenticate, authorize("admin","trainer"), createCourse);

router.patch("/:id",authenticate,authorize("trainer", "admin"),ownCourse, updateCourse);

router.patch("/:id/publish",authenticate, authorize("admin","trainer"),ownCourse, publishCourse)

export default router;