import dotenv from "dotenv";

dotenv.config();

const parseNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseNodeEnv = (value: string | undefined) => {
  if (value === "production" || value === "test") {
    return value;
  }

  return "development";
};

const parseTransport = (value: string | undefined) => {
  return value === "polling" ? "polling" : "webhook";
};

const env = {
  PORT: parseNumber(process.env.PORT, 3001),
  NODE_ENV: parseNodeEnv(process.env.NODE_ENV),
  DATABASE_URL: process.env.DATABASE_URL || "",
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
  OPENAI_MODEL: process.env.OPENAI_MODEL || "gpt-4.1-mini",
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || "",
  TELEGRAM_WEBHOOK_SECRET: process.env.TELEGRAM_WEBHOOK_SECRET || "",
  TELEGRAM_TRANSPORT: parseTransport(process.env.TELEGRAM_TRANSPORT),
  APP_BASE_URL: (process.env.APP_BASE_URL || "").replace(/\/$/, ""),
  DEFAULT_TIMEZONE: process.env.DEFAULT_TIMEZONE || "UTC",
  SCHEDULER_INTERVAL_MS: parseNumber(process.env.SCHEDULER_INTERVAL_MS, 60_000),
};

export { env };
