const parseLocalTime = (value: string | undefined, fallback: string) => {
  const normalized = value?.trim() || fallback;
  const match = normalized.match(/^(\d{1,2}):(\d{2})$/);

  if (!match) {
    return fallback;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours > 23 || minutes > 59) {
    return fallback;
  }

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

const getLocalDateParts = (date: Date, timeZone: string) => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(date);
  const getPart = (type: string) => parts.find((part) => part.type === type)?.value;
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  return {
    year: Number(getPart("year")),
    month: Number(getPart("month")),
    day: Number(getPart("day")),
    hour: Number(getPart("hour")),
    minute: Number(getPart("minute")),
    weekday: weekdayMap[getPart("weekday") || "Sun"] ?? 0,
  };
};

const getDayKey = (date: Date, timeZone: string) => {
  const parts = getLocalDateParts(date, timeZone);

  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(
    parts.day
  ).padStart(2, "0")}`;
};

const getWeekKey = (date: Date, timeZone: string) => {
  const parts = getLocalDateParts(date, timeZone);
  const thursday = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  thursday.setUTCDate(thursday.getUTCDate() + (4 - (parts.weekday || 7)));

  const yearStart = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 1));
  const week = Math.ceil(
    ((thursday.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7
  );

  return `${thursday.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
};

const localTimeMatches = (date: Date, timeZone: string, localTime: string) => {
  const normalized = parseLocalTime(localTime, "09:00");
  const [hours, minutes] = normalized.split(":").map(Number);
  const parts = getLocalDateParts(date, timeZone);

  return parts.hour === hours && parts.minute === minutes;
};

const humanizeDate = (date: Date, timeZone: string) =>
  new Intl.DateTimeFormat("en-US", {
    timeZone,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);

export {
  getDayKey,
  getLocalDateParts,
  getWeekKey,
  humanizeDate,
  localTimeMatches,
  parseLocalTime,
};
