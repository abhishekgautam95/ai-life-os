import { Router } from "express";

import {
  createNote,
  deleteNote,
  getNoteById,
  getNotes,
  updateNote,
} from "../controllers/noteController";
import { authMiddleware } from "../middleware/authMiddleware";

const noteRouter = Router();

noteRouter.use(authMiddleware);

noteRouter.post("/", createNote);
noteRouter.get("/", getNotes);
noteRouter.get("/:id", getNoteById);
noteRouter.put("/:id", updateNote);
noteRouter.delete("/:id", deleteNote);

export { noteRouter };
