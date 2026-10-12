import Resource from "../models/resource.js";

export async function getResourcesByModule(req, res, next) {
    try {
        const resources = await Resource.find({
            module: req.params.moduleId
        }).sort({ position: 1 });

        res.status(200).json(resources)
    } catch (error) {
        next(error);
    }
}

export async function createResource(req, res, next) {
    try {
        const { title, type, content, url, descreption, position } = req.body
        const resource = await Resource.create({
            title, type, content, url, descreption, position,
            module: req.module._id,
            status:"draft"
        })

        res.status(201).json({
            success:true,
            message:"Resource created successfully",
            resource
        })
    }
    catch (error) {
        next(error)
    }
}