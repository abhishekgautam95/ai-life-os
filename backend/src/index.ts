import { app } from "./app";
import { env } from "./config/env";
import { prisma } from "./config/prisma";
import { scheduler } from "./jobs/scheduler";
import { bootstrapMessaging, telegramProvider } from "./runtime";
import { logger } from "./utils/logger";

const server = app.listen(env.PORT, async () => {
  logger.info(`Server running on http://localhost:${env.PORT}`);
  await bootstrapMessaging();
  scheduler.start();
});

const shutdown = async () => {
  scheduler.stop();
  telegramProvider.stopPolling();
  server.close();
  await prisma.$disconnect();
};

process.on("SIGINT", () => {
  void shutdown();
});

process.on("SIGTERM", () => {
  void shutdown();
});
