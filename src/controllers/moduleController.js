import Module from "../models/module.js";
import Course from "../models/course.js";


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

export async function createModule(req, res, next) {
    try {
        const {
            title,
            description,
            position,
            estimatedDuration
        } = req.body;

        const module = await Module.create({
            title,
            description,
            position,
            estimatedDuration,
            status: "draft",
            course: req.course._id
        });

        res.status(201).json({
            success: true,
            message: "Module created successfully",
            module
        });
    } catch (error) {
        next(error);
    }
}

export async function updateModule(req, res, next) {
    try {
        const { title, description, position, estimatedDuration } = req.body;

        const module = await Module.findById(req.params.moduleId);

        if (!module) {
            return res.status(404).json({
                success: false,
                message: "Module not found"
            });
        }

        if (module.course.toString() !== req.course._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "This module does not belong to this course"
            });
        }

        if (title !== undefined) module.title = title;
        if (description !== undefined) module.description = description;
        if (position !== undefined) module.position = position;
        if (estimatedDuration !== undefined) {
            module.estimatedDuration = estimatedDuration;
        }

        await module.save();

        res.status(200).json({
            success: true,
            message: "Module updated successfully",
            module
        });
    } catch (error) {
        next(error);
    }
}