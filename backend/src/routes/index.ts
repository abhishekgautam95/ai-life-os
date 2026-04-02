import { Router } from "express";

import { authRouter } from "./authRoutes";
import { goalRouter } from "./goalRoutes";
import { healthRouter } from "./healthRoutes";
import { noteRouter } from "./noteRoutes";
import { taskRouter } from "./taskRoutes";

const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/goals", goalRouter);
apiRouter.use("/notes", noteRouter);
apiRouter.use("/tasks", taskRouter);

export { apiRouter };
