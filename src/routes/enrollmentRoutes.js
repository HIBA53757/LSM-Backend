import express from "express";
import {
  enrollCourse,
  getMyEnrollments,
  cancelEnrollment,
} from "../controllers/enrollmentController.js";
import { authenticate, authorize } from "../middlewares/Auth.js";

const router = express.Router();

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

router.patch(
  "/enrollments/:id/cancel",
  authenticate,
  authorize("learner"),
  cancelEnrollment,
);
export default router;
