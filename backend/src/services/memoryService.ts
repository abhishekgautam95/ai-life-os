import { MemoryCategory } from "@prisma/client";

import { prisma } from "../config/prisma";
import { extractMemories } from "../ai/memoryExtractor";

class MemoryService {
  async extractAndStore(userId: string, text: string) {
    const candidates = await extractMemories(text);

    const stored = [];
    for (const memory of candidates) {
      if (memory.importance < 50) {
        continue;
      }

      const duplicate = await prisma.memory.findFirst({
        where: {
          userId,
          category: memory.category,
          content: memory.content,
        },
      });

      if (duplicate) {
        continue;
      }

      stored.push(
        await prisma.memory.create({
          data: {
            userId,
            category: memory.category,
            content: memory.content,
            importance: memory.importance,
          },
        })
      );
    }

    return stored;
  }

  async storeSingle(input: {
    userId: string;
    category?: MemoryCategory;
    content: string;
    importance?: number;
  }) {
    return prisma.memory.create({
      data: {
        userId: input.userId,
        category: input.category || MemoryCategory.CONTEXT,
        content: input.content,
        importance: input.importance || 60,
      },
    });
  }

  async getRelevantMemories(userId: string) {
    return prisma.memory.findMany({
      where: { userId },
      orderBy: [{ importance: "desc" }, { createdAt: "desc" }],
      take: 10,
    });
  }
}

const memoryService = new MemoryService();

export { memoryService };
