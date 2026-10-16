import express from "express"
import { authenticate, authorize } from "../middlewares/Auth.js";
import { getTrainerCourses } from "../controllers/trainerController.js";

const router = express.Router()


router.get("/Courses",authenticate,authorize("admin","trainer"),getTrainerCourses)


export default router;