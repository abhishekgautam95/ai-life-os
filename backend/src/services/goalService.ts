import { GoalPriority, GoalStatus } from "@prisma/client";

import { prisma } from "../config/prisma";

class GoalService {
  async createGoal(input: {
    userId: string;
    title: string;
    description?: string;
    priority?: GoalPriority;
  }) {
    return prisma.goal.create({
      data: {
        userId: input.userId,
        title: input.title,
        description: input.description,
        priority: input.priority || GoalPriority.MEDIUM,
        status: GoalStatus.ACTIVE,
      },
    });
  }

  async findGoalByTitle(userId: string, title: string) {
    const normalized = title.trim().toLowerCase();
    const goals = await prisma.goal.findMany({
      where: {
        userId,
        status: {
          in: [GoalStatus.ACTIVE, GoalStatus.PAUSED],
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return (
      goals.find((goal) => goal.title.toLowerCase() === normalized) ||
      goals.find((goal) => goal.title.toLowerCase().includes(normalized)) ||
      null
    );
  }

  async getActiveGoals(userId: string) {
    return prisma.goal.findMany({
      where: {
        userId,
        status: GoalStatus.ACTIVE,
      },
      orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
      take: 10,
    });
  }
}

const goalService = new GoalService();

export { goalService };
