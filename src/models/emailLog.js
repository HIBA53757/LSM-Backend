import mongoose from "mongoose";

const emailLogSchema = new mongoose.Schema({
    to: {
        type: String,
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    driver: {
        type: String,
        enum: ["log", "sandbox"],
        required: true
    },
    status: {
        type: String,
        enum: ["sent", "failed"],
        required: true
    },
    error: {
        type: String,
        default: null

    },
},
    {
        timestamps: true
    })

export default mongoose.model("EmailLog", emailLogSchema)