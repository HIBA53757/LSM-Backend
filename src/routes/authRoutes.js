import { Router } from "express";
const router = Router();
import { register, login } from "../controllers/AuthController.js";
import { authenticate } from "../middlewares/Auth.js";

router.post("/register", register);
router.post("/login", login);

export default router;
