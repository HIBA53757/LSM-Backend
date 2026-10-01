import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/database.js";
import courseRoutes from "./routes/courseRoutes.js";

dotenv.config();

const app = express();

app.use(express.json());
app.use("/api/courses", courseRoutes);


const PORT = process.env.PORT || 3000 ;

app.get("/",(req,res)=>{
    res.send("LMS API is running");
})

connectDB();

app.listen(PORT,()=>{
    console.log(`server running on http://localhost:${PORT}`);
})