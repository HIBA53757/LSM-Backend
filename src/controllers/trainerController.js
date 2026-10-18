import Course from "../models/course.js";
import Enrollment from "../models/Enrollment.js";


export async function getTrainerCourses(req, res, next) {
    try {
        let filter = {};

        if (req.user.role !== "admin") {
            filter = { trainer: req.user.id };
        }
        const courses = await Course.find(filter).sort({
            createdAt: -1
        })
        res.status(200).json({
            success: true,
            count: courses.length,
            courses
        })


    } catch (error) {
        next(error)
    }
}

export async function getCourseLearners(req, res, next) {
    try {
        const { courseId } = req.params;

        const enrollments = await Enrollment.find({
            course: courseId,
            status: { $in: ["active", "completed"] },
        })
            .populate("learner", "name email")
            .sort({ enrolledAt: -1 });

        res.status(200).json({
            success: true,
            count: enrollments.length,
            learners: enrollments,
        });
    } catch (error) {
        next(error);
    }
}
