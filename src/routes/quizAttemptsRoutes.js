import express from "express"
import { authenticate, authorize } from "../middlewares/Auth.js"
import {getPersonalAttemps, getPersonalAttempsOnCourse } from "../controllers/quizAttemptsController.js"
import { requireActiveEnrollment } from "../middlewares/activeEnrollment.js"

const router = express.Router()

//learner

router.get("/me", authenticate, authorize("learner"), getPersonalAttemps)
router.get("/me/courses/:courseId", authenticate, authorize("learner"), requireActiveEnrollment("course", "courseId"), getPersonalAttempsOnCourse)



export default router