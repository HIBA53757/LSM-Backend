import mongoose from "mongoose";

const quizAttemptSchema = new mongoose.Schema(
  {
    learner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
      index: true,
    },
    answers: [
      {
        question: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
        },
        selectedChoice: {
          type: Number,
          min: 1,
        },
        awardedPoints: {
          type: Number,
          min: 0,
          default: 0,
        },
      },
    ],
    score: {
      type: Number,
      min: 0,
      default: 0,
    },
    passed: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["in_progress", "submitted", "abandoned"],
      default: "in_progress",
      index: true,
    },
    submittedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

quizAttemptSchema.index({ quiz: 1, learner: 1, createdAt: -1 });

export default mongoose.model("QuizAttempt", quizAttemptSchema);
