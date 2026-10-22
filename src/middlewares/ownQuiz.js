import Course from "../models/course.js";
import Module from "../models/module.js";
import Quiz from "../models/quiz.js";
import { ForbiddenError, NotFoundError } from "../utils/errors.js";

export async function ownQuiz(req, res, next) {
  try {
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) {
      return next(new NotFoundError("Quiz not found"));
    }
    const module = await Module.findById(quiz.module);
    if (!module) {
        return next(new NotFoundError("Module not found"));
    }

    const course = await Course.findById(module.course);
    if (!course) {
        return next(new NotFoundError("Course not found"));
    }

    if (
        req.user.role !== "admin" &&
        course.trainer.toString() !== req.user.id.toString()
    ) {
        return next(new ForbiddenError("You are not allowed to modify this resource"));
    }

    req.quiz = quiz;
    req.module = module;
    req.course = course;
    return next();

  } catch (error) {
    return next(error);
  }
}
