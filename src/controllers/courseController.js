import mongoose from "mongoose";
import Course from "../models/course.js";

export async function getCourses(req, res, next) {
    try {
        const courses = await Course.find({
            publicationStatus: "published"
        });

        res.status(200).json(courses);
    } catch (error) {
        next(error);
    }
}

export async function getCourseById(req, res, next) {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                error: "Invalid course ID"
            });
        }

        const course = await Course.findOne({
            _id: req.params.id,
            publicationStatus: "published"
        });

        if (!course) {
            return res.status(404).json({
                error: "Course not found"
            });
        }

        res.status(200).json(course);
    } catch (error) {
        next(error);
    }
}