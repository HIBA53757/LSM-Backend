import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/database.js";
import courseRoutes from "./routes/courseRoutes.js";
import moduleRoutes from "./routes/moduleRoutes.js";
import enrollmentRoutes from "./routes/enrollmentRoutes.js";
import { notFound } from "./middlewares/notFound.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import authRoutes from "./routes/authRoutes.js";
import { enrollCourse } from "./controllers/enrollmentController.js";
dotenv.config();

const app = express();

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/modules", moduleRoutes);
app.use("/api", enrollmentRoutes);

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("LMS API is running");
});

app.use(notFound);
app.use(errorHandler);
connectDB();

app.listen(PORT, () => {
  console.log(`server running on http://localhost:${PORT}`);
});
