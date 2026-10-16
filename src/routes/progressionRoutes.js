import express from "express";
import {
  startOrResumeCourse,
  markResourceViewed,
  completeModule,
  getCourseProgression,
} from "../controllers/progressionController.js";
import { authenticate, authorize } from "../middlewares/Auth.js";

const router = express.Router();

router.post(
  "/courses/:courseId/progress/start",
  authenticate,
  authorize("learner"),
  startOrResumeCourse,
);

router.post(
  "/resources/:resourceId/view",
  authenticate,
  authorize("learner"),
  markResourceViewed,
);

router.post(
  "/modules/:moduleId/complete",
  authenticate,
  authorize("learner"),
  completeModule,
);

router.get(
  "/courses/:courseId/progression",
  authenticate,
  authorize("learner"),
  getCourseProgression,
);
export default router;
