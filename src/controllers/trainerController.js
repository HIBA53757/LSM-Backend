import Course from "../models/course.js";


export async function getTrainerCourses(req, res, next) {
    try {
        let filter = {};

        if (req.user.role !== "admin") {
            filter = { trainer: req.user.id };
        }
        const courses = await Course.find(filter).sort({
            createdAt:-1
        })
        res.status(200).json({
            success:true,
            count:courses.length,
            courses
        })


    } catch (error) {
        next(error)
    }
}