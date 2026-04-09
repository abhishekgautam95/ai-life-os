type LogLevel = "info" | "warn" | "error" | "debug";

const write = (level: LogLevel, message: string, payload?: unknown) => {
  const serialized =
    payload === undefined ? "" : ` ${JSON.stringify(payload, null, 2)}`;

  console[level](`[${level.toUpperCase()}] ${message}${serialized}`);
};

const logger = {
  info: (message: string, payload?: unknown) => write("info", message, payload),
  warn: (message: string, payload?: unknown) => write("warn", message, payload),
  error: (message: string, payload?: unknown) =>
    write("error", message, payload),
  debug: (message: string, payload?: unknown) => {
    if (process.env.NODE_ENV === "development") {
      write("debug", message, payload);
    }
  },
};

export { logger };
