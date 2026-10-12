import mongoose from "mongoose";
import Module from "../models/module.js";

export async function ownModule(req, res, next) {
    try {
        const module = await Module.findById(req.params.moduleId)
        if (!module) {
            return res.status(404).json({
                success: false,
                message: "modulenot found"
            });
        }
        if (module.course.toString() !== req.course._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "This module does not belong to this course"
            });
        }
        req.module = module;

    } catch (error) { }
}