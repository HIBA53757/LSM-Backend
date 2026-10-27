import express from "express";
import { createPreferences, deletePreferences, getPreferences, updatePreferences } from "../controllers/trainerPreferencesController.js";
import { authenticate, authorize } from "../middlewares/Auth.js";
import { createTrainerPreferencesSchema, updateTrainerPreferencesSchema } from "../validations/trainerPreferencesValidator.js";
import { schemaValidate } from "../middlewares/schemaValidate.js";

const router = express.Router();


router.post('/', authenticate, authorize('trainer'), schemaValidate(createTrainerPreferencesSchema), createPreferences)
router.patch('/:id', authenticate, authorize('trainer'), schemaValidate(updateTrainerPreferencesSchema), updatePreferences)
router.get("/:id", authenticate, authorize("trainer"), getPreferences);
router.delete("/:id", authenticate, authorize("trainer"), deletePreferences);


export default router