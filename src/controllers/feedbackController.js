import Course from "../models/course.js";
import Feedback from "../models/Feedback.js";
import User from "../models/User.js";
import Progress from "../models/progress.js";

export async function createFeedback(req, res, next) {
    try {
        const { trainer, course, progress, message, rating } = req.body;

        const getTrainer = await User.findOne({
            _id: trainer
        })
        if (!getTrainer) {
            return res.status(404).json({
                message: 'trainer not found'
            })
        }
        const getCourse = await Course.findOne({
            _id: course,
            trainer: trainer
        })
        if (!getCourse) {
            return res.status(404).json({
                message: 'trainer not course'
            })
        }
        const getProgress = await Progress.findOne({
            _id: progress,
            course: course,
            learner: req.user.id
        });
        
        if (!getProgress) {
            return res.status(404).json({
                message: 'trainer not progress'
            })
        }

        const feedback = await Feedback.create({
            trainer,
            learner: req.user.id,
            course,
            progress,
            message,
            rating,
        });

        return res.status(201).json({
            message: "Feedback created successfully.",
            feedback,
        });
    } catch (error) {
        next(error);
    }
}