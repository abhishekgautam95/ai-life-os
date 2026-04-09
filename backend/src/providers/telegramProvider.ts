import { MessagingChannel } from "@prisma/client";

import { env } from "../config/env";
import { logger } from "../utils/logger";
import { MessagingProvider } from "./messagingProvider";

type TelegramUpdate = {
  update_id?: number;
  message?: {
    text?: string;
    chat?: {
      id?: number;
    };
    from?: {
      id?: number;
      first_name?: string;
      last_name?: string;
      username?: string;
    };
  };
};

class TelegramProvider implements MessagingProvider {
  readonly channel = MessagingChannel.TELEGRAM;

  private readonly apiUrl: string;
  private offset = 0;
  private pollingActive = false;

  constructor(private readonly botToken: string) {
    this.apiUrl = `https://api.telegram.org/bot${botToken}`;
  }

  hasCredentials() {
    return Boolean(this.botToken);
  }

  async sendMessage(target: string, text: string) {
    if (!this.hasCredentials()) {
      logger.warn("Telegram send skipped because TELEGRAM_BOT_TOKEN is missing.");
      return false;
    }

    try {
      const response = await fetch(`${this.apiUrl}/sendMessage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: target,
          text,
        }),
      });

      if (!response.ok) {
        logger.error("Telegram send failed", {
          status: response.status,
          body: await response.text(),
        });
        return false;
      }

      return true;
    } catch (error) {
      logger.error("Telegram send threw", {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  async ensureWebhook() {
    if (!this.hasCredentials() || !env.APP_BASE_URL) {
      return;
    }

    const webhookUrl = `${env.APP_BASE_URL}/webhook/telegram`;

    try {
      await fetch(`${this.apiUrl}/setWebhook`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: webhookUrl,
          secret_token: env.TELEGRAM_WEBHOOK_SECRET || undefined,
        }),
      });

      logger.info("Telegram webhook sync requested", { webhookUrl });
    } catch (error) {
      logger.error("Telegram webhook sync failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  startPolling(handler: (update: TelegramUpdate) => Promise<void>) {
    if (!this.hasCredentials() || this.pollingActive) {
      return;
    }

    this.pollingActive = true;

    const poll = async () => {
      if (!this.pollingActive) {
        return;
      }

      try {
        const response = await fetch(`${this.apiUrl}/getUpdates`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            timeout: 30,
            offset: this.offset,
          }),
        });

        if (!response.ok) {
          logger.warn("Telegram polling failed", {
            status: response.status,
            body: await response.text(),
          });
        } else {
          const data = (await response.json()) as {
            result?: TelegramUpdate[];
          };

          for (const update of data.result || []) {
            if (typeof update.update_id === "number") {
              this.offset = update.update_id + 1;
            }
            await handler(update);
          }
        }
      } catch (error) {
        logger.error("Telegram polling threw", {
          error: error instanceof Error ? error.message : String(error),
        });
      } finally {
        setTimeout(() => {
          void poll();
        }, 1_000);
      }
    };

    void poll();
    logger.info("Telegram polling started");
  }

  stopPolling() {
    this.pollingActive = false;
  }
}

export { TelegramProvider };
export type { TelegramUpdate };
