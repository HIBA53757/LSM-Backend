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

        publicationStatus: {
            type: String,
            required: true,
            enum: ["draft", "published"]
        },

        publishedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

const Course = mongoose.model("Course", courseSchema);

export default Course;