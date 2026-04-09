import { TaskStatus } from "@prisma/client";

import { prisma } from "../config/prisma";

const normalizeForMatch = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

class TaskService {
  async createTask(input: {
    userId: string;
    goalId?: string;
    title: string;
    description?: string;
    dueAt?: Date;
    status?: TaskStatus;
  }) {
    return prisma.task.create({
      data: {
        userId: input.userId,
        goalId: input.goalId,
        title: input.title,
        description: input.description,
        dueAt: input.dueAt,
        status: input.status || TaskStatus.PENDING,
      },
    });
  }

  async getPendingTasks(userId: string) {
    return prisma.task.findMany({
      where: {
        userId,
        status: {
          in: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS],
        },
      },
      include: {
        goal: true,
      },
      orderBy: [{ dueAt: "asc" }, { updatedAt: "desc" }],
      take: 12,
    });
  }

  async updateClosestTaskStatus(userId: string, title: string, status: TaskStatus) {
    const tasks = await prisma.task.findMany({
      where: {
        userId,
        status: {
          in: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS, TaskStatus.SKIPPED],
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 20,
    });

    const normalizedTitle = normalizeForMatch(title);
    const match =
      tasks.find((task) => normalizeForMatch(task.title) === normalizedTitle) ||
      tasks.find((task) => normalizeForMatch(task.title).includes(normalizedTitle)) ||
      tasks.find((task) => normalizedTitle.includes(normalizeForMatch(task.title))) ||
      null;

    if (!match) {
      return null;
    }

    return prisma.task.update({
      where: { id: match.id },
      data: { status },
    });
  }

  async applyReviewStatus(
    userId: string,
    review: { completed: string[]; partial: string[]; skipped: string[] }
  ) {
    const updates = await Promise.all([
      ...review.completed.map((title) =>
        this.updateClosestTaskStatus(userId, title, TaskStatus.COMPLETED)
      ),
      ...review.partial.map((title) =>
        this.updateClosestTaskStatus(userId, title, TaskStatus.IN_PROGRESS)
      ),
      ...review.skipped.map((title) =>
        this.updateClosestTaskStatus(userId, title, TaskStatus.SKIPPED)
      ),
    ]);

    return updates.filter(Boolean);
  }
}

const taskService = new TaskService();

export { taskService };
