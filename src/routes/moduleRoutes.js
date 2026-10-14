import express from "express";
import { getResourcesByModule } from "../controllers/resourceController.js";
import { createModule, publishModule, unpublishModule, updateModule } from "../controllers/moduleController.js";
import { authenticate , authorize } from "../middlewares/Auth.js";
import { ownCourse } from "../middlewares/ownCourse.js";
import { ownModule } from "../middlewares/ownModule.js";


const router = express.Router();

router.get("/:moduleId/resources", getResourcesByModule);

router.post("/courses/:courseId/modules",authenticate ,authorize("admin","trainer"), ownCourse, createModule)

router.patch("/:courseId/:moduleId/modules",authenticate,authorize("admin","trainer"),ownCourse ,ownModule, updateModule)

router.patch("/courses/:courseId/modules/:moduleId/publish", authenticate, authorize("trainer", "admin"), ownCourse, ownModule, publishModule)

router.patch("/courses/:courseId/modules/:moduleId/unpublish", authenticate, authorize("trainer", "admin"), ownCourse, ownModule, unpublishModule)
export default router;