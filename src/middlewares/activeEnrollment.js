import Course from "../models/course.js";
import Module from "../models/module.js";
import Resource from "../models/resource.js";
import Enrollment from "../models/Enrollment.js";
import { BadRequestError, ForbiddenError, NotFoundError } from "../utils/errors.js";

export function requireActiveEnrollment(model, modelId) {
    return async function activeEnrollment(req, res, next) {
        try {

            const entityId = req.params[modelId];
            if (!entityId) {
                return next(new BadRequestError(`${modelId} is required`));
            }

            let course;
            let module;
            let resource;

            if (model === "course") {

                course = await Course.findById(entityId);

                if (!course || course.status !== 'published') return next(new NotFoundError("Course not found"));

            } else if (model === "module") {

                module = await Module.findById(entityId);

                if (!module || module.status !== 'published') return next(new NotFoundError("Module not found"));

                course = await Course.findById(module.course);

            } else if (model === "resource") {

                resource = await Resource.findById(entityId);

                if (!resource || resource.status !== 'published' ) return next(new NotFoundError("Resource not found"));

                module = await Module.findById(resource.module);

                if (!module || module.status !== 'published') return next(new NotFoundError("Module not found"));

                course = await Course.findById(module.course);

            } else {

                return next(new BadRequestError("Unsupported enrollment target"));
            }

            if (!course || course.status !== 'published') return next(new NotFoundError("Course not found"));

            const enrollment = await Enrollment.findOne({
                learner: req.user.id,
                course: course._id,
                status: "active",
            });

            if (!enrollment) return next(new ForbiddenError("Active enrollment required"));

            req.course = course;
            if (module) req.module = module;
            if (resource) req.resource = resource;
            req.enrollment = enrollment;
            next();
        } catch (error) {
            next(error);
        }
    };
}
