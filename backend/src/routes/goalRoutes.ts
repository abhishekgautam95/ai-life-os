import { Router } from "express";

import {
  createGoal,
  deleteGoal,
  getGoalById,
  getGoals,
  updateGoal,
} from "../controllers/goalController";
import { authMiddleware } from "../middleware/authMiddleware";

const goalRouter = Router();

goalRouter.use(authMiddleware);

goalRouter.post("/", createGoal);
goalRouter.get("/", getGoals);
goalRouter.get("/:id", getGoalById);
goalRouter.put("/:id", updateGoal);
goalRouter.delete("/:id", deleteGoal);

export { goalRouter };
