import { Request, Response } from "express";

import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/appError";
import { copilotService } from "../services/copilotService";
import { userService } from "../services/userService";
import { reminderService } from "../services/reminderService";

const postDebugMessage = asyncHandler(async (req: Request, res: Response) => {
  const telegramId =
    typeof req.body.telegramId === "string" ? req.body.telegramId.trim() : "";
  const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
  const text = typeof req.body.text === "string" ? req.body.text.trim() : "";
  const timezone =
    typeof req.body.timezone === "string" ? req.body.timezone.trim() : undefined;

  if (!telegramId || !name || !text) {
    throw new AppError("telegramId, name, and text are required.", 400);
  }

  const user = await userService.findOrCreateTelegramUser({
    telegramId,
    name,
    timezone,
  });
  await reminderService.ensureDefaultReminders(user.id);
  const result = await copilotService.handleMessage(user, text);

  res.status(200).json({
    success: true,
    data: result,
  });
});

const getDebugUsers = asyncHandler(async (_req: Request, res: Response) => {
  const users = await userService.listForDebug();

  res.status(200).json({
    success: true,
    data: users,
  });
});

export { getDebugUsers, postDebugMessage };
