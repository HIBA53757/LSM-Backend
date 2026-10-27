import express from "express"
import {getConfig} from "../controllers/adminConfigController.js"
import { authenticate, authorize } from "../middlewares/Auth.js"


const router = express.Router()
router.get("/config",authenticate,authorize("admin"),getConfig)

export default router
