import express from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import { notFound } from "./middlewares/notFound.js";
import errorHandler from "./middlewares/errorHandler.js";
import routes from "./routes.js"
import swaggerUi from "swagger-ui-express"
import swaggerSpec from "./config/swagger.js";

dotenv.config();

const app = express();

app.use(express.json());

app.use(morgan('common'))

app.use("/api", routes)
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get("/", (req, res) => {
  res.send("LMS API is running");
});

app.use(notFound);
app.use(errorHandler);

export default app;
