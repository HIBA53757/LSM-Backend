import Resource from "../models/resource.js";
import Module from "../models/module.js";
import Course from "../models/course.js";
import { ForbiddenError, NotFoundError } from "../utils/errors.js";

export async function ownResource(req, res, next) {
    try {
        const resource = await Resource.findById(req.params.resourceId);
        if (!resource) {
            return next(new NotFoundError("Resource not found"));
        }

        const module = await Module.findById(resource.module);
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
            return next(new ForbiddenError("You are not allowed to modify this resource"));
        }

        req.resource = resource;
        req.module = module;
        req.course = course;
        next();
    }
    catch (error) {
        next(error);
    }
}
