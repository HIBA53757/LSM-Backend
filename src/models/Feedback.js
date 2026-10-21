import mongoose from "mongoose";


const feedbackSchema = mongoose.Schema({
    trainer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true ,

    },learner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    progress: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Progress",
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
  },
  { timestamps:true}
)
feedbackSchema.index({ course: 1, learner: 1, createdAt: -1 });

const Feedback = mongoose.model("Feedback" , feedbackSchema)

export default Feedback
