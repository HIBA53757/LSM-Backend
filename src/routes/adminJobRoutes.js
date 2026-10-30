
import express from "express";
import { runJobManually } from "../controllers/adminJobController.js";
import { authenticate, authorize } from "../middlewares/Auth.js";

const router = express.Router();

router.post( "/:name/run", authenticate,authorize("admin"),runJobManually
);

export default router;
