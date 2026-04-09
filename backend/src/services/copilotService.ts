import {
  IntentType,
  MessageRole,
  ReminderRecurrence,
  TaskStatus,
  User,
} from "@prisma/client";

import { classifyIntent } from "../ai/intentClassifier";
import { generateAdvice } from "../ai/coach";
import { AppError } from "../utils/appError";
import { goalService } from "./goalService";
import { dailyPlanService } from "./dailyPlanService";
import { memoryService } from "./memoryService";
import { messageService } from "./messageService";
import { reminderService } from "./reminderService";
import { reviewService } from "./reviewService";
import { taskService } from "./taskService";
import { weeklySummaryService } from "./weeklySummaryService";

class CopilotService {
  private formatWeeklySummary(summary: Awaited<ReturnType<typeof weeklySummaryService.generateForUser>>) {
    return [
      "Weekly summary",
      `Wins: ${summary.wins.join("; ") || "No clear wins recorded."}`,
      `Missed work: ${summary.missedWork.join("; ") || "No major misses recorded."}`,
      `Patterns: ${summary.patterns.join("; ") || "No strong pattern yet."}`,
      `Next-week focus: ${summary.nextWeekFocus.join(", ") || "Pick 2 concrete priorities."}`,
      summary.summaryText,
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  private parseDate(value: string | undefined) {
    if (!value) {
      return undefined;
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }

  private async handleReminderRequest(user: User, text: string, analysis: Awaited<ReturnType<typeof classifyIntent>>) {
    const reminder = analysis.reminder;

    if (!reminder?.message && !reminder?.sendAt && !reminder?.localTime) {
      return null;
    }

    await reminderService.createCustomReminder({
      userId: user.id,
      message: reminder.message || text,
      sendAt: this.parseDate(reminder.sendAt),
      recurrence: reminder.recurrence || ReminderRecurrence.ONCE,
      localTime: reminder.localTime,
      weekday: reminder.weekday,
    });

    if (reminder.recurrence === ReminderRecurrence.DAILY && reminder.localTime) {
      return `Saved a daily reminder for ${reminder.localTime}: ${reminder.message || text}`;
    }

    if (reminder.recurrence === ReminderRecurrence.WEEKLY && reminder.localTime) {
      return `Saved a weekly reminder for weekday ${reminder.weekday ?? 0} at ${reminder.localTime}: ${reminder.message || text}`;
    }

    return `Saved a reminder${reminder.sendAt ? ` for ${reminder.sendAt}` : ""}: ${reminder.message || text}`;
  }

  private async handleUnknownTaskStatus(user: User, analysis: Awaited<ReturnType<typeof classifyIntent>>) {
    if (!analysis.task?.title || !analysis.task.status) {
      return null;
    }

    const updated = await taskService.updateClosestTaskStatus(
      user.id,
      analysis.task.title,
      analysis.task.status
    );

    if (!updated) {
      return null;
    }

    return `Updated task "${updated.title}" to ${updated.status.toLowerCase()}.`;
  }

  async handleMessage(user: User, text: string) {
    if (!text.trim()) {
      throw new AppError("Empty messages are not supported.", 400);
    }

    const directCommand = text.trim().toLowerCase();
    if (directCommand === "/start") {
      await reminderService.ensureDefaultReminders(user.id);
      const reply = [
        `AI Life Copilot is active for ${user.name}.`,
        "You can send goals, tasks, planning requests, reviews, reminders, and advice questions.",
        "Default reminders are set for a morning plan, evening review, and weekly summary.",
      ].join("\n\n");

      await messageService.createMessage({
        userId: user.id,
        role: MessageRole.ASSISTANT,
        rawText: reply,
      });

      return {
        intent: IntentType.UNKNOWN,
        reply,
      };
    }

    const context = await Promise.all([
      goalService.getActiveGoals(user.id),
      taskService.getPendingTasks(user.id),
    ]);

    const analysis = await classifyIntent(text, {
      userName: user.name,
      timezone: user.timezone,
      activeGoals: context[0].map((goal) => goal.title),
      openTasks: context[1].map((task) => task.title),
    });

    await messageService.createMessage({
      userId: user.id,
      role: MessageRole.USER,
      rawText: text,
      intent: analysis.intent,
    });

    const storedMemories = await memoryService.extractAndStore(user.id, text);
    const reminderReply = await this.handleReminderRequest(user, text, analysis);

    let reply = "";

    switch (analysis.intent) {
      case IntentType.SAVE_GOAL: {
        const title = analysis.goal?.title || text.trim();
        const goal = await goalService.createGoal({
          userId: user.id,
          title,
          description: analysis.goal?.description,
          priority: analysis.goal?.priority,
        });
        reply = `Saved goal: ${goal.title}`;
        break;
      }
      case IntentType.ADD_TASK: {
        const title = analysis.task?.title || text.trim();
        const relatedGoal = analysis.task?.goalTitle
          ? await goalService.findGoalByTitle(user.id, analysis.task.goalTitle)
          : null;
        const task = await taskService.createTask({
          userId: user.id,
          goalId: relatedGoal?.id,
          title,
          description: analysis.task?.description,
          dueAt: this.parseDate(analysis.task?.dueAt),
          status: analysis.task?.status || TaskStatus.PENDING,
        });
        reply = `Saved task: ${task.title}${relatedGoal ? ` under ${relatedGoal.title}` : ""}`;
        break;
      }
      case IntentType.PLAN_DAY: {
        const result = await dailyPlanService.generateForUser(
          user,
          text,
          analysis.availableTime
        );
        reply = result.plan.content;
        break;
      }
      case IntentType.REVIEW_DAY: {
        const parsedReview =
          analysis.review || reviewService.fallbackReviewFromText(text);
        const result = await reviewService.createReview(user, parsedReview, text);
        reply = [
          `Review saved with status ${parsedReview.status.toLowerCase()}.`,
          `Summary: ${result.summary.summary}`,
          result.summary.wins.length
            ? `Wins: ${result.summary.wins.join("; ")}`
            : null,
          result.summary.blockers.length
            ? `Blockers: ${result.summary.blockers.join("; ")}`
            : null,
          result.summary.nextStep ? `Next step: ${result.summary.nextStep}` : null,
        ]
          .filter(Boolean)
          .join("\n\n");
        break;
      }
      case IntentType.ASK_ADVICE: {
        const summary = await weeklySummaryService.generateForUser(user);
        const advice = await generateAdvice(
          JSON.stringify(
            {
              user: {
                name: user.name,
                timezone: user.timezone,
              },
              adviceRequest: analysis.adviceTopic || text,
              currentWeeklySummary: summary,
            },
            null,
            2
          )
        );
        reply =
          advice?.reply ||
          [
            `Current focus: ${summary.nextWeekFocus.join(", ") || "Define your next two priorities."}`,
            `Advice request: ${analysis.adviceTopic || text}`,
            "Recommended move: pick one high-leverage task, timebox it, and close the loop with a short review tonight.",
          ].join("\n\n");
        break;
      }
      case IntentType.SAVE_MEMORY: {
        if (storedMemories.length === 0) {
          await memoryService.storeSingle({
            userId: user.id,
            content: text.trim(),
            importance: 60,
          });
          reply = "Saved that as useful long-term context.";
        } else {
          reply = `Saved ${storedMemories.length} memory item${storedMemories.length === 1 ? "" : "s"} for future planning.`;
        }
        break;
      }
      case IntentType.WEEKLY_SUMMARY: {
        const summary = await weeklySummaryService.generateForUser(user);
        reply = this.formatWeeklySummary(summary);
        break;
      }
      case IntentType.UNKNOWN:
      default: {
        reply =
          (await this.handleUnknownTaskStatus(user, analysis)) ||
          reminderReply ||
          (storedMemories.length
            ? `Saved ${storedMemories.length} useful memory item${storedMemories.length === 1 ? "" : "s"}.`
            : [
                "I couldn’t map that cleanly to a goal, task, plan, review, memory, or summary request.",
                "Try one of these formats:",
                '- "Goal: become a top AI backend engineer"',
                '- "Task: finish the embeddings service by Friday 6pm"',
                '- "Plan my day, I have 4 focused hours"',
                '- "Review: completed API refactor, partial tests, skipped gym"',
              ].join("\n"));
        break;
      }
    }

    if (reminderReply && analysis.intent !== IntentType.UNKNOWN) {
      reply = `${reply}\n\n${reminderReply}`;
    }

    await messageService.createMessage({
      userId: user.id,
      role: MessageRole.ASSISTANT,
      rawText: reply,
      intent: analysis.intent,
    });

    return {
      intent: analysis.intent,
      reply,
    };
  }
}

const copilotService = new CopilotService();

export { copilotService };
