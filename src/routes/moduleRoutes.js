import express from "express";
import { getResourcesByModule } from "../controllers/resourceController.js";
import { createModule } from "../controllers/moduleController.js";
import { authenticate , authorize } from "../middlewares/Auth.js";
import { ownCourse } from "../middlewares/ownCourse.js";

const router = express.Router();

router.get("/:moduleId/resources", getResourcesByModule);
router.post("/courses/:courseId/modules",authenticate ,authorize("admin","trainer"), ownCourse, createModule)

export default router;