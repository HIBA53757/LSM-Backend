import express from "express";
import { createPreferences, deletePreferences, getPreferences } from "../controllers/trainerPreferencesController.js";
import { authenticate, authorize } from "../middlewares/Auth.js";
import { createTrainerPreferencesSchema } from "../validations/trainerPreferencesValidator.js";
import { schemaValidate } from "../middlewares/schemaValidate.js";

const router = express.Router();


router.post('/', authenticate, authorize('trainer'), schemaValidate(createTrainerPreferencesSchema), createPreferences)
router.get("/", authenticate, authorize("trainer"), getPreferences);
router.delete("/", authenticate, authorize("trainer"), deletePreferences);


export default router