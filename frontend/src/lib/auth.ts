type AuthUser = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

type AuthResponse = {
  success: boolean;
  message: string;
  data: {
    user: AuthUser;
    token: string;
  };
};

const TOKEN_KEY = "ai-life-os-token";
const USER_KEY = "ai-life-os-user";

function saveAuthSession(token: string, user: AuthUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function getAuthToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(TOKEN_KEY);
}

function getAuthUser() {
  if (typeof window === "undefined") {
    return null;
  }

  const rawUser = localStorage.getItem(USER_KEY);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as AuthUser;
  } catch {
    return null;
  }
}

function getAuthSession() {
  return {
    token: getAuthToken(),
    user: getAuthUser(),
  };
}

function clearAuthSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export {
  USER_KEY,
  TOKEN_KEY,
  clearAuthSession,
  getAuthSession,
  getAuthToken,
  getAuthUser,
  saveAuthSession,
};
export type { AuthResponse, AuthUser };
