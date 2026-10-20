import Resource from "../models/resource.js";

export async function getResourcesByModule(req, res, next) {
    try {
        const resources = await Resource.find({
            module: req.params.moduleId
        }).sort({ position: 1 });

        res.status(200).json({
            success: true,
            data: {
                resources
            }
        })
    } catch (error) {
        next(error);
    }
}

export async function createResource(req, res, next) {
    try {
        const { title, type, content, url, description, position } = req.body
        const fileData = req.file
            ? {
                originalName: req.file.originalname,
                filename: req.file.filename,
                path: req.file.path,
                size: req.file.size,
                mimetype: req.file.mimetype
            }
            : undefined

        const resource = await Resource.create({
            title, type, content, url, description, position, file:fileData,
            module: req.module._id,
            status: "draft"
        })

        res.status(201).json({
            success: true,
            message: "Resource created successfully",
            data: {
                resource
            }
        })
    }
    catch (error) {
        next(error)
    }
}

export async function updateResource(req, res, next) {
    try {
        const resource = req.resource
        const { title, type, content, url, description, position, status }
            = req.body
        if (title !== undefined) { resource.title = title }
        if (type !== undefined) resource.type = type
        if (content !== undefined) resource.content = content
        if (url !== undefined) resource.url = url
        if (description !== undefined) resource.description = description
        if (position !== undefined) resource.position = position

        await resource.save()
        res.status(200).json({
            success: true,
            message: "resource updated",
            data: {
                resource
            }
        })
    }
    catch (error) {
        next(error)
    }
}
export async function publishResource(req, res, next) {
    try {
        const resource = req.resource
        resource.status = "published"
        await resource.save()
        res.status(200).json({
            success: true,
            message: "resource has been published",
            data: {
                resource
            }
        })

    }
    catch (error) {
        next(error)
    }
}