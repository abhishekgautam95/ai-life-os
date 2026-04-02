const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

type ApiRequestOptions = RequestInit & {
  token?: string;
};

type ApiErrorPayload = {
  message?: string;
};

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function apiRequest<T>(path: string, options: ApiRequestOptions = {}) {
  const { token, headers, ...restOptions } = options;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...restOptions,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  const payload = (await response.json().catch(() => null)) as
    | ApiErrorPayload
    | null;

  if (!response.ok) {
    throw new ApiError(
      payload?.message || "Something went wrong",
      response.status
    );
  }

  return payload as T;
}

export { API_BASE_URL, ApiError, apiRequest };
