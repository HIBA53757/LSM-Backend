import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            required: true,
            trim: true
        },

        objectives: {
            type: [String],
            required: true
        },

        level: {
            type: String,
            required: true,
            enum: ["beginner", "intermediate", "advanced"]
        },

        category: {
            type: String,
            required: true,
            trim: true
        },

        estimatedDuration: {
            type: Number,
            required: true,
            min: 1
        },

        status: {
            type: String,
            enum: ["draft", "published","archived"],
            default:"draft"
        },

        publishedAt: {
            type: Date,
            default: null
        },

        trainer:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User",
            required: true
        }

    },
    {
        timestamps: true
    }
);

const Course = mongoose.model("Course", courseSchema);

export default Course;