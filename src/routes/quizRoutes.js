import express from "express";
import {
  createQuiz,
  deleteQuiz,
  getQuiz,
  listQuizzesByModule,
  updateQuiz,
  viewQuiz
} from "../controllers/quizController.js";
import { authenticate, authorize } from "../middlewares/Auth.js";
import { ownModule } from "../middlewares/ownModule.js";
import { ownQuiz } from "../middlewares/ownQuiz.js";
import { schemaValidate } from "../middlewares/schemaValidate.js";
import quizSchema, { quizUpdateSchema } from "../validations/quizValidation.js";
import { requireActiveEnrollment } from "../middlewares/activeEnrollment.js";

const router = express.Router();

//learner endpoints 
router.get(
  "/modules/:moduleId",
  authenticate,
  authorize("trainer", "admin"),
  ownModule,
  listQuizzesByModule,
);

router.get("/:quizId/view",
  authenticate,
  authorize("learner"),
  requireActiveEnrollment("quiz", "quizId"),
  viewQuiz
)

// router.post("/submit",
//   authenticate,
//   authorize("learner"),
//   requireActiveEnrollment("quiz", "quizId", true)
// )

router.get(
  "/:quizId",
  authenticate,
  authorize("trainer", "admin"),
  ownQuiz,
  getQuiz,
);
router.post(
  "/",
  authenticate,
  authorize("trainer", "admin"),
  schemaValidate(quizSchema),
  ownModule,
  createQuiz,
);
router.patch(
  "/:quizId",
  authenticate,
  authorize("trainer", "admin"),
  schemaValidate(quizUpdateSchema),
  ownQuiz,
  updateQuiz,
);
router.delete(
  "/:quizId",
  authenticate,
  authorize("trainer", "admin"),
  ownQuiz,
  deleteQuiz,
);

export default router;
