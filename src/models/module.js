import mongoose from "mongoose";

const moduleSchema = new mongoose.Schema(
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

        order: {
            type: Number,
            required: true,
            min: 1
        },

        estimatedDuration: {
            type: Number,
            required: true,
            min: 1
        },

        status: {
            type: String,
            required: true,
            enum: ["draft", "published"]
        },

        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course",
            required: true
        }
    },
    {
        timestamps: true
    }
);

const Module = mongoose.model("Module", moduleSchema);

export default Module;