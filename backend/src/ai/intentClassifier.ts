import {
  GoalPriority,
  IntentType,
  ReviewStatus,
  TaskStatus,
} from "@prisma/client";

import { parseLocalTime } from "../utils/time";
import { openAIClient } from "./openaiClient";
import { intentPrompt } from "./promptTemplates";
import { IntentAnalysis } from "./types";

type IntentContext = {
  userName: string;
  timezone: string;
  activeGoals: string[];
  openTasks: string[];
};

const isIntentType = (value: unknown): value is IntentType =>
  Object.values(IntentType).includes(value as IntentType);

const isGoalPriority = (value: unknown): value is GoalPriority =>
  Object.values(GoalPriority).includes(value as GoalPriority);

const isTaskStatus = (value: unknown): value is TaskStatus =>
  Object.values(TaskStatus).includes(value as TaskStatus);

const isReviewStatus = (value: unknown): value is ReviewStatus =>
  Object.values(ReviewStatus).includes(value as ReviewStatus);

const normalizeString = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const normalizeIntentAnalysis = (raw: Record<string, unknown>): IntentAnalysis | null => {
  const intent = isIntentType(raw.intent) ? raw.intent : IntentType.UNKNOWN;
  const confidence = typeof raw.confidence === "number" ? raw.confidence : 0.5;
  const rawGoal = raw.goal as Record<string, unknown> | null;
  const rawTask = raw.task as Record<string, unknown> | null;
  const rawReview = raw.review as Record<string, unknown> | null;
  const rawReminder = raw.reminder as Record<string, unknown> | null;

  return {
    intent,
    confidence,
    goal:
      rawGoal && normalizeString(rawGoal.title)
        ? {
            title: normalizeString(rawGoal.title),
            description: normalizeString(rawGoal.description) || undefined,
            priority: isGoalPriority(rawGoal.priority)
              ? rawGoal.priority
              : GoalPriority.MEDIUM,
          }
        : undefined,
    task:
      rawTask && normalizeString(rawTask.title)
        ? {
            title: normalizeString(rawTask.title),
            description: normalizeString(rawTask.description) || undefined,
            dueAt: normalizeString(rawTask.dueAt) || undefined,
            goalTitle: normalizeString(rawTask.goalTitle) || undefined,
            status: isTaskStatus(rawTask.status) ? rawTask.status : TaskStatus.PENDING,
          }
        : undefined,
    review:
      rawReview && isReviewStatus(rawReview.status)
        ? {
            status: rawReview.status,
            completed: Array.isArray(rawReview.completed)
              ? rawReview.completed
                  .map((item) => normalizeString(item))
                  .filter(Boolean)
              : [],
            partial: Array.isArray(rawReview.partial)
              ? rawReview.partial
                  .map((item) => normalizeString(item))
                  .filter(Boolean)
              : [],
            skipped: Array.isArray(rawReview.skipped)
              ? rawReview.skipped.map((item) => normalizeString(item)).filter(Boolean)
              : [],
            summary: normalizeString(rawReview.summary),
          }
        : undefined,
    reminder:
      rawReminder && typeof rawReminder === "object"
        ? {
            recurrence:
              rawReminder.recurrence === "DAILY" ||
              rawReminder.recurrence === "WEEKLY"
                ? rawReminder.recurrence
                : "ONCE",
            sendAt: normalizeString(rawReminder.sendAt) || undefined,
            localTime: normalizeString(rawReminder.localTime)
              ? parseLocalTime(normalizeString(rawReminder.localTime), "09:00")
              : undefined,
            weekday:
              typeof rawReminder.weekday === "number" ? rawReminder.weekday : undefined,
            message: normalizeString(rawReminder.message) || undefined,
          }
        : undefined,
    availableTime: normalizeString(raw.availableTime) || undefined,
    adviceTopic: normalizeString(raw.adviceTopic) || undefined,
  };
};

const heuristicClassify = (text: string): IntentAnalysis => {
  const normalized = text.toLowerCase();

  if (normalized.startsWith("/plan") || normalized.includes("plan my day")) {
    return { intent: IntentType.PLAN_DAY, confidence: 0.9 };
  }

  if (
    normalized.startsWith("/review") ||
    normalized.includes("completed") ||
    normalized.includes("skipped") ||
    normalized.includes("partial")
  ) {
    return { intent: IntentType.REVIEW_DAY, confidence: 0.7 };
  }

  if (normalized.startsWith("/summary") || normalized.includes("weekly summary")) {
    return { intent: IntentType.WEEKLY_SUMMARY, confidence: 0.9 };
  }

  if (
    normalized.includes("goal") ||
    normalized.includes("i want to become") ||
    normalized.includes("my target is")
  ) {
    return {
      intent: IntentType.SAVE_GOAL,
      confidence: 0.7,
      goal: {
        title: text.replace(/^.*?(goal|want to|target is)\s*/i, "").trim() || text.trim(),
        priority: GoalPriority.HIGH,
      },
    };
  }

  if (
    normalized.includes("task") ||
    normalized.includes("todo") ||
    normalized.startsWith("remind me")
  ) {
    return {
      intent: IntentType.ADD_TASK,
      confidence: 0.7,
      task: {
        title: text.replace(/^.*?(task|todo|remind me to)\s*/i, "").trim() || text.trim(),
        status: TaskStatus.PENDING,
      },
    };
  }

  if (
    normalized.includes("remember") ||
    normalized.includes("i prefer") ||
    normalized.includes("best time")
  ) {
    return { intent: IntentType.SAVE_MEMORY, confidence: 0.7 };
  }

  if (
    normalized.includes("should i") ||
    normalized.includes("how do i") ||
    normalized.includes("what's the best way")
  ) {
    return { intent: IntentType.ASK_ADVICE, confidence: 0.7 };
  }

  return { intent: IntentType.UNKNOWN, confidence: 0.4 };
};

const classifyIntent = async (
  text: string,
  context: IntentContext
): Promise<IntentAnalysis> => {
  const contextSummary = JSON.stringify(context, null, 2);
  const raw = await openAIClient.createJson<Record<string, unknown>>(
    [
      { role: "system", content: intentPrompt },
      {
        role: "user",
        content: `User message: ${text}\n\nContext:\n${contextSummary}`,
      },
    ],
    0.1
  );

  if (raw) {
    const normalized = normalizeIntentAnalysis(raw);
    if (normalized) {
      return normalized;
    }
  }

  return heuristicClassify(text);
};

export { classifyIntent };
