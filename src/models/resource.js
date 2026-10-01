import mongoose from "mongoose";

const resourceSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },

        type: {
            type: String,
            required: true,
            enum: ["video", "pdf", "document", "link"]
        },

        url: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            trim: true
        },

        originalFileName: {
            type: String,
            trim: true
        },

        fileSize: {
            type: Number,
            min: 0
        },

        estimatedDuration: {
            type: Number,
            min: 0
        },

        displayOrder: {
            type: Number,
            required: true,
            min: 1
        },

        module: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Module",
            required: true
        }
    },
    {
        timestamps: true
    }
);

const Resource = mongoose.model("Resource", resourceSchema);

export default Resource;