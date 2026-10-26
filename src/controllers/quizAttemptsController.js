import Enrollment from "../models/Enrollment.js";
import Course from "../models/course.js"
import Module from "../models/module.js";
import Quiz from "../models/quiz.js"
import QuizAttempt from "../models/quizAttempt.js" 

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

export async function getCoursesUsersAttemps(req, res, next) {
  try {
    const userId = req.user.id;

    let filter = {}

    if (req.user.role !== "admin") {
        filter = { trainer: userId };
    }

    const courses = await Course.find(filter)
        .populate({
          path: "enrollments", populate: {
            path: "learner", select: "name email"
          }
        })
        .populate({
          path: "modules", select: "modules", populate: {
          path: "quizzes", select: "quizzes", populate: {
          path: "quizzesAttemps"
        }}})

    const cleanCourses = courses.map((courseDoc) => {

      const courseData = courseDoc.toObject({ virtuals: true });

      const allAttempts = courseData.modules.flatMap((module) =>

          module.quizzes.flatMap((quiz) =>

            quiz.quizzesAttemps.map((attempt) => ({

              ...attempt,
              quiz: quiz._id,
            }))
          )
      );

      courseData.enrollments = courseData.enrollments.map((enrollment) => {
          const learnerId = enrollment.learner.id.toString()

          const learnerAttempts = allAttempts.filter( (attempt) =>
              attempt.learner.toString() === learnerId
          );


          return {
            ...enrollment,
            quizAttempts: learnerAttempts,
          };
      });

      const {modules, ...cleanCourseData} = courseData
      
      return cleanCourseData

    });


    return res.status(200).json({
        success: true,
        message: "quiz Attemps fetched successfuly",
        data: {courses: cleanCourses}
    })
  } catch (error) {
    next(error);
  }
}


export async function getCourseUsersAttempsById(req, res, next) {
  try {
    const userId = req.user.id;

    let filter = {_id: req.params.courseId}

    if (req.user.role !== "admin") {
        filter.trainer =  userId
    }

    console.log(filter)

    const courses = await Course.find(filter)
        .populate({
          path: "enrollments", populate: {
            path: "learner", select: "name email"
          }
        })
        .populate({
          path: "modules", select: "modules", populate: {
          path: "quizzes", select: "quizzes", populate: {
          path: "quizzesAttemps"
        }}})

    const cleanCourses = courses.map((courseDoc) => {

      const courseData = courseDoc.toObject({ virtuals: true });

      const allAttempts = courseData.modules.flatMap((module) =>

          module.quizzes.flatMap((quiz) =>

            quiz.quizzesAttemps.map((attempt) => ({

              ...attempt,
              quiz: quiz._id,
            }))
          )
      );

      courseData.enrollments = courseData.enrollments.map((enrollment) => {
          const learnerId = enrollment.learner.id.toString()

          const learnerAttempts = allAttempts.filter( (attempt) =>
              attempt.learner.toString() === learnerId
          );


          return {
            ...enrollment,
            quizAttempts: learnerAttempts,
          };
      });

      const {modules, ...cleanCourseData} = courseData
      
      return cleanCourseData

    });


    return res.status(200).json({
        success: true,
        message: "quiz Attemps fetched successfuly",
        data: {courses: cleanCourses}
    })
  } catch (error) {
    next(error);
  }
}

