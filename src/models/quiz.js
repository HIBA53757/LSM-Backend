import mongoose from "mongoose";

const quizSchema = mongoose.Schema({
    module: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Module",
        required: true
    },
    title: {
        type: String,
        required: true
    },
    questions: [
        {
            text: {
                type: String,
                required: true
            },
            choices: [
                {
                    number: {
                        type: Number,
                        required: true,
                        min: 1,
                        default: 1
                    },
                    text: {
                        type: String,
                        required: true
                    }
                }
            ],
            correctAnswer: {
                type: Number,
                required: true
            },
            points: {
                type: Number,
                required: true
            }
        }
    ],
    passingScore: {
        type: Number,
        required: true,
        min: 0
    },
    isActive: {
        type: Boolean,
        required: true,
        default: false
    },
    isRequired: {
        type: Boolean,
        required: true,
        default: false
    }

},
{ timestamps: true },
);

quizSchema.virtual("quizzesAttemps", {
  ref: "QuizAttempt",
  localField: "_id",
  foreignField: "quiz",
});

quizSchema.set("toJSON", {
  virtuals: true,
});

quizSchema.index({ module: 1 }, { unique: true });

export default mongoose.model("Quiz", quizSchema);
