"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { EmptyState } from "@/components/empty-state";
import { SectionCard } from "@/components/section-card";
import { SectionShell } from "@/components/section-shell";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { useAuthSession } from "@/hooks/use-auth-session";
import { ApiError, apiRequest } from "@/lib/api";
import { clearAuthSession } from "@/lib/auth";
import type { CollectionResponse, Goal, Note, Task } from "@/lib/types";

type DashboardState = {
  tasks: Task[];
  notes: Note[];
  goals: Goal[];
};

export default function DashboardPage() {
  const router = useRouter();
  const { token, user, isLoadingSession } = useAuthSession({
    requireAuth: true,
  });
  const [dashboard, setDashboard] = useState<DashboardState>({
    tasks: [],
    notes: [],
    goals: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (typeof token !== "string") {
      return;
    }

    const authToken = token;

    async function loadDashboard() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const [tasksResponse, notesResponse, goalsResponse] = await Promise.all([
          apiRequest<CollectionResponse<Task[]>>("/tasks", { token: authToken }),
          apiRequest<CollectionResponse<Note[]>>("/notes", { token: authToken }),
          apiRequest<CollectionResponse<Goal[]>>("/goals", { token: authToken }),
        ]);

        setDashboard({
          tasks: tasksResponse.data,
          notes: notesResponse.data,
          goals: goalsResponse.data,
        });
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          clearAuthSession();
          router.replace("/login");
          return;
        }

        setErrorMessage(
          error instanceof Error ? error.message : "Unable to load dashboard"
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboard();
  }, [router, token]);

  const completedTasks = dashboard.tasks.filter((task) => task.completed).length;
  const openTasks = dashboard.tasks.length - completedTasks;
  const completionRate =
    dashboard.tasks.length === 0
      ? 0
      : Math.round((completedTasks / dashboard.tasks.length) * 100);

  return (
    <SectionShell
      eyebrow="Phase 1 Dashboard"
      title="Dashboard"
      description={
        user
          ? `Welcome back, ${user.name}. Here is a focused snapshot of your current productivity system.`
          : "Your personal productivity overview."
      }
      meta={["Real-time API data", "Tasks, notes, goals", "Personal workspace"]}
      action={
        <div className="flex flex-wrap gap-2">
          <Link
            href="/tasks"
            className="rounded-full bg-[color:var(--foreground)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[color:var(--accent-strong)]"
          >
            Open tasks
          </Link>
          <Link
            href="/notes"
            className="rounded-full border border-[color:var(--border)] bg-white/80 px-4 py-2 text-sm font-semibold text-[color:var(--foreground)] transition hover:border-[color:var(--accent)] hover:bg-white"
          >
            Open notes
          </Link>
        </div>
      }
    >
      {errorMessage ? (
        <div className="rounded-[24px] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="grid gap-4 md:grid-cols-2">
          <StatCard
            label="Total tasks"
            value={isLoadingSession || isLoading ? "..." : dashboard.tasks.length}
            helper={`${openTasks} tasks currently remain open.`}
          />
          <StatCard
            label="Completion rate"
            value={isLoadingSession || isLoading ? "..." : `${completionRate}%`}
            helper={`${completedTasks} completed tasks out of ${dashboard.tasks.length}.`}
            tone="accent"
          />
          <StatCard
            label="Saved notes"
            value={isLoadingSession || isLoading ? "..." : dashboard.notes.length}
            helper="Context, ideas, and useful references."
            tone="soft"
          />
          <StatCard
            label="Tracked goals"
            value={isLoadingSession || isLoading ? "..." : dashboard.goals.length}
            helper="Longer-term outcomes in your system."
          />
        </div>

        <SectionCard
          eyebrow="Focus summary"
          title={
            isLoadingSession || isLoading
              ? "Loading your workspace..."
              : dashboard.tasks.length === 0 &&
                dashboard.notes.length === 0 &&
                dashboard.goals.length === 0
              ? "Your workspace is currently empty."
              : completedTasks === dashboard.tasks.length &&
                dashboard.tasks.length > 0
              ? "Execution looks under control."
              : "Your next actions are visible and ready."
          }
          description={
            dashboard.tasks.length === 0
              ? "Start by adding one task or one goal so the dashboard has something concrete to track."
              : `${openTasks} tasks remain open. Keep notes near active work and use goals to anchor the bigger picture.`
          }
          tone="soft"
        >
          <div className="flex flex-wrap gap-2">
            <StatusBadge
              label={
                dashboard.tasks.length === 0
                  ? "No active workload yet"
                  : `${openTasks} open task${openTasks === 1 ? "" : "s"}`
              }
              tone={openTasks === 0 ? "success" : "warning"}
            />
            <StatusBadge
              label={`${dashboard.notes.length} note${
                dashboard.notes.length === 1 ? "" : "s"
              }`}
              tone="info"
            />
            <StatusBadge
              label={`${dashboard.goals.length} goal${
                dashboard.goals.length === 1 ? "" : "s"
              }`}
            />
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <SectionCard eyebrow="Recent tasks" tone="strong">
          <div className="space-y-3">
            {isLoadingSession || isLoading ? (
              <p className="text-sm text-[color:var(--muted)]">Loading tasks...</p>
            ) : dashboard.tasks.length === 0 ? (
              <EmptyState
                eyebrow="No tasks yet"
                title="Start your execution list"
                description="The dashboard is waiting for the first real task."
                tip="Open the tasks page and add one clear next step."
              />
            ) : (
              dashboard.tasks.slice(0, 3).map((task) => (
                <div
                  key={task.id}
                  className="rounded-[22px] border border-[color:var(--border)] bg-white px-4 py-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-[color:var(--foreground)]">
                      {task.title}
                    </p>
                    <StatusBadge
                      label={task.completed ? "Completed" : "Open"}
                      tone={task.completed ? "success" : "warning"}
                    />
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                    {task.description || "No description added."}
                  </p>
                </div>
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard eyebrow="Recent notes">
          <div className="space-y-3">
            {isLoadingSession || isLoading ? (
              <p className="text-sm text-[color:var(--muted)]">Loading notes...</p>
            ) : dashboard.notes.length === 0 ? (
              <EmptyState
                eyebrow="No notes yet"
                title="Capture useful context"
                description="There is no written reference saved in this workspace."
                tip="Add a note for an idea, meeting summary, or planning context."
              />
            ) : (
              dashboard.notes.slice(0, 3).map((note) => (
                <div
                  key={note.id}
                  className="rounded-[22px] border border-[color:var(--border)] bg-white px-4 py-4"
                >
                  <p className="font-semibold text-[color:var(--foreground)]">
                    {note.title}
                  </p>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-[color:var(--muted)]">
                    {note.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard eyebrow="Recent goals" tone="soft">
          <div className="space-y-3">
            {isLoadingSession || isLoading ? (
              <p className="text-sm text-[color:var(--muted)]">Loading goals...</p>
            ) : dashboard.goals.length === 0 ? (
              <EmptyState
                eyebrow="No goals yet"
                title="Add a bigger outcome"
                description="There are no longer-horizon targets defined yet."
                tip="Create one meaningful goal to give your daily work direction."
              />
            ) : (
              dashboard.goals.slice(0, 3).map((goal) => (
                <div
                  key={goal.id}
                  className="rounded-[22px] border border-[color:var(--border)] bg-white px-4 py-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-[color:var(--foreground)]">
                      {goal.title}
                    </p>
                    <StatusBadge
                      label={goal.completed ? "Completed" : "Active"}
                      tone={goal.completed ? "success" : "info"}
                    />
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                    {goal.description || "No description added."}
                  </p>
                </div>
              ))
            )}
          </div>
        </SectionCard>
      </div>
    </SectionShell>
  );
}
