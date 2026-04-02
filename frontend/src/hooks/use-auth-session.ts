"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getAuthSession } from "@/lib/auth";
import type { AuthUser } from "@/lib/auth";

type UseAuthSessionOptions = {
  requireAuth?: boolean;
};

function useAuthSession(options: UseAuthSessionOptions = {}) {
  const { requireAuth = false } = options;
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  useEffect(() => {
    const session = getAuthSession();

    if (requireAuth && !session.token) {
      router.replace("/login");
      setIsLoadingSession(false);
      return;
    }

    setToken(session.token);
    setUser(session.user);
    setIsLoadingSession(false);
  }, [requireAuth, router]);

  return {
    token,
    user,
    isLoadingSession,
  };
}

export { useAuthSession };
