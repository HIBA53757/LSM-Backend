import express from "express"
import { authenticate, authorize } from "../middlewares/Auth.js";
import { getCourseLearners, getTrainerCourses, getTrainerStatistics } from "../controllers/trainerController.js";
import {ownCourse} from "../middlewares/ownCourse.js";

const router = express.Router()


router.get("/Courses",authenticate,authorize("admin","trainer"),getTrainerCourses)
router.get("/courses/:courseId/learners",authenticate,authorize("admin","trainer"),ownCourse,getCourseLearners)
router.get("/statistics",authenticate,authorize("trainer"),getTrainerStatistics);

export default router;