import express from "express";
import { authenticate, authorize } from "../middlewares/Auth.js";
import { ownModule } from "../middlewares/ownModule.js";
import { createResource, updateResource } from "../controllers/resourceController.js";
import { ownCourse } from "../middlewares/ownCourse.js";
import { ownResource } from "../middlewares/ownResourse.js";


const router = express.Router();
router.post("/courses/:courseId/modules/:moduleId/resources",authenticate ,authorize("admin","trainer"),ownCourse , ownModule , createResource)
router.patch("/:courseId/:moduleId/resources/:resourceId",authenticate ,authorize("admin","trainer"),ownCourse,ownModule,ownResource,updateResource)
export default router;