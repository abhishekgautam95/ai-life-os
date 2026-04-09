import { IntentType, MessageRole } from "@prisma/client";

import { prisma } from "../config/prisma";

class MessageService {
  async createMessage(input: {
    userId: string;
    role: MessageRole;
    rawText: string;
    intent?: IntentType;
  }) {
    return prisma.message.create({
      data: {
        userId: input.userId,
        role: input.role,
        rawText: input.rawText,
        intent: input.intent,
      },
    });
  }

  async getRecentMessages(userId: string) {
    return prisma.message.findMany({
      where: { userId },
      orderBy: {
        createdAt: "desc",
      },
      take: 12,
    });
  }
}

const messageService = new MessageService();

export { messageService };
