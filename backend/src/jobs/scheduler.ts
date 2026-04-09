import { ReminderType } from "@prisma/client";

import { env } from "../config/env";
import { logger } from "../utils/logger";
import { humanizeDate } from "../utils/time";
import { reminderService } from "../services/reminderService";
import { runDailyPlanJob } from "./dailyPlanJob";
import { runReviewJob } from "./reviewJob";
import { runWeeklySummaryJob } from "./weeklySummaryJob";
import { providers } from "../runtime";

class Scheduler {
  private timer: NodeJS.Timeout | null = null;
  private running = false;

  start() {
    if (this.timer) {
      return;
    }

    this.timer = setInterval(() => {
      void this.tick();
    }, env.SCHEDULER_INTERVAL_MS);

    void this.tick();
    logger.info("Scheduler started", {
      intervalMs: env.SCHEDULER_INTERVAL_MS,
    });
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async tick() {
    if (this.running) {
      return;
    }

    this.running = true;

    try {
      const now = new Date();
      const dueReminders = await reminderService.getDueReminders(now);

      for (const reminder of dueReminders) {
        await reminderService.markProcessing(reminder.id);
        try {
          const provider = providers[reminder.user.channel];
          if (!provider) {
            throw new Error(`No provider configured for ${reminder.user.channel}`);
          }

          let text = "";
          if (reminder.type === ReminderType.MORNING_PLAN) {
            text = await runDailyPlanJob(reminder.user, reminder);
          } else if (reminder.type === ReminderType.EVENING_REVIEW) {
            text = await runReviewJob(reminder.user);
          } else if (reminder.type === ReminderType.WEEKLY_SUMMARY) {
            text = await runWeeklySummaryJob(reminder.user);
          } else {
            const payload = reminder.payload as { message?: string };
            text =
              payload.message ||
              `Reminder due at ${humanizeDate(reminder.sendAt || now, reminder.user.timezone)}`;
          }

          const target =
            reminder.user.channel === "TELEGRAM"
              ? reminder.user.telegramId
              : reminder.user.whatsappId;

          if (!target) {
            throw new Error(`Missing target for ${reminder.user.channel}`);
          }

          const sent = await provider.sendMessage(target, text);
          if (!sent) {
            throw new Error("Provider send failed");
          }

          await reminderService.markCompleted(reminder.id, reminder.recurrence, now);
        } catch (error) {
          await reminderService.markFailed(
            reminder.id,
            error instanceof Error ? error.message : String(error)
          );
          logger.error("Reminder job failed", {
            reminderId: reminder.id,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    } finally {
      this.running = false;
    }
  }
}

const scheduler = new Scheduler();

export { scheduler };
