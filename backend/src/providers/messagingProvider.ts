import { MessagingChannel } from "@prisma/client";

interface MessagingProvider {
  readonly channel: MessagingChannel;
  sendMessage(target: string, text: string): Promise<boolean>;
}

export type { MessagingProvider };
