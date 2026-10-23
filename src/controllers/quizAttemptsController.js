import Enrollment from "../models/Enrollment.js";
import Course from "../models/course.js"

export async function getPersonalAttemps(req, res, next) {
  try {
    const userId = req.user.id;

    console.log(userId)

    const courses = await Enrollment.find({ learner: userId })
      .populate({
        path: "course",
        select: "course",
        populate:{
            path: "modules",
            select: "title",
            populate: { 
                path: "quizzes",
                match: {isActive: true},
                select: "title",
                populate: {
                    path: "quizzesAttemps",
                    match: {
                        learner: userId
                    },
                    select: "-answers"
                },
            }
        }
      });

    return res.status(200).json({
        success: true,
        message: "quiz Attemps fetched successfuly",
        data: {courses}
    })
  } catch (error) {
    next(error);
  }
}

export async function getPersonalAttempsOnCourse(req, res, next) {
  try {
    const userId = req.user.id;
    const {course} = req;

    const courses = await Enrollment.findOne({ learner: userId , cours: course.id})
      .populate({
        path: "course",
        select: "course",
        populate:{
            path: "modules",
            select: "title",
            populate: { 
                path: "quizzes",
                match: {isActive: true},
                select: "title",
                populate: {
                    path: "quizzesAttemps",
                    match: {
                        learner: userId
                    },
                    select: "-answers"
                },
            }
        }
      });

    return res.status(200).json({
        success: true,
        message: "quiz Attemps fetched successfuly",
        data: {courses}
    })
  } catch (error) {
    next(error);
  }
}


