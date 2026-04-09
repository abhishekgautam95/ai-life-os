import { Router } from "express";

import { healthRouter } from "./healthRoutes";
import { webhookRouter } from "./webhookRoutes";
import { debugRouter } from "./debugRoutes";
import { env } from "../config/env";

const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/webhook", webhookRouter);

if (env.NODE_ENV !== "production") {
  apiRouter.use("/debug", debugRouter);
}

export { apiRouter };
