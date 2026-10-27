import express from "express"
import {getConfig , updateConfig} from "../controllers/adminConfigController.js"
import { authenticate, authorize } from "../middlewares/Auth.js"


const router = express.Router()
router.get("/config",authenticate,authorize("admin"),getConfig)
router.patch("/config",authenticate , authorize("admin"),updateConfig)

export default router
