import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },
        descreption: {
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
            required:true,
            enum:["beginner","intermediate ","advanced"]
        },
        category:{
            type: String,
            required: true,
            trim
        },
        estimatedDuration:{
            type: Number,
            required: true,
            min:1
        },
        publishedAt: {
            type: Date,
            default: null
        },
    },  {
            timestamps:true
        }
)

const Course = mongoose.model("Course", courseShema);
export default Course;