import Resource from "../models/resource.js";
import { ForbiddenError, NotFoundError } from "../utils/errors.js";

export async function ownResource(req, res, next) {
    try {
        const resource = await Resource.findById(req.params.resourceId)
        if (!resource) {
            return next(new NotFoundError("Resource not found"));
        }
        if (resource.module.toString()!== req.module._id.toString()){
            return next(new ForbiddenError("This resource does not belong to this module"));
        }
        req.resource = resource
        next()
    }
    catch (error) {
        next(error)
    }
}