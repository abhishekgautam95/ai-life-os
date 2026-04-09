import { MessagingChannel } from "@prisma/client";

import { logger } from "../utils/logger";
import { MessagingProvider } from "./messagingProvider";

class WhatsAppProvider implements MessagingProvider {
  readonly channel = MessagingChannel.WHATSAPP;

  async sendMessage(_target: string, _text: string) {
    logger.warn("WhatsApp provider is not implemented yet.");
    return false;
  }
}

const whatsappProvider = new WhatsAppProvider();

export { whatsappProvider };
