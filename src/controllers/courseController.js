import mongoose from "mongoose";
import Course from "../models/course.js";

export async function getCourses(req, res, next) {
    try {
        const { category, level, keyword, sort } = req.query;

        const filter = {
            Status: "published"
        };

        if (category) {
            filter.category = category;
        }

        if (level) {
            filter.level = level;
        }

        if (keyword) {
            filter.$or = [
                { title: { $regex: keyword, $options: "i" } },
                { description: { $regex: keyword, $options: "i" } },
                { category: { $regex: keyword, $options: "i" } }
            ];
        }

        const sortOptions = {
            createdAt: { createdAt: 1 },
            "-createdAt": { createdAt: -1 },
            publishedAt: { publishedAt: 1 },
            "-publishedAt": { publishedAt: -1 }
        };

        const sortOrder = sortOptions[sort] || { createdAt: -1 };

        const courses = await Course.find(filter).sort(sortOrder);

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
            Status: "published"
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