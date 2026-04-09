import { MessagingChannel } from "@prisma/client";

import { env } from "./config/env";
import { logger } from "./utils/logger";
import { TelegramProvider, TelegramUpdate } from "./providers/telegramProvider";
import { whatsappProvider } from "./providers/whatsappProvider";
import { userService } from "./services/userService";
import { reminderService } from "./services/reminderService";
import { copilotService } from "./services/copilotService";

const telegramProvider = new TelegramProvider(env.TELEGRAM_BOT_TOKEN);

const providers = {
  [MessagingChannel.TELEGRAM]: telegramProvider,
  [MessagingChannel.WHATSAPP]: whatsappProvider,
};

const extractTelegramMessage = (update: Record<string, unknown>) => {
  const typed = update as TelegramUpdate;
  const message = typed.message;
  const text = message?.text?.trim();
  const chatId = message?.chat?.id;
  const from = message?.from;

  if (!text || !chatId || !from?.id) {
    return null;
  }

  const name =
    [from.first_name, from.last_name].filter(Boolean).join(" ").trim() ||
    from.username ||
    "Telegram User";

  return {
    telegramId: String(from.id),
    chatId: String(chatId),
    name,
    text,
  };
};

const handleTelegramUpdate = async (update: Record<string, unknown>) => {
  const payload = extractTelegramMessage(update);

  if (!payload) {
    return;
  }

  const user = await userService.findOrCreateTelegramUser({
    telegramId: payload.telegramId,
    name: payload.name,
  });
  await reminderService.ensureDefaultReminders(user.id);

  const result = await copilotService.handleMessage(user, payload.text);
  await telegramProvider.sendMessage(payload.chatId, result.reply);
};

const bootstrapMessaging = async () => {
  if (!telegramProvider.hasCredentials()) {
    logger.warn("Telegram integration is disabled because TELEGRAM_BOT_TOKEN is missing.");
    return;
  }

  if (env.TELEGRAM_TRANSPORT === "polling") {
    telegramProvider.startPolling(async (update) => {
      await handleTelegramUpdate(update as Record<string, unknown>);
    });
    return;
  }

  await telegramProvider.ensureWebhook();
};

export { bootstrapMessaging, handleTelegramUpdate, providers, telegramProvider };
