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
            enum: ["article", "video", "link", "pdf", "image"]
        },

        content: {
            type: String,
            trim: true
        },

        url: {
            type: String,
            trim: true
        },

        file: {
            originalName: {
                type: String,
                trim: true
            },

            filename: {
                type: String,
                trim: true
            },

            path: {
                type: String,
                trim: true
            },

            size: {
                type: Number,
                min: 0
            },

            mimetype: {
                type: String,
                trim: true
            }
        },

        description: {
            type: String,
            trim: true
        },

        position: {
            type: Number,
            required: true,
            min: 1
        },

        status: {
            type: String,
            required: true,
            enum: ["draft", "published", "archived"],
            default: "draft"
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