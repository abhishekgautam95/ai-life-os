import { MessagingChannel, User } from "@prisma/client";

import { env } from "../config/env";
import { prisma } from "../config/prisma";

class UserService {
  async findOrCreateTelegramUser(input: {
    telegramId: string;
    name: string;
    timezone?: string;
  }) {
    const existing = await prisma.user.findUnique({
      where: { telegramId: input.telegramId },
    });

    if (existing) {
      return prisma.user.update({
        where: { id: existing.id },
        data: {
          name: input.name || existing.name,
          timezone: input.timezone || existing.timezone,
          channel: MessagingChannel.TELEGRAM,
        },
      });
    }

    return prisma.user.create({
      data: {
        telegramId: input.telegramId,
        name: input.name,
        timezone: input.timezone || env.DEFAULT_TIMEZONE,
        channel: MessagingChannel.TELEGRAM,
      },
    });
  }

  async getById(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
    });
  }

  async getByTelegramId(telegramId: string) {
    return prisma.user.findUnique({
      where: { telegramId },
    });
  }

  async getContext(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      include: {
        goals: {
          where: {
            status: {
              in: ["ACTIVE", "PAUSED"],
            },
          },
          orderBy: {
            updatedAt: "desc",
          },
          take: 5,
        },
        tasks: {
          where: {
            status: {
              in: ["PENDING", "IN_PROGRESS"],
            },
          },
          orderBy: [{ dueAt: "asc" }, { updatedAt: "desc" }],
          take: 8,
        },
        memories: {
          orderBy: [{ importance: "desc" }, { createdAt: "desc" }],
          take: 8,
        },
        reviews: {
          orderBy: {
            date: "desc",
          },
          take: 5,
        },
        dailyPlans: {
          orderBy: {
            date: "desc",
          },
          take: 3,
        },
      },
    });
  }

  async listForDebug() {
    return prisma.user.findMany({
      include: {
        goals: true,
        tasks: true,
        memories: true,
        reminders: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
    });
  }
}

const userService = new UserService();

export { userService };
