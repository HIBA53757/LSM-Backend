import Resource from "../models/resource.js";

export async function getResourcesByModule(req, res, next) {
    try {
        const resources = await Resource.find({
            module: req.params.moduleId
        }).sort({ displayOrder: 1 });

        res.status(200).json(resources)
    } catch (error) {
        next(error);
    }
}