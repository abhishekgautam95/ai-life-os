import { User } from "@prisma/client";

import { weeklySummaryService } from "../services/weeklySummaryService";

const runWeeklySummaryJob = async (user: User) => {
  const summary = await weeklySummaryService.generateForUser(user);

  return [
    "Weekly summary",
    `Wins: ${summary.wins.join("; ") || "No wins captured."}`,
    `Missed work: ${summary.missedWork.join("; ") || "No major misses captured."}`,
    `Patterns: ${summary.patterns.join("; ") || "No strong pattern yet."}`,
    `Next-week focus: ${summary.nextWeekFocus.join(", ") || "Define two concrete priorities."}`,
    summary.summaryText,
  ]
    .filter(Boolean)
    .join("\n\n");
};

export { runWeeklySummaryJob };
