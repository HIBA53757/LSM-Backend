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
            data: {
                count: courses.length,
                courses
            }

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
            data: {
                count: enrollments.length,
                learners: enrollments
            }
        });
    } catch (error) {
        next(error);
    }
}

export async function getTrainerStatistics(req, res, next) {
    try {
        const trainerId = req.user.id;

        const statistics = await Course.aggregate([
            {
                $match: {
                    trainer: new Course.base.Types.ObjectId(trainerId),
                },
            },
            {
                $lookup: {
                    from: "enrollments",
                    let: { courseId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$course", "$$courseId"] },
                                status: { $in: ["active", "completed"] },
                            },
                        },
                    ],
                    as: "enrollments",
                },
            },
            {
                $lookup: {
                    from: "progresses",
                    localField: "_id",
                    foreignField: "course",
                    as: "progressRecords",
                },
            },
            {
                $addFields: {
                    enrolledLearnersCount: { $size: "$enrollments" },
                    startedProgress: {
                        $filter: {
                            input: "$progressRecords",
                            as: "progress",
                            cond: {
                                $and: [
                                    { $gt: ["$$progress.percent", 0] },
                                    {
                                        $in: [
                                            "$$progress.learner",
                                            {
                                                $map: {
                                                    input: "$enrollments",
                                                    as: "enrollment",
                                                    in: "$$enrollment.learner",
                                                },
                                            },
                                        ],
                                    },
                                ],
                            },
                        },
                    },
                },
            },
            {
                $addFields: {
                    averageProgress: {
                        $cond: [
                            { $gt: [{ $size: "$startedProgress" }, 0] },
                            { $round: [{ $avg: "$startedProgress.percent" }, 0] },
                            0,
                        ],
                    },
                },
            },
            {
                $project: {
                    _id: 0,
                    courseId: "$_id",
                    courseTitle: "$title",
                    enrolledLearnersCount: 1,
                    averageProgress: 1,
                },
            },
            {
                $sort: { courseTitle: 1 },
            },
        ]);

        return res.status(200).json({
            success: true,
            data: {
                coursesCount: statistics.length,
                courses: statistics,
            },
        });
    } catch (error) {
        next(error);
    }
}

