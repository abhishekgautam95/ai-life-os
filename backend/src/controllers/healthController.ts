import { Request, Response } from "express";

import { prisma } from "../config/prisma";
import { env } from "../config/env";

const getHealth = async (_req: Request, res: Response) => {
  let database = "down";

  try {
    await prisma.$queryRaw`SELECT 1`;
    database = "up";
  } catch {
    database = "down";
  }

  res.status(200).json({
    success: true,
    service: "ai-life-copilot",
    environment: env.NODE_ENV,
    transport: env.TELEGRAM_TRANSPORT,
    database,
  });
};

export { getHealth };
