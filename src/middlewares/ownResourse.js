import Resource from "../models/resource.js";

export async function ownResource(req, res, next) {
    try {
        const resource = await Resource.findById(req.params.resourceId)
        if (!resource) {
            return res.status(404).json({
                success: false,
                message: "resource not found"
            });
        }
        if (resource.module.toString()!== req.module._id.toString()){
            return res.status(403).json({
                success:false,
                message: "this resource does not belong to this module"
            })
        }
        req.resource = resource
        next()
    }
    catch (error) {
        next(error)
    }
}