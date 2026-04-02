import { Router } from "express";

import {
  getCurrentUser,
  login,
  register,
} from "../controllers/authController";
import { authMiddleware } from "../middleware/authMiddleware";

const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.get("/me", authMiddleware, getCurrentUser);

export { authRouter };
