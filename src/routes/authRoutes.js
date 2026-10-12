import { Router } from "express";
const router = Router();
import { register, login, getMe } from "../controllers/uthController";
import { authenticate } from "../middlewares/auth";

router.post("/register", register);
router.post("/login", login);
router.get("/me", authenticate, getMe);

export default router;
