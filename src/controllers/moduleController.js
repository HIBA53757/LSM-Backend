import Module from "../models/module.js";

export async function getModulesByCourse(req, res, next) {
    try {
        const modules = await Module.find({
            course: req.params.courseId,
            status: "published"
        }).sort({ position: 1 });

        res.status(200).json(modules);
    } catch (error) {
        next(error);
    }
}