import {
  ReminderRecurrence,
  ReminderStatus,
  ReminderType,
} from "@prisma/client";

import { prisma } from "../config/prisma";
import {
  getDayKey,
  getLocalDateParts,
  getWeekKey,
  localTimeMatches,
} from "../utils/time";

type ReminderPayload = {
  localTime?: string;
  weekday?: number;
  message?: string;
};

class ReminderService {
  async ensureDefaultReminders(userId: string) {
    const defaults: Array<{
      type: ReminderType;
      recurrence: ReminderRecurrence;
      payload: ReminderPayload;
    }> = [
      {
        type: ReminderType.MORNING_PLAN,
        recurrence: ReminderRecurrence.DAILY,
        payload: { localTime: "08:00" },
      },
      {
        type: ReminderType.EVENING_REVIEW,
        recurrence: ReminderRecurrence.DAILY,
        payload: { localTime: "21:00" },
      },
      {
        type: ReminderType.WEEKLY_SUMMARY,
        recurrence: ReminderRecurrence.WEEKLY,
        payload: { localTime: "18:00", weekday: 0 },
      },
    ];

    await Promise.all(
      defaults.map(async (reminder) => {
        const existing = await prisma.reminder.findFirst({
          where: {
            userId,
            type: reminder.type,
            recurrence: reminder.recurrence,
            status: {
              not: ReminderStatus.CANCELLED,
            },
          },
        });

        if (existing) {
          return existing;
        }

        return prisma.reminder.create({
          data: {
            userId,
            type: reminder.type,
            recurrence: reminder.recurrence,
            payload: reminder.payload,
            status: ReminderStatus.PENDING,
          },
        });
      })
    );
  }

  async createCustomReminder(input: {
    userId: string;
    message: string;
    sendAt?: Date;
    recurrence?: ReminderRecurrence;
    localTime?: string;
    weekday?: number;
  }) {
    return prisma.reminder.create({
      data: {
        userId: input.userId,
        type: ReminderType.CUSTOM,
        payload: {
          message: input.message,
          localTime: input.localTime,
          weekday: input.weekday,
        },
        sendAt: input.sendAt,
        recurrence: input.recurrence || ReminderRecurrence.ONCE,
        status: ReminderStatus.PENDING,
      },
    });
  }

  async getDueReminders(now: Date) {
    const reminders = await prisma.reminder.findMany({
      where: {
        status: {
          in: [ReminderStatus.PENDING, ReminderStatus.FAILED],
        },
      },
      include: {
        user: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return reminders.filter((reminder) => {
      const payload = (reminder.payload || {}) as ReminderPayload;
      const timezone = reminder.user.timezone;

      if (reminder.recurrence === ReminderRecurrence.ONCE) {
        return Boolean(reminder.sendAt && reminder.sendAt <= now);
      }

      if (!payload.localTime) {
        return false;
      }

      if (!localTimeMatches(now, timezone, payload.localTime)) {
        return false;
      }

      if (reminder.recurrence === ReminderRecurrence.DAILY) {
        return getDayKey(reminder.lastSentAt || new Date(0), timezone) !== getDayKey(now, timezone);
      }

      if (reminder.recurrence === ReminderRecurrence.WEEKLY) {
        const weekdayMatches =
          typeof payload.weekday === "number"
            ? payload.weekday === getLocalDateParts(now, timezone).weekday
            : true;

        return (
          weekdayMatches &&
          getWeekKey(reminder.lastSentAt || new Date(0), timezone) !==
            getWeekKey(now, timezone)
        );
      }

      return false;
    });
  }

  async markProcessing(reminderId: string) {
    return prisma.reminder.update({
      where: { id: reminderId },
      data: {
        status: ReminderStatus.PROCESSING,
      },
    });
  }

  async markCompleted(reminderId: string, recurrence: ReminderRecurrence, now: Date) {
    return prisma.reminder.update({
      where: { id: reminderId },
      data: {
        status:
          recurrence === ReminderRecurrence.ONCE
            ? ReminderStatus.SENT
            : ReminderStatus.PENDING,
        lastSentAt: now,
        lastError: null,
      },
    });
  }

  async markFailed(reminderId: string, errorMessage: string) {
    return prisma.reminder.update({
      where: { id: reminderId },
      data: {
        status: ReminderStatus.FAILED,
        lastError: errorMessage,
      },
    });
  }
}

const reminderService = new ReminderService();

export { reminderService };
