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