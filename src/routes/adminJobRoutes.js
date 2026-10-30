import express from "express";

import { runInactiveReminder,runTrainerSummary,getJobRuns,} from "../controllers/adminJobController.js";
import { authenticate, authorize } from "../middlewares/Auth.js";

const router = express.Router();

router.post("/inactive-reminder/run",authenticate,authorize("admin"),runInactiveReminder);
router.post("/trainer-summary/run",authenticate,authorize("trainer"),runTrainerSummary);
router.get( "/runs",authenticate,authorize("admin"),getJobRuns);

export default router;