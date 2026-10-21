import Module from "../models/module.js";
import { ForbiddenError, NotFoundError } from "../utils/errors.js";

export async function ownModule(req, res, next) {
    try {
        const module = await Module.findById(req.params.moduleId)
        if (!module) {
            return next(new NotFoundError("Module not found"));
        }
        if (module.course.toString() !== req.course._id.toString()) {
            return next(new ForbiddenError("This module does not belong to this course"));
        }
        req.module = module;
        next();

    } catch (error) {
        next(error)
     }
}