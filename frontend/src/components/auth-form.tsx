"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { SectionCard } from "@/components/section-card";
import { StatusBadge } from "@/components/status-badge";
import { apiRequest } from "@/lib/api";
import { type AuthResponse, getAuthToken, saveAuthSession } from "@/lib/auth";

type AuthFormProps = {
  mode: "login" | "register";
};

const contentByMode = {
  login: {
    title: "Welcome back",
    subtitle:
      "Sign in to continue managing tasks, notes, goals, and your daily dashboard.",
    submitLabel: "Login",
    switchCopy: "Don't have an account yet?",
    switchHref: "/register",
    switchLabel: "Create account",
    highlight: "Fast access to your personal workspace",
  },
  register: {
    title: "Create your account",
    subtitle:
      "Start your AI Life OS workspace with a clean system for planning and execution.",
    submitLabel: "Create account",
    switchCopy: "Already have an account?",
    switchHref: "/login",
    switchLabel: "Login",
    highlight: "Get set up in under a minute",
  },
} as const;

function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const content = contentByMode[mode];
  const isRegister = mode === "register";

  useEffect(() => {
    if (getAuthToken()) {
      router.replace("/dashboard");
    }
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const response = await apiRequest<AuthResponse>(`/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify(
          isRegister
            ? { name, email, password }
            : {
                email,
                password,
              }
        ),
      });

      saveAuthSession(response.data.token, response.data.user);
      router.push("/dashboard");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to continue"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <SectionCard
        eyebrow={isRegister ? "Account setup" : "Authentication"}
        title={content.title}
        description={content.subtitle}
        tone="strong"
      >
        <div className="mb-5">
          <StatusBadge label={content.highlight} tone="info" />
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {isRegister ? (
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[color:var(--foreground)]">
                Full name
              </span>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Abhishek Gautam"
                className="w-full rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 text-[color:var(--foreground)] outline-none transition placeholder:text-[color:var(--muted)] focus:border-[color:var(--accent)] focus:ring-4 focus:ring-[rgba(217,119,6,0.12)]"
                required
              />
            </label>
          ) : null}

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[color:var(--foreground)]">
              Email address
            </span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 text-[color:var(--foreground)] outline-none transition placeholder:text-[color:var(--muted)] focus:border-[color:var(--accent)] focus:ring-4 focus:ring-[rgba(217,119,6,0.12)]"
              required
            />
          </label>

          <label className="block">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="block text-sm font-medium text-[color:var(--foreground)]">
                Password
              </span>
              <span className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                Minimum 6 characters
              </span>
            </div>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 6 characters"
              className="w-full rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 text-[color:var(--foreground)] outline-none transition placeholder:text-[color:var(--muted)] focus:border-[color:var(--accent)] focus:ring-4 focus:ring-[rgba(217,119,6,0.12)]"
              minLength={6}
              required
            />
          </label>

          {errorMessage ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-[linear-gradient(135deg,rgba(20,33,61,1),rgba(33,58,108,0.94))] px-4 py-3 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(15,23,42,0.18)] transition hover:translate-y-[-1px] hover:bg-[linear-gradient(135deg,rgba(180,83,9,1),rgba(217,119,6,0.96))] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Please wait..." : content.submitLabel}
          </button>
        </form>
      </SectionCard>

      <div className="space-y-6">
        <SectionCard
          eyebrow="Why this matters"
          title="A lightweight, dependable auth flow"
          description="The product keeps authentication simple so the experience stays quick and easy to understand."
        >
          <ul className="space-y-3 text-sm leading-6 text-[color:var(--muted)]">
            <li>Email and password only, no extra setup friction</li>
            <li>JWT stored locally for fast browser sessions</li>
            <li>Redirect into the product immediately after success</li>
          </ul>
        </SectionCard>

        <SectionCard
          eyebrow="Continue"
          title={isRegister ? "Already set up?" : "Need an account?"}
          description={content.switchCopy}
          tone="soft"
        >
          <Link
            href={content.switchHref}
            className="inline-flex rounded-full border border-[color:var(--border)] bg-white px-4 py-2 text-sm font-semibold text-[color:var(--foreground)] transition hover:border-[color:var(--accent)] hover:bg-[color:var(--panel-strong)]"
          >
            {content.switchLabel}
          </Link>
        </SectionCard>
      </div>
    </div>
  );
}

export { AuthForm };
