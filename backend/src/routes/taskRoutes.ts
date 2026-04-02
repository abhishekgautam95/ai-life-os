import { Router } from "express";

import {
  createTask,
  deleteTask,
  getTaskById,
  getTasks,
  updateTask,
} from "../controllers/taskController";
import { authMiddleware } from "../middleware/authMiddleware";

const taskRouter = Router();

taskRouter.use(authMiddleware);

taskRouter.post("/", createTask);
taskRouter.get("/", getTasks);
taskRouter.get("/:id", getTaskById);
taskRouter.put("/:id", updateTask);
taskRouter.delete("/:id", deleteTask);

export { taskRouter };
