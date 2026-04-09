import { MemoryCategory } from "@prisma/client";

import { openAIClient } from "./openaiClient";
import { memoryPrompt } from "./promptTemplates";
import { MemoryCandidate } from "./types";

const isMemoryCategory = (value: unknown): value is MemoryCategory =>
  Object.values(MemoryCategory).includes(value as MemoryCategory);

const extractMemories = async (text: string): Promise<MemoryCandidate[]> => {
  const result = await openAIClient.createJson<{
    memories?: Array<Record<string, unknown>>;
  }>([
    { role: "system", content: memoryPrompt },
    { role: "user", content: text },
  ]);

  const memories =
    result?.memories
      ?.map((memory) => {
        const category = isMemoryCategory(memory.category)
          ? memory.category
          : MemoryCategory.CONTEXT;
        const content = typeof memory.content === "string" ? memory.content.trim() : "";
        const importance =
          typeof memory.importance === "number"
            ? Math.max(1, Math.min(100, Math.round(memory.importance)))
            : 50;

        if (!content) {
          return null;
        }

        return {
          category,
          content,
          importance,
        };
      })
      .filter((memory): memory is MemoryCandidate => Boolean(memory)) || [];

  if (memories.length > 0) {
    return memories;
  }

  const lowered = text.toLowerCase();
  if (lowered.includes("i prefer")) {
    return [
      {
        category: MemoryCategory.PREFERENCE,
        content: text.trim(),
        importance: 65,
      },
    ];
  }

  if (lowered.includes("my goal is") || lowered.includes("i want to")) {
    return [
      {
        category: MemoryCategory.GOAL,
        content: text.trim(),
        importance: 85,
      },
    ];
  }

  return [];
};

export { extractMemories };
