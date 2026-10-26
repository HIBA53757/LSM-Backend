import express from "express"
import { authenticate, authorize } from "../middlewares/Auth.js"
import {getPersonalAttemps, getPersonalAttempsOnCourse, getCoursesUsersAttemps, getCourseUsersAttempsById } from "../controllers/quizAttemptsController.js"
import { requireActiveEnrollment } from "../middlewares/activeEnrollment.js"
import { ownCourse } from "../middlewares/ownCourse.js"

const router = express.Router()

// learner

router.get("/me", authenticate, authorize("learner"), getPersonalAttemps)
router.get("/me/courses/:courseId", authenticate, authorize("learner"), requireActiveEnrollment("course", "courseId"), getPersonalAttempsOnCourse)

// trainer
router.get("/", authenticate, authorize("trainer","admin"), getCoursesUsersAttemps)
router.get("/courses/:courseId", authenticate, authorize("trainer","admin"), ownCourse, getCourseUsersAttempsById)


export default router