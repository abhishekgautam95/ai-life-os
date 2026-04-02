"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { clearAuthSession, getAuthSession } from "@/lib/auth";
import {
  getRouteVisibility,
  getVisibleNavigationItems,
} from "@/lib/navigation";

type AppFrameProps = {
  children: React.ReactNode;
};

function AppFrame({ children }: AppFrameProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState("");
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const { token, user } = getAuthSession();
    const routeVisibility = getRouteVisibility(pathname);
    const hasToken = Boolean(token);

    if (routeVisibility === "user" && !hasToken) {
      router.replace("/login");
      setIsAuthenticated(false);
      setUserName("");
      setIsCheckingSession(false);
      return;
    }

    if (routeVisibility === "guest" && hasToken) {
      router.replace("/dashboard");
      setIsAuthenticated(true);
      setUserName(user?.name || "");
      setIsCheckingSession(false);
      return;
    }

    setIsAuthenticated(hasToken);
    setUserName(user?.name || "");
    setIsCheckingSession(false);
    setIsMenuOpen(false);
  }, [pathname, router]);

  useEffect(() => {
    function syncSessionFromStorage() {
      const { token, user } = getAuthSession();

      setIsAuthenticated(Boolean(token));
      setUserName(user?.name || "");
    }

    window.addEventListener("storage", syncSessionFromStorage);

    return () => {
      window.removeEventListener("storage", syncSessionFromStorage);
    };
  }, []);

  const visibleNavigationItems = useMemo(
    () => getVisibleNavigationItems(isAuthenticated),
    [isAuthenticated]
  );

  function handleLogout() {
    clearAuthSession();
    setIsAuthenticated(false);
    setUserName("");
    setIsMenuOpen(false);
    router.push("/login");
  }

  if (isCheckingSession) {
    return (
      <div className="grain min-h-screen pb-10">
        <header className="page-shell sticky top-0 z-20 pt-5">
          <div className="rounded-[30px] border border-white/85 bg-[rgba(255,251,245,0.97)] px-4 py-4 shadow-[0_22px_80px_rgba(15,23,42,0.12)] ring-1 ring-[rgba(255,255,255,0.55)] backdrop-blur-xl sm:px-5">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(20,33,61,1),rgba(37,67,132,0.95))] text-sm font-semibold text-white shadow-[0_12px_30px_rgba(15,23,42,0.25)]">
                AI
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[color:var(--muted)]">
                  Personal productivity
                </p>
                <p className="text-xl font-semibold tracking-[-0.03em] text-[color:var(--foreground)]">
                  AI Life OS
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="page-shell pt-6 sm:pt-8">
          <div className="rounded-[32px] border border-[color:var(--border)] bg-[linear-gradient(135deg,rgba(255,253,248,0.98),rgba(255,249,240,0.9))] px-6 py-10 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--accent-strong)]">
              Loading
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[color:var(--foreground)] sm:text-4xl">
              Preparing your workspace
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[color:var(--muted)] sm:text-base">
              Checking your session and loading the correct view.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="grain min-h-screen pb-10">
      <header className="page-shell sticky top-0 z-20 pt-5">
        <div className="rounded-[30px] border border-white/85 bg-[rgba(255,251,245,0.97)] px-4 py-4 shadow-[0_22px_80px_rgba(15,23,42,0.12)] ring-1 ring-[rgba(255,255,255,0.55)] backdrop-blur-xl sm:px-5">
          <div className="flex items-start justify-between gap-4 xl:hidden">
            <Link href="/" className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(20,33,61,1),rgba(37,67,132,0.95))] text-sm font-semibold text-white shadow-[0_12px_30px_rgba(15,23,42,0.25)]">
                AI
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[color:var(--muted)]">
                  Personal productivity
                </p>
                <p className="text-xl font-semibold tracking-[-0.03em] text-[color:var(--foreground)]">
                  AI Life OS
                </p>
              </div>
            </Link>

            <button
              type="button"
              onClick={() => setIsMenuOpen((currentValue) => !currentValue)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[color:var(--border)] bg-white text-[color:var(--foreground)] shadow-[0_10px_24px_rgba(15,23,42,0.04)] transition hover:border-[color:var(--accent)] hover:bg-[color:var(--panel)]"
              aria-label="Toggle navigation menu"
              aria-expanded={isMenuOpen}
            >
              <span className="flex flex-col gap-1.5">
                <span className="block h-0.5 w-4 rounded-full bg-current" />
                <span className="block h-0.5 w-4 rounded-full bg-current" />
                <span className="block h-0.5 w-4 rounded-full bg-current" />
              </span>
            </button>
          </div>

          {isMenuOpen ? (
            <div className="mt-4 space-y-4 rounded-[26px] border border-[color:var(--border)] bg-white/95 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] xl:hidden">
              <nav className="grid gap-2">
                {visibleNavigationItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/" && pathname.startsWith(item.href));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
                        isActive
                          ? "bg-[linear-gradient(135deg,rgba(255,255,255,1),rgba(255,248,238,1))] text-[color:var(--foreground)] ring-1 ring-[color:var(--accent)] shadow-[0_10px_24px_rgba(15,23,42,0.08)]"
                          : "bg-[color:var(--panel-strong)] text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              {isAuthenticated ? (
                <div className="space-y-3 border-t border-[color:var(--border)] pt-4">
                  <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel-strong)] px-4 py-3 text-sm text-[color:var(--muted)]">
                    Signed in as{" "}
                    <span className="font-semibold text-[color:var(--foreground)]">
                      {userName || "User"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 text-sm font-medium text-[color:var(--foreground)] transition hover:border-[color:var(--accent)] hover:bg-[color:var(--panel-strong)]"
                  >
                    Logout
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="hidden xl:flex xl:flex-row xl:items-center xl:justify-between xl:gap-4">
            <Link href="/" className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(20,33,61,1),rgba(37,67,132,0.95))] text-sm font-semibold text-white shadow-[0_12px_30px_rgba(15,23,42,0.25)]">
                AI
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[color:var(--muted)]">
                  Personal productivity
                </p>
                <p className="text-xl font-semibold tracking-[-0.03em] text-[color:var(--foreground)]">
                  AI Life OS
                </p>
              </div>
            </Link>

            <div className="flex flex-col gap-3 xl:items-end">
              <nav className="scrollbar-none flex overflow-x-auto rounded-full border border-[color:var(--border)] bg-white/92 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                {visibleNavigationItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/" && pathname.startsWith(item.href));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                        isActive
                          ? "bg-[linear-gradient(135deg,rgba(255,255,255,1),rgba(255,248,238,1))] text-[color:var(--foreground)] shadow-[0_10px_24px_rgba(15,23,42,0.1)] ring-1 ring-[color:var(--accent)]"
                          : "text-[color:var(--muted)] hover:bg-white hover:text-[color:var(--foreground)]"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              {isAuthenticated ? (
                <div className="flex flex-wrap items-center gap-2">
                  <div className="rounded-full border border-[color:var(--border)] bg-white px-4 py-2 text-sm text-[color:var(--muted)] shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                    Signed in as{" "}
                    <span className="font-semibold text-[color:var(--foreground)]">
                      {userName || "User"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-full border border-[color:var(--border)] bg-white px-4 py-2 text-sm font-medium text-[color:var(--foreground)] transition hover:border-[color:var(--accent)] hover:bg-[color:var(--panel-strong)]"
                  >
                    Logout
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <main className="page-shell pt-6 sm:pt-8">{children}</main>
    </div>
  );
}

export { AppFrame };
