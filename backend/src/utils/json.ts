const safeJsonParse = <T>(value: string): T | null => {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

const extractJsonString = (value: string): string | null => {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  if (
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"))
  ) {
    return trimmed;
  }

  const fenced = trimmed.match(/```json\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const firstObject = trimmed.match(/\{[\s\S]*\}/);
  if (firstObject?.[0]) {
    return firstObject[0];
  }

  const firstArray = trimmed.match(/\[[\s\S]*\]/);
  if (firstArray?.[0]) {
    return firstArray[0];
  }

  return null;
};

const parseModelJson = <T>(value: string): T | null => {
  const jsonString = extractJsonString(value);

  if (!jsonString) {
    return null;
  }

  return safeJsonParse<T>(jsonString);
};

export { parseModelJson, safeJsonParse };
