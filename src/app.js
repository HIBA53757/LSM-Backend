import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/database.js";

dotenv.config();

app.use(express.json());

const app = express();
const PORT = process.env.PORT || 3000 ;

app.get("/",(req,res)=>{
    res.send("LMS API is running");
})

connectDB();

app.listen(PORT,()=>{
    console.log(`server running on http://localhost:${PORT}`);
})