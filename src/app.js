import progressionRoutes from "./routes/progressionRoutes.js";
import express from "express";
import dotenv from "dotenv";
import courseRoutes from "./routes/courseRoutes.js";
import moduleRoutes from "./routes/moduleRoutes.js";
import enrollmentRoutes from "./routes/enrollmentRoutes.js";
import { notFound } from "./middlewares/notFound.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import authRoutes from "./routes/authRoutes.js";
import resourceRoutes from "./routes/resourceRoutes.js";

dotenv.config();

const app = express();

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/modules", moduleRoutes);
app.use("/api", enrollmentRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/progress", progressionRoutes);

app.get("/", (req, res) => {
  res.send("LMS API is running");
});

app.use(notFound);
app.use(errorHandler);

// On exporte l'app pour que les tests puissent l'utiliser avec Supertest
export default app;
