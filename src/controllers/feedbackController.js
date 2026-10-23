import Course from "../models/course.js";
import Feedback from "../models/Feedback.js";
import Progress from "../models/progress.js";

export async function createFeedback(req, res, next) {
    try {
        const { course, progress, message, rating } = req.body;

        const trainer = req.user.id;

        const getCourse = await Course.findOne({
            _id: course,
            trainer: trainer
        })
        if (!getCourse) {
            return res.status(404).json({
                message: "Course not found",
            })
        }
        const getProgress = await Progress.findOne({
            _id: progress,
            course: course,
        });

        if (!getProgress) {
            return res.status(404).json({
                message: "Progress not found ",
            })
        }

        const feedback = await Feedback.create({
            trainer,
            learner: getProgress.learner,
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


export async function getMyFeedbacks(req, res, next) {
    try {
        const userId = req.user.id

        const feedbacks = await Feedback.find({
            learner: userId
        })

        // console.log(feedbacks)}

        return res.status(200).json({
            feedbacks
        })
    } catch (err) {
        next(err)
    }
}


export async function updateFeedback(req, res, next) {
    try {
        const { id } = req.params;
        const { message, rating } = req.body;

        const feedback = await Feedback.findById(id);

        if (!feedback) {
            return res.status(404).json({
                message: "Feedback not found"
            });
        }

        const isOwner =feedback.trainer.toString() === req.user.id;
        const isAdmin = req.user.role === "admin";

        if (!isAdmin && !isOwner) {
            return res.status(403).json({
                message: "You are not allowed to modify this feedback"
            });
        }

        const updatedFeedback = await Feedback.findByIdAndUpdate(
            id,
            { $set: { message, rating } },
            { new: true, runValidators: true }
        );

        return res.status(200).json({
            message: "Feedback updated successfully",
            feedback: updatedFeedback
        });
    } catch (err) {
        next(err);
    }
}


export async function deleteFeedback(req, res, next) {
    try {
        const { id } = req.params;

        const feedback = await Feedback.findById(id);

        if (!feedback) {
            return res.status(404).json({
                message: "Feedback not found"
            });
        }

        const isOwner =
            feedback.trainer.toString() === req.user.id;
        const isAdmin = req.user.role === "admin";

        if (!isAdmin && !isOwner) {
            return res.status(403).json({
                message: "You are not allowed to delete this feedback"
            });
        }

        await Feedback.findByIdAndDelete(id);

        return res.status(200).json({
            message: "Feedback deleted successfully"
        });
    } catch (err) {
        next(err);
    }
}

