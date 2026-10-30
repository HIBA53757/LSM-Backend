import express from "express"

import courseRoutes from "./routes/courseRoutes.js";
import moduleRoutes from "./routes/moduleRoutes.js";
import enrollmentRoutes from "./routes/enrollmentRoutes.js";
import progressionRoutes from "./routes/progressionRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import resourceRoutes from "./routes/resourceRoutes.js";
import trainerRoutes from  "./routes/trainerRoutes.js";
import profileRoutes from "./routes/profileRoutes.js"
import feedbackRoutes from "./routes/feedbackRoutes.js"
import quizRoutes from "./routes/quizRoutes.js";
import trainerPreferenceRoutes from "./routes/trainerPreferenceRoutes.js";
import quizAttemptRoutes from "./routes/quizAttemptsRoutes.js";
import adminConfigRoutes from "./routes/adminConfigRoutes.js"
import adminJobRoutes from "./routes/adminJobRoutes.js"

const router = express.Router()

router.use("/auth", authRoutes);
router.use("/courses", courseRoutes);
router.use("/modules", moduleRoutes);
router.use("/enrollments", enrollmentRoutes);
router.use("/resources", resourceRoutes);
router.use("/progress", progressionRoutes);
router.use("/trainer", trainerRoutes)
router.use("/profiles", profileRoutes)
router.use("/feedback" , feedbackRoutes)
router.use("/preferences" , trainerPreferenceRoutes)
router.use("/quizzes", quizRoutes)
router.use("/quiz/attempts", quizAttemptRoutes)
router.use("/admin",adminConfigRoutes)  
router.use("/admin/jobs",adminJobRoutes)

export default router
