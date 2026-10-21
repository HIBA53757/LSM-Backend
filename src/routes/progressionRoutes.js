import express from "express";
import {
  markResourceViewed,
  completeModule,
  getCourseProgression,
  getResourceById,
} from "../controllers/progressionController.js";
import { authenticate, authorize } from "../middlewares/Auth.js";
import { requireActiveEnrollment } from "../middlewares/activeEnrollment.js";

const router = express.Router();

router.get(
  "/courses/:courseId",
  authenticate,
  authorize("learner"),
  requireActiveEnrollment("course", "courseId"),
  getCourseProgression,
);

router.post(
  "/modules/:moduleId/complete",
  authenticate,
  authorize("learner"),
  requireActiveEnrollment("module", "moduleId"),
  completeModule,
);

router.get(
  "/resources/:resourceId/view",
  authenticate,
  authorize("learner"),
  requireActiveEnrollment("resource", "resourceId"),
  getResourceById
);

router.post(
  "/resources/:resourceId/complete",
  authenticate,
  authorize("learner"),
  requireActiveEnrollment("resource", "resourceId"),
  markResourceViewed,
);

export default router;
