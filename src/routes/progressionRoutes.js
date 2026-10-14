import express from "express";
import { startOrResumeCourse } from "../controllers/progressionController.js";
import { authenticate, authorize } from "../middlewares/Auth.js";

const router = express.Router();

router.post(
  "/courses/:courseId/progress/start",
  authenticate,
  authorize("learner"),
  startOrResumeCourse,
);

export default router;
