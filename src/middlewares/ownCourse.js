import Course from "../models/course.js";
import { ForbiddenError, NotFoundError } from "../utils/errors.js";

export async function ownCourse(req, res, next) {
    try {
        const courseId = req.params.id || req.params.courseId;
        const course = await Course.findById(courseId);

        if (!course) {
            return next(new NotFoundError("Course not found"));
        }

        if (req.user.role === "admin") {
            req.course = course;
            return next();
        }
        console.log("Logged-in user ID:", req.user.id);
        console.log("Course trainer ID:", course.trainer);
        console.log("User role:", req.user.role);

        
        if (course.trainer.toString() !== req.user.id.toString()) {
            return next(new ForbiddenError("You are not allowed to modify this course"));
        }
        req.course = course;
        next();

    } catch (error) {
        next(error)
    }
}