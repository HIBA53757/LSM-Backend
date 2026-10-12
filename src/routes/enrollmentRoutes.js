import express from "express";
import {
  enrollCourse,
  getMyEnrollments,
} from "../controllers/enrollmentController.js";
import { authenticate, authorize } from "../middlewares/Auth.js";

const router = express.Router();

// Only logged-in learners can enroll and view their enrollments
router.post(
  "/courses/:courseId/enroll",
  authenticate,
  authorize("learner"),
  enrollCourse,
);
router.get(
  "/learners/me/enrollments",
  authenticate,
  authorize("learner"),
  getMyEnrollments,
);

export default router;
