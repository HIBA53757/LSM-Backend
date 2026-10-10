import mongoose from "mongoose";
import Course from "../models/course.js";

export async function getCourses(req, res, next) {
    try {
        const { category, level, keyword, sort } = req.query;

        const filter = {
            status: "published"
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
            status: "published"
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

export async function createCourse(req, res, next) {
    try {
        console.log("authenticated user", req.user);
        const {
            title,
            description,
            objectives,
            level,
            category,
            estimatedDuration
        } = req.body

        const course = await Course.create({
            title,
            description,
            objectives,
            level,
            category,
            estimatedDuration,
            trainer: req.user.id,
            status: "draft"
        });
        res.status(201).json({
            success: true,
            message: "course created successfully",
            course
        })
    }
    catch (error) {
        next(error)
    }
}

export async function updateCourse(req, res, next) {
    try {
        const { title,
            description,
            objectives,
            level,
            category,
            estimatedDuration
        } = req.body
        const course = req.course;

        if (title !== undefined) {course.title = title};
        if (description !== undefined) {course.description = description};
        if (objectives !== undefined) course.objectives = objectives;
        if (level !== undefined) course.level = level;
        if (category !== undefined) course.category = category;
        if (estimatedDuration !== undefined) {
            course.estimatedDuration = estimatedDuration;
        }

          await course.save();
          res.status(200).json({
            success:true,
            message:"Course updated successfully",
            course
          });

    }
    catch (error) {
        next(error)
    }
}

export async function publishCourse(req,res,nex){
    try{
        const course = req.course;
        course.status = "published";
        course.publishedAt = new Date();

        await course.save();

        res.status(200).json({
            success:true,
            message:"Course published successfully",
            course
        })
    }
    catch(error){
        next(error)
    }
}


export async function unpublishCourse(req, res, next) {
    try {
        const course = req.course;

        course.status = "draft";
        course.publishedAt = null;

        await course.save();

        res.status(200).json({
            success: true,
            message: "Course unpublished successfully",
            course
        });
    } catch (error) {
        next(error);
    }
}