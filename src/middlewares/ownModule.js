import Module from "../models/module.js";
import Course from "../models/course.js";
import { ForbiddenError, NotFoundError } from "../utils/errors.js";

export async function ownModule(req, res, next) {
    try {
        const moduleId = req.params.moduleId ?? req.body.module
        const module = await Module.findById(moduleId);
        if (!module) {
            return next(new NotFoundError("Module not found"));
        }

        const course = await Course.findById(module.course);
        if (!course) {
            return next(new NotFoundError("Course not found"));
        }

        if (
            req.user.role !== "admin" &&
            course.trainer.toString() !== req.user.id.toString()
        ) {
            return next(new ForbiddenError("You are not allowed to modify this module"));
        }

        req.course = course;
        req.module = module;
        next();

    } catch (error) {
        next(error)
     }
}
