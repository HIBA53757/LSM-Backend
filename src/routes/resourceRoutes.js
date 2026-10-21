import express from "express";
import { authenticate, authorize } from "../middlewares/Auth.js";
import { createResource, publishResource, updateResource } from "../controllers/resourceController.js";
import { ownResource } from "../middlewares/ownResourse.js";
import { ownModule } from "../middlewares/ownModule.js";
import upload from "../middlewares/uploads.js";

const router = express.Router();
router.post("/modules/:moduleId", authenticate, authorize("admin","trainer"), ownModule, upload.single("file"),createResource)
router.put("/:resourceId",authenticate,authorize("admin","trainer"),ownResource,updateResource)
router.patch("/:resourceId/published",authenticate,authorize("admin","trainer"),ownResource,publishResource)
export default router;
