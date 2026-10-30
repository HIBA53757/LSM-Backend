import Course from "../../models/course.js";

export async function getTrainerStatistics(trainerId) {
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

  return {
    coursesCount: statistics.length,
    courses: statistics,
  };
}