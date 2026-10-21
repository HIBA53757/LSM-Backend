import express from "express";
import {
  enrollCourse,
  getMyEnrollments,
  cancelEnrollment,
} from "../controllers/enrollmentController.js";
import { authenticate, authorize } from "../middlewares/Auth.js";

const router = express.Router();

router.get(
  "/me",
  authenticate,
  authorize("learner"),
  getMyEnrollments,
);


router.post(
  "/courses/:courseId/enroll",
  authenticate,
  authorize("learner"),
  enrollCourse,
);

router.patch(
  "/:id/cancel",
  authenticate,
  authorize("learner"),
  cancelEnrollment,
);

export default router;
