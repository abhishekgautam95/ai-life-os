import { User } from "@prisma/client";

import { generatePlan } from "../ai/planner";
import { prisma } from "../config/prisma";
import { getDayKey } from "../utils/time";
import { goalService } from "./goalService";
import { memoryService } from "./memoryService";
import { taskService } from "./taskService";

class DailyPlanService {
  private fallbackPlan(input: {
    user: User;
    goals: Array<{ title: string }>;
    tasks: Array<{ title: string; dueAt: Date | null; goal: { title: string } | null }>;
    availableTime?: string;
  }) {
    const header = `Plan for ${input.user.name}`;
    const focus = input.goals.slice(0, 2).map((goal) => `Focus goal: ${goal.title}`);
    const tasks = input.tasks
      .slice(0, 5)
      .map((task, index) => `${index + 1}. ${task.title}${task.goal ? ` (${task.goal.title})` : ""}`);

    return [
      header,
      input.availableTime ? `Available time: ${input.availableTime}` : null,
      focus.length ? `Priority anchors:\n- ${focus.join("\n- ")}` : null,
      tasks.length ? `Execution order:\n${tasks.join("\n")}` : "No open tasks. Use today to define the next 2 concrete actions.",
      "End the day with a short review: completed, partial, skipped, and one blocker.",
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  async generateForUser(user: User, requestText: string, availableTime?: string) {
    const [goals, tasks, memories] = await Promise.all([
      goalService.getActiveGoals(user.id),
      taskService.getPendingTasks(user.id),
      memoryService.getRelevantMemories(user.id),
    ]);

    const context = JSON.stringify(
      {
        user: {
          name: user.name,
          timezone: user.timezone,
        },
        requestText,
        availableTime,
        goals: goals.map((goal) => ({
          title: goal.title,
          description: goal.description,
          priority: goal.priority,
        })),
        tasks: tasks.map((task) => ({
          title: task.title,
          description: task.description,
          dueAt: task.dueAt,
          status: task.status,
          goal: task.goal?.title || null,
        })),
        memories: memories.map((memory) => ({
          category: memory.category,
          content: memory.content,
          importance: memory.importance,
        })),
      },
      null,
      2
    );

    const aiPlan = await generatePlan(context);
    const content =
      aiPlan?.planText ||
      this.fallbackPlan({
        user,
        goals,
        tasks,
        availableTime,
      });

    const dayKey = getDayKey(new Date(), user.timezone);

    const plan = await prisma.dailyPlan.upsert({
      where: {
        userId_dayKey: {
          userId: user.id,
          dayKey,
        },
      },
      update: {
        content,
        date: new Date(),
      },
      create: {
        userId: user.id,
        dayKey,
        date: new Date(),
        content,
      },
    });

    return {
      plan,
      focus: aiPlan?.focus || goals.slice(0, 3).map((goal) => goal.title),
    };
  }
}

const dailyPlanService = new DailyPlanService();

export { dailyPlanService };
