import { openAIClient } from "./openaiClient";
import {
  buildAdvicePrompt,
  buildReviewSummaryPrompt,
  buildWeeklySummaryPrompt,
} from "./promptTemplates";
import {
  AdviceResult,
  ReviewSummaryResult,
  WeeklySummaryResult,
} from "./types";

const generateAdvice = async (context: string): Promise<AdviceResult | null> => {
  const result = await openAIClient.createJson<AdviceResult>(
    [
      { role: "system", content: buildAdvicePrompt(context) },
      { role: "user", content: "Give the most useful answer." },
    ],
    0.3
  );

  if (!result?.reply?.trim()) {
    return null;
  }

  return { reply: result.reply.trim() };
};

const generateReviewSummary = async (
  context: string
): Promise<ReviewSummaryResult | null> => {
  const result = await openAIClient.createJson<ReviewSummaryResult>(
    [
      { role: "system", content: buildReviewSummaryPrompt(context) },
      { role: "user", content: "Summarize the day clearly." },
    ],
    0.2
  );

  if (!result?.summary?.trim()) {
    return null;
  }

  return {
    summary: result.summary.trim(),
    wins: Array.isArray(result.wins)
      ? result.wins.map((item) => item.trim()).filter(Boolean).slice(0, 4)
      : [],
    blockers: Array.isArray(result.blockers)
      ? result.blockers.map((item) => item.trim()).filter(Boolean).slice(0, 4)
      : [],
    nextStep: result.nextStep?.trim() || "",
  };
};

const generateWeeklySummary = async (
  context: string
): Promise<WeeklySummaryResult | null> => {
  const result = await openAIClient.createJson<WeeklySummaryResult>(
    [
      { role: "system", content: buildWeeklySummaryPrompt(context) },
      { role: "user", content: "Generate the weekly summary." },
    ],
    0.2
  );

  if (!result?.summaryText?.trim()) {
    return null;
  }

  return {
    summaryText: result.summaryText.trim(),
    wins: Array.isArray(result.wins)
      ? result.wins.map((item) => item.trim()).filter(Boolean).slice(0, 5)
      : [],
    missedWork: Array.isArray(result.missedWork)
      ? result.missedWork.map((item) => item.trim()).filter(Boolean).slice(0, 5)
      : [],
    patterns: Array.isArray(result.patterns)
      ? result.patterns.map((item) => item.trim()).filter(Boolean).slice(0, 5)
      : [],
    nextWeekFocus: Array.isArray(result.nextWeekFocus)
      ? result.nextWeekFocus.map((item) => item.trim()).filter(Boolean).slice(0, 5)
      : [],
  };
};

export { generateAdvice, generateReviewSummary, generateWeeklySummary };
