"use client";

import Link from "next/link";

import { SectionCard } from "@/components/section-card";
import { SectionShell } from "@/components/section-shell";
import { StatCard } from "@/components/stat-card";
import { useAuthSession } from "@/hooks/use-auth-session";
import { navigationItems } from "@/lib/navigation";

export default function HomePage() {
  const { user, token } = useAuthSession();
  const isAuthenticated = typeof token === "string";

  const quickLinks = isAuthenticated
    ? [
        {
          href: "/dashboard",
          label: "Dashboard",
          description: "View metrics, recent activity, and current workload.",
        },
        {
          href: "/tasks",
          label: "Tasks",
          description: "Manage execution with fast updates and completion tracking.",
        },
        {
          href: "/notes",
          label: "Notes",
          description: "Capture context, summaries, and useful working references.",
        },
        {
          href: "/goals",
          label: "Goals",
          description: "Keep bigger outcomes visible while daily work moves forward.",
        },
      ]
    : [
        {
          href: "/register",
          label: "Create account",
          description: "Start your workspace and unlock the full product flow.",
        },
        {
          href: "/login",
          label: "Login",
          description: "Continue where you left off with your saved workspace.",
        },
      ];

  return (
    <SectionShell
      eyebrow="Phase 1 MVP"
      title="AI Life OS"
      description={
        isAuthenticated
          ? `Welcome back, ${user?.name || "there"}. Your personal workspace is live and connected to the backend. Use this page as a clean launchpad into your operating system.`
          : "A clean personal productivity app for tasks, notes, goals, and a lightweight dashboard."
      }
      meta={[
        "Authentication ready",
        "CRUD APIs connected",
        "Responsive web app",
      ]}
    >
      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <SectionCard
          eyebrow={isAuthenticated ? "Workspace launchpad" : "Product overview"}
          title={
            isAuthenticated
              ? "Start from the right surface."
              : "Simple structure. Real functionality."
          }
          description={
            isAuthenticated
              ? "Use the dashboard for summary, tasks for execution, notes for context, and goals for direction. The product is small by design, so every screen should feel immediately useful."
              : "AI Life OS stays intentionally small in Phase 1: reliable auth, clean CRUD, and enough structure to manage work without clutter."
          }
          tone="strong"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {quickLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-[22px] border border-[color:var(--border)] bg-white/92 px-4 py-4 shadow-[0_14px_40px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:border-[color:var(--accent)] hover:shadow-[0_20px_50px_rgba(15,23,42,0.08)]"
              >
                <p className="text-sm font-semibold tracking-[-0.02em] text-[color:var(--foreground)]">
                  {item.label}
                </p>
                <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                  {item.description}
                </p>
              </Link>
            ))}
          </div>

          {isAuthenticated ? (
            <div className="mt-5 grid gap-3 rounded-[24px] border border-[color:var(--border)] bg-white/72 p-4 sm:grid-cols-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">
                  Summary
                </p>
                <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                  Check the dashboard first to understand current load.
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">
                  Execution
                </p>
                <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                  Keep tasks clean and specific so the list stays actionable.
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">
                  Direction
                </p>
                <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                  Use notes and goals to preserve context and keep direction visible.
                </p>
              </div>
            </div>
          ) : null}
        </SectionCard>

        <div className="grid gap-4">
          <StatCard
            label="Current stage"
            value="MVP"
            helper="Phase 1 is focused on shipping the core workflow well."
            tone="accent"
          />
          <StatCard
            label="Status"
            value={isAuthenticated ? "Live" : "Ready"}
            helper={
              isAuthenticated
                ? "Signed-in routes are available from the navbar."
                : "Login to access the full productivity workflow."
            }
            tone="soft"
          />
          <SectionCard
            eyebrow="Product shape"
            title={isAuthenticated ? "A focused personal system" : "Built for a fast MVP"}
            description={
              isAuthenticated
                ? "The app is intentionally compact: fewer surfaces, clearer priorities, faster decisions."
                : "Start with auth, then move into dashboard, tasks, notes, and goals."
            }
          >
            <ul className="space-y-3 text-sm leading-6 text-[color:var(--muted)]">
              <li>Structured pages with reusable product UI components</li>
              <li>Loading, empty, and error states across key screens</li>
              <li>Clean responsive layout for desktop and mobile refinement</li>
            </ul>
          </SectionCard>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {navigationItems
          .filter((item) => {
            if (item.href === "/") {
              return false;
            }

            if (isAuthenticated) {
              return item.visibility !== "guest";
            }

            return item.visibility !== "user" || item.href === "/dashboard";
          })
          .map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-[24px] border border-[color:var(--border)] bg-white/88 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:border-[color:var(--accent)] hover:shadow-[0_24px_80px_rgba(15,23,42,0.1)]"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--muted)]">
                {item.label}
              </p>
              <p className="mt-3 text-lg font-semibold tracking-[-0.02em] text-[color:var(--foreground)]">
                Open {item.label}
              </p>
              <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                {item.description}
              </p>
            </Link>
          ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <SectionCard
          eyebrow="What is ready now"
          title="Core product foundation"
          description="The app already covers the most important Phase 1 functionality with a production-style structure."
          tone="soft"
        >
          <ul className="space-y-3 text-sm leading-6 text-[color:var(--muted)]">
            <li>JWT auth with working login and register flows</li>
            <li>Real dashboard metrics pulled from backend APIs</li>
            <li>Task, note, and goal management with live CRUD</li>
          </ul>
        </SectionCard>

        <SectionCard
          eyebrow="Next focus"
          title="What to refine next"
          description="The core experience is in place. Remaining work is product polish and QA."
        >
          <ul className="space-y-3 text-sm leading-6 text-[color:var(--muted)]">
            <li>Session persistence and protected-route refinement</li>
            <li>More advanced dashboard insights if needed</li>
            <li>Final mobile QA and deployment cleanup</li>
          </ul>
        </SectionCard>
      </div>
    </SectionShell>
  );
}
