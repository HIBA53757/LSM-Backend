import Quiz from "../models/quiz.js";
import QuizAttempt from "../models/quizAttempt.js";
import { BadRequestError, ConflictError, ValidationError } from "../utils/errors.js";
import Progress from "../models/progress.js";
import Module from "../models/module.js";
import Resource from "../models/resource.js"
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

async function isResourceViewed({course, module, quiz, user}){
  const progress = await Progress.findOne({
      learner: user.id,
      course: course.id,
    });

    if (!progress) {
      throw new BadRequestError("Please start the course first");
    }

    const allModules = await Module.find({ course: course.id }).sort({position: 1});

    const currentIndex = allModules.findIndex(
      (m) => m.id.toString() === module.id.toString(),
    );


    if (currentIndex > 0) {
      const previousModule = allModules[currentIndex - 1];
      const isPreviousDone = progress.completedModules.some(
        (id) => id.toString() === previousModule.id.toString(),
      );

      if (!isPreviousDone) {
        throw new BadRequestError("Previous module must be completed first");
      }
    }


    const moduleResources = await Resource.find({ module: module.id });
    const allResourcesDone = moduleResources.every((resource) =>
      progress.completedResources.some(
        (rId) => rId.toString() === resource.id.toString(),
      ),
    );

    if (!allResourcesDone) {
      throw new BadRequestError("All resources in this module must be viewed first");
    }

    const quizAttempt = await QuizAttempt.findOne({quiz : quiz.id, learner: user.id})

    if(quizAttempt){
      throw new ConflictError('You have already passed this Quiz')
    }
}

export async function viewQuiz(req, res, next){
  try{
    let {module, course, enrollment, quiz} = req;
        const learnerId = req.user.id;
    
        await isResourceViewed(req)

        const quizData = quiz.toObject();
        quizData.questions = quizData.questions.map(({ correctAnswer, ...question }) => question);

        return res.status(200).json({
          success: true,
          message: "quiz fetched successfuly",
          data : { quiz: quizData },
        })

    
  }catch(error){
    next(error)
  }
}

export async function submitAnswers(req, res, next){
  try{
    const {course, module, quiz} = req
    const userId = req.user.id

    await isResourceViewed(req)

    const userAnswers = req.body.answers
    const quizQuestions = quiz.questions

    const report = userAnswers.reduce((report, answer) => {

      const question = quizQuestions.find((question) => question.id.toString() === answer.questionId)

      let awardedPoints = 0

      if(question.correctAnswer === answer.selectedChoice){
        awardedPoints = question.points
        report.score += question.points
        report.passed +=1
      }

      report.questionResults.push({
        question: question.id.toString(),
        selectedChoice: answer.selectedChoice,
        awardedPoints
      })

      return report

    },{
      questionResults: [],
      score: 0,
      passed: 0,
      success: false
    })

    if(report.score >= quiz.passingScore){
      report.success = true
    }

    const newQuizAttempt = await QuizAttempt.create({
      learner: userId,
      quiz: quiz.id,
      answers: report.questionResults,
      score: report.score,
      passed: report.success,
      status: "submitted",
      submittedAt: new Date()
    })

    res.status(200).json({
      success : true,
      data: {report}
    })

  }catch(error){

    next(error)
  }
}
