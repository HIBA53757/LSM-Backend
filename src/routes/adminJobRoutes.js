
import express from "express";
import { runJobManually , getJobRuns } from "../controllers/adminJobController.js";
import { authenticate, authorize } from "../middlewares/Auth.js";

const router = express.Router();

router.post( "/:name/run", authenticate,authorize("admin"),runJobManually);
router.get("/runs",authenticate,authorize("admin"),getJobRuns)

export default router;
