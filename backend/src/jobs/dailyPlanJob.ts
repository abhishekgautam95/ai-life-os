import { Reminder, User } from "@prisma/client";

import { dailyPlanService } from "../services/dailyPlanService";

const runDailyPlanJob = async (user: User, reminder: Reminder) => {
  const result = await dailyPlanService.generateForUser(
    user,
    `Automated morning plan from reminder ${reminder.id}`
  );

  return result.plan.content;
};

export { runDailyPlanJob };
