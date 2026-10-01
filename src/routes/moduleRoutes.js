import express from "express";
import { getResourcesByModule } from "../controllers/resourceController.js";

const router = express.Router();

router.get("/:moduleId/resources", getResourcesByModule);

export default router;