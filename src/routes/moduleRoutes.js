import express from "express";
import { getResourcesByModule } from "../controllers/resourceController.js";
import { createModule, publishModule, unpublishModule, updateModule } from "../controllers/moduleController.js";
import { authenticate , authorize } from "../middlewares/Auth.js";
import { ownCourse } from "../middlewares/ownCourse.js";
import { ownModule } from "../middlewares/ownModule.js";


const router = express.Router();

router.get("/:moduleId/resources",authenticate, getResourcesByModule);

router.post("/courses/:courseId",authenticate ,authorize("admin","trainer"), ownCourse, createModule)

router.put("/:moduleId",authenticate,authorize("admin","trainer"),ownModule, updateModule)

router.patch("/:moduleId/publish", authenticate, authorize("trainer", "admin"), ownModule, publishModule)

router.patch("/:moduleId/unpublish", authenticate, authorize("trainer", "admin"), ownModule, unpublishModule)

export default router;