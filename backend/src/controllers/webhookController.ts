import { Request, Response } from "express";

import { AppError } from "../utils/appError";
import { asyncHandler } from "../utils/asyncHandler";
import { env } from "../config/env";
import { handleTelegramUpdate } from "../runtime";

const postTelegramWebhook = asyncHandler(async (req: Request, res: Response) => {
  if (env.TELEGRAM_WEBHOOK_SECRET) {
    const secret = req.header("x-telegram-bot-api-secret-token");
    if (secret !== env.TELEGRAM_WEBHOOK_SECRET) {
      throw new AppError("Invalid Telegram webhook secret.", 401);
    }
  }

  await handleTelegramUpdate(req.body as Record<string, unknown>);

  res.status(200).json({
    success: true,
  });
});

const postWhatsAppWebhook = asyncHandler(async (_req: Request, res: Response) => {
  res.status(501).json({
    success: false,
    message: "WhatsApp webhook is not implemented yet.",
  });
});

export { postTelegramWebhook, postWhatsAppWebhook };
