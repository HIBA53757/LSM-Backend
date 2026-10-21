import express from "express"
import { authenticate } from "../middlewares/Auth.js"
import { authorize } from "../middlewares/Auth.js"
import { me } from "../controllers/ProfileController.js"

const router = express.Router()

router.get('/me', authenticate, me)

export default router