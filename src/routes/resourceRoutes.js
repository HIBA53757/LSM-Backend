import express from "express";
import { authenticate, authorize } from "../middlewares/Auth.js";
import { ownModule } from "../middlewares/ownModule.js";
import { createResource, publishResource, updateResource } from "../controllers/resourceController.js";
import { ownCourse } from "../middlewares/ownCourse.js";
import { ownResource } from "../middlewares/ownResourse.js";


const router = express.Router();
router.post("/courses/:courseId/modules/:moduleId/resources",authenticate ,authorize("admin","trainer"),ownCourse , ownModule , createResource)
router.patch("/:courseId/:moduleId/resources/:resourceId",authenticate ,authorize("admin","trainer"),ownCourse,ownModule,ownResource,updateResource)
router.patch("/:courseId/:moduleId/:resourceId/published",authenticate,authorize("admin","trainer"),ownCourse,ownModule,ownResource,publishResource)
export default router;