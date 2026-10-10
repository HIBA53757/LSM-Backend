import Course from "../models/course.js";

export async function ownCourse(req, res, next) {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        if (req.user.role === "admin") {
            req.course = course;
            return next();
        }
        console.log("Logged-in user ID:", req.user.id);
        console.log("Course trainer ID:", course.trainer);
        console.log("User role:", req.user.role);
        if (course.trainer.toString() !== req.user.id.toString()) {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to modify this course"
            });
        }
        req.course = course;
        next();

    } catch (error) {
        next(error)
    }
}