import { env } from "../config/env";
import { logger } from "../utils/logger";
import { parseModelJson } from "../utils/json";

type ChatMessage = {
  role: "system" | "user";
  content: string;
};

class OpenAIClient {
  private readonly model = env.OPENAI_MODEL;

  async createText(messages: ChatMessage[], temperature = 0.2) {
    if (!env.OPENAI_API_KEY) {
      return null;
    }

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          temperature,
          messages,
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        logger.error("OpenAI request failed", {
          status: response.status,
          body,
        });
        return null;
      }

      const data = (await response.json()) as {
        choices?: Array<{
          message?: {
            content?: string | null;
          };
        }>;
      };

      return data.choices?.[0]?.message?.content?.trim() || null;
    } catch (error) {
      logger.error("OpenAI request threw", {
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  async createJson<T>(messages: ChatMessage[], temperature = 0.1) {
    const text = await this.createText(messages, temperature);

    if (!text) {
      return null;
    }

    return parseModelJson<T>(text);
  }
}

const openAIClient = new OpenAIClient();

export { openAIClient };
