import progressionRoutes from "./routes/progressionRoutes.js";
import express from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import courseRoutes from "./routes/courseRoutes.js";
import moduleRoutes from "./routes/moduleRoutes.js";
import enrollmentRoutes from "./routes/enrollmentRoutes.js";
import { notFound } from "./middlewares/notFound.js";
import errorHandler from "./middlewares/errorHandler.js";
import authRoutes from "./routes/authRoutes.js";
import resourceRoutes from "./routes/resourceRoutes.js";
import trainerRoutes from "./routes/trainerRoutes.js";

dotenv.config();

const app = express();

app.use(express.json());

app.use(morgan('common'))

app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/modules", moduleRoutes);
app.use("/api", enrollmentRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/progress", progressionRoutes);
app.use("/api/trainer", trainerRoutes)

app.get("/", (req, res) => {
  res.send("LMS API is running");
});

app.use(notFound);
app.use(errorHandler);

export default app;
