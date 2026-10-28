import mongoose from "mongoose";

export async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("connected to : ", process.env.MONGO_URI)
    } catch (error) {
        console.error("connection failed:", error.message);
        process.exit(1)
    }
}