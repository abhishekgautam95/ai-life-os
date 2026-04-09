import cors from "cors";
import express from "express";

import { errorHandler } from "./middleware/errorHandler";
import { notFoundHandler } from "./middleware/notFoundHandler";
import { apiRouter } from "./routes";

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/", (_req, res) => {
  res.json({
    message: "AI Life Copilot backend is running",
  });
});

app.use("/", apiRouter);
app.use("/api", apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);

export { app };
