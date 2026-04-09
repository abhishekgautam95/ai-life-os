import { Router } from "express";

import { getHealth } from "../controllers/healthController";
import { asyncHandler } from "../utils/asyncHandler";

const healthRouter = Router();

healthRouter.get("/", asyncHandler(getHealth));

export { healthRouter };
