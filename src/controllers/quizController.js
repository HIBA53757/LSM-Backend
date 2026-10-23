import Quiz from "../models/quiz.js";
import QuizAttempt from "../models/quizAttempt.js";
import { ConflictError } from "../utils/errors.js";

export async function listQuizzesByModule(req, res, next) {
  try {
    const quizzes = await Quiz.find({ module: req.module._id }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: { quizzes },
    });
  } catch (error) {
    return next(error);
  }
}

export async function getQuiz(req, res, next) {
  return res.status(200).json({
    success: true,
    data: { quiz: req.quiz },
  });
}

export async function createQuiz(req, res, next) {
  try {
    const quiz = await Quiz.create({
      ...req.body,
      module: req.module._id,
    });

    return res.status(201).json({
      success: true,
      message: "Quiz created successfully",
      data: { quiz },
    });
  } catch (error) {
    return next(error);
  }
}

export async function updateQuiz(req, res, next) {
  try {
    const quiz = req.quiz;
    const { title, questions, passingScore, isActive } = req.body;

    if (title !== undefined) quiz.title = title;
    if (questions !== undefined) quiz.questions = questions;
    if (passingScore !== undefined) quiz.passingScore = passingScore;
    if (isActive !== undefined) quiz.isActive = isActive;

    await quiz.save();

    return res.status(200).json({
      success: true,
      message: "Quiz updated successfully",
      data: { quiz },
    });
  } catch (error) {
    return next(error);
  }
}

export async function deleteQuiz(req, res, next) {
  try {
    const hasAttempts = await QuizAttempt.exists({ quiz: req.quiz._id });
    if (hasAttempts) {
      return next(
        new ConflictError("This quiz has attempts and cannot be deleted."),
      );
    }

    await req.quiz.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Quiz deleted successfully",
    });
  } catch (error) {
    return next(error);
  }
}
