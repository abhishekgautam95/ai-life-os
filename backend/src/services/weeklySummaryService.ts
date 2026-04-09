import { User } from "@prisma/client";

import { generateWeeklySummary } from "../ai/coach";
import { prisma } from "../config/prisma";

class WeeklySummaryService {
  private fallbackSummary(input: {
    completedTasks: number;
    skippedTasks: number;
    activeGoals: string[];
  }) {
    const wins = [`Completed tasks: ${input.completedTasks}`];
    const missedWork = [`Skipped tasks: ${input.skippedTasks}`];
    const patterns = [
      input.skippedTasks > input.completedTasks
        ? "Execution is slipping relative to planned work."
        : "Execution is reasonably aligned with the plan.",
    ];
    const nextWeekFocus = input.activeGoals.slice(0, 3);

    return {
      wins,
      missedWork,
      patterns,
      nextWeekFocus,
      summaryText: [
        "Weekly summary",
        `Wins: ${wins.join("; ")}`,
        `Missed work: ${missedWork.join("; ")}`,
        `Pattern: ${patterns.join("; ")}`,
        `Next-week focus: ${nextWeekFocus.join(", ") || "Define 2 concrete priorities."}`,
      ].join("\n"),
    };
  }

  async generateForUser(user: User) {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [reviews, tasks, goals] = await Promise.all([
      prisma.dailyReview.findMany({
        where: {
          userId: user.id,
          date: {
            gte: weekAgo,
          },
        },
        orderBy: {
          date: "desc",
        },
      }),
      prisma.task.findMany({
        where: {
          userId: user.id,
          updatedAt: {
            gte: weekAgo,
          },
        },
      }),
      prisma.goal.findMany({
        where: {
          userId: user.id,
          status: {
            in: ["ACTIVE", "PAUSED"],
          },
        },
      }),
    ]);

    const context = JSON.stringify(
      {
        user: {
          name: user.name,
          timezone: user.timezone,
        },
        reviews,
        tasks,
        goals,
      },
      null,
      2
    );

    const aiSummary = await generateWeeklySummary(context);
    if (aiSummary) {
      return aiSummary;
    }

    const completedTasks = tasks.filter((task) => task.status === "COMPLETED").length;
    const skippedTasks = tasks.filter((task) => task.status === "SKIPPED").length;

    return this.fallbackSummary({
      completedTasks,
      skippedTasks,
      activeGoals: goals.map((goal) => goal.title),
    });
  }
}

const weeklySummaryService = new WeeklySummaryService();

export { weeklySummaryService };
