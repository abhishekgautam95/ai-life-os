"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { EmptyState } from "@/components/empty-state";
import { FeedbackBanner } from "@/components/feedback-banner";
import { LoadingCardList } from "@/components/loading-card-list";
import { SectionCard } from "@/components/section-card";
import { SectionShell } from "@/components/section-shell";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { useAuthSession } from "@/hooks/use-auth-session";
import { ApiError, apiRequest } from "@/lib/api";
import { clearAuthSession } from "@/lib/auth";
import type {
  CollectionResponse,
  Goal,
  MessageResponse,
  MutationResponse,
} from "@/lib/types";

type GoalItem = Goal & {
  _optimistic?: boolean;
};

const emptyForm = {
  title: "",
  description: "",
};

export default function GoalsPage() {
  const router = useRouter();
  const { token, user, isLoadingSession } = useAuthSession({
    requireAuth: true,
  });
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [formData, setFormData] = useState(emptyForm);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!token) {
      return;
    }

    loadGoals();
  }, [token]);

  useEffect(() => {
    if (!successMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setSuccessMessage("");
    }, 2600);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [successMessage]);

  async function loadGoals(options?: { silent?: boolean }) {
    if (typeof token !== "string") {
      return;
    }

    const authToken = token;

    if (options?.silent) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    setErrorMessage("");

    try {
      const response = await apiRequest<CollectionResponse<Goal[]>>("/goals", {
        token: authToken,
      });

      setGoals(response.data);
    } catch (error) {
      handleApiFailure(error, "Unable to load goals");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  function handleApiFailure(error: unknown, fallbackMessage: string) {
    if (error instanceof ApiError && error.status === 401) {
      clearAuthSession();
      router.replace("/login");
      return;
    }

    setErrorMessage(error instanceof Error ? error.message : fallbackMessage);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (typeof token !== "string") {
      return;
    }

    const authToken = token;
    const trimmedTitle = formData.title.trim();

    if (!trimmedTitle) {
      setErrorMessage("Goal title is required");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    const previousGoals = goals;

    try {
      if (editingGoalId) {
        const existingGoal = goals.find((goal) => goal.id === editingGoalId);

        if (!existingGoal) {
          setErrorMessage("Goal not found");
          setIsSubmitting(false);
          return;
        }

        const optimisticGoal: GoalItem = {
          ...existingGoal,
          title: trimmedTitle,
          description: formData.description.trim() || null,
          updatedAt: new Date().toISOString(),
          _optimistic: true,
        };

        setGoals((currentGoals) =>
          currentGoals.map((goal) =>
            goal.id === editingGoalId ? optimisticGoal : goal
          )
        );

        setFormData(emptyForm);
        setEditingGoalId(null);

        const response = await apiRequest<MutationResponse<Goal>>(
          `/goals/${editingGoalId}`,
          {
            method: "PUT",
            token: authToken,
            body: JSON.stringify({
              title: trimmedTitle,
              description: formData.description.trim(),
            }),
          }
        );

        setGoals((currentGoals) =>
          currentGoals.map((goal) =>
            goal.id === editingGoalId ? response.data : goal
          )
        );
        setSuccessMessage("Goal updated successfully.");
      } else {
        const tempId = `temp-goal-${Date.now()}`;
        const optimisticGoal: GoalItem = {
          id: tempId,
          title: trimmedTitle,
          description: formData.description.trim() || null,
          completed: false,
          userId: user?.id || "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          _optimistic: true,
        };

        setGoals((currentGoals) => [optimisticGoal, ...currentGoals]);
        setFormData(emptyForm);

        const response = await apiRequest<MutationResponse<Goal>>("/goals", {
          method: "POST",
          token: authToken,
          body: JSON.stringify({
            title: trimmedTitle,
            description: formData.description.trim(),
            completed: false,
          }),
        });

        setGoals((currentGoals) =>
          currentGoals.map((goal) => (goal.id === tempId ? response.data : goal))
        );
        setSuccessMessage("Goal created successfully.");
      }
    } catch (error) {
      setGoals(previousGoals);
      handleApiFailure(error, "Unable to save goal");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleCompleted(goal: GoalItem) {
    if (typeof token !== "string" || goal._optimistic) {
      return;
    }

    const authToken = token;
    const previousGoals = goals;
    const optimisticGoal: GoalItem = {
      ...goal,
      completed: !goal.completed,
      updatedAt: new Date().toISOString(),
      _optimistic: true,
    };

    setErrorMessage("");
    setSuccessMessage("");
    setGoals((currentGoals) =>
      currentGoals.map((currentGoal) =>
        currentGoal.id === goal.id ? optimisticGoal : currentGoal
      )
    );

    try {
      const response = await apiRequest<MutationResponse<Goal>>(
        `/goals/${goal.id}`,
        {
          method: "PUT",
          token: authToken,
          body: JSON.stringify({
            title: goal.title,
            description: goal.description ?? "",
            completed: !goal.completed,
          }),
        }
      );

      setGoals((currentGoals) =>
        currentGoals.map((currentGoal) =>
          currentGoal.id === goal.id ? response.data : currentGoal
        )
      );
      setSuccessMessage(
        response.data.completed
          ? "Goal marked complete."
          : "Goal moved back to active."
      );
    } catch (error) {
      setGoals(previousGoals);
      handleApiFailure(error, "Unable to update goal");
    }
  }

  async function handleDelete(goal: GoalItem) {
    if (typeof token !== "string" || goal._optimistic) {
      return;
    }

    const shouldDelete = window.confirm(
      `Delete "${goal.title}"? This action cannot be undone.`
    );

    if (!shouldDelete) {
      return;
    }

    const authToken = token;
    const previousGoals = goals;
    const previousForm = formData;
    const wasEditingDeletedGoal = editingGoalId === goal.id;

    setErrorMessage("");
    setSuccessMessage("");
    setGoals((currentGoals) =>
      currentGoals.filter((currentGoal) => currentGoal.id !== goal.id)
    );

    if (wasEditingDeletedGoal) {
      setEditingGoalId(null);
      setFormData(emptyForm);
    }

    try {
      await apiRequest<MessageResponse>(`/goals/${goal.id}`, {
        method: "DELETE",
        token: authToken,
      });

      setSuccessMessage("Goal deleted successfully.");
    } catch (error) {
      setGoals(previousGoals);

      if (wasEditingDeletedGoal) {
        setEditingGoalId(goal.id);
        setFormData(previousForm);
      }

      handleApiFailure(error, "Unable to delete goal");
    }
  }

  function startEdit(goal: GoalItem) {
    if (goal._optimistic) {
      return;
    }

    setEditingGoalId(goal.id);
    setFormData({
      title: goal.title,
      description: goal.description ?? "",
    });
    setErrorMessage("");
  }

  function cancelEdit() {
    setEditingGoalId(null);
    setFormData(emptyForm);
  }

  const activeCount = useMemo(
    () => goals.filter((goal) => !goal.completed).length,
    [goals]
  );
  const completedCount = goals.length - activeCount;

  return (
    <SectionShell
      eyebrow="Phase 1 Goals"
      title="Goals"
      description={
        user
          ? `${user.name}, keep your bigger objectives visible and measurable.`
          : "Manage your goals."
      }
      meta={["Live CRUD", "Optimistic updates", "Outcome focused"]}
    >
      {successMessage ? (
        <FeedbackBanner tone="success" message={successMessage} />
      ) : null}

      {errorMessage ? (
        <FeedbackBanner tone="error" message={errorMessage} />
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Total goals"
            value={goals.length}
            helper="Bigger outcomes currently in your system."
          />
          <StatCard
            label="Active"
            value={activeCount}
            helper="Goals still in motion."
            tone="accent"
          />
          <StatCard
            label="Completed"
            value={completedCount}
            helper="Goals that are fully achieved."
            tone="soft"
          />
        </div>

        <SectionCard
          eyebrow="Goal rules"
          title="Write outcomes, not tiny actions"
          description="Goals should point at meaningful results. Use descriptions to define success."
          tone="soft"
        >
          <ul className="space-y-2 text-sm leading-6 text-[color:var(--muted)]">
            <li>Use the title for the outcome you want to reach.</li>
            <li>Use the description to define what success looks like.</li>
            <li>Only mark a goal complete when the outcome is truly achieved.</li>
          </ul>
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <SectionCard
          eyebrow={editingGoalId ? "Edit goal" : "Add a goal"}
          title={
            editingGoalId ? "Update the selected goal" : "Track a bigger outcome"
          }
          description="Goals keep the bigger direction visible while your tasks handle day-to-day execution."
          tone="strong"
        >
          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[color:var(--foreground)]">
                Title
              </span>
              <input
                type="text"
                value={formData.title}
                onChange={(event) =>
                  setFormData((currentForm) => ({
                    ...currentForm,
                    title: event.target.value,
                  }))
                }
                placeholder="Launch Phase 1 MVP"
                className="w-full rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 outline-none transition focus:border-[color:var(--accent)] focus:ring-4 focus:ring-[rgba(217,119,6,0.12)]"
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[color:var(--foreground)]">
                Description
              </span>
              <textarea
                value={formData.description}
                onChange={(event) =>
                  setFormData((currentForm) => ({
                    ...currentForm,
                    description: event.target.value,
                  }))
                }
                placeholder="Describe what success looks like"
                rows={5}
                className="w-full rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 outline-none transition focus:border-[color:var(--accent)] focus:ring-4 focus:ring-[rgba(217,119,6,0.12)]"
              />
            </label>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-full bg-[linear-gradient(135deg,rgba(20,33,61,1),rgba(33,58,108,0.94))] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(15,23,42,0.18)] transition hover:bg-[linear-gradient(135deg,rgba(180,83,9,1),rgba(217,119,6,0.96))] disabled:opacity-70"
              >
                {isSubmitting
                  ? "Saving..."
                  : editingGoalId
                    ? "Update goal"
                    : "Create goal"}
              </button>

              {editingGoalId ? (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="rounded-full border border-[color:var(--border)] bg-white px-5 py-3 text-sm font-semibold text-[color:var(--foreground)] transition hover:border-[color:var(--accent)] hover:bg-[color:var(--panel)]"
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </form>
        </SectionCard>

        <SectionCard
          eyebrow="Your goals"
          title={`${completedCount} of ${goals.length} completed`}
          description="Keep the longer-term direction visible and up to date."
          action={
            <button
              type="button"
              onClick={() => loadGoals({ silent: true })}
              disabled={isRefreshing}
              className="rounded-full border border-[color:var(--border)] bg-white px-4 py-2 text-sm font-medium text-[color:var(--foreground)] transition hover:border-[color:var(--accent)] hover:bg-[color:var(--panel)] disabled:opacity-70"
            >
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </button>
          }
        >
          <div className="space-y-4">
            {isLoadingSession || isLoading ? (
              <LoadingCardList count={3} />
            ) : goals.length === 0 ? (
              <EmptyState
                eyebrow="No goals yet"
                title="Define one meaningful outcome"
                description="There are no longer-term targets in this workspace yet."
                tip="Add one bigger outcome you want to reach this month or quarter."
              />
            ) : (
              goals.map((goal) => (
                <div
                  key={goal.id}
                  className={`rounded-[24px] border border-[color:var(--border)] bg-white px-5 py-5 transition ${
                    goal._optimistic ? "opacity-70" : ""
                  }`}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xl font-semibold tracking-[-0.03em] text-[color:var(--foreground)]">
                          {goal.title}
                        </p>
                        <StatusBadge
                          label={goal.completed ? "Completed" : "Active"}
                          tone={goal.completed ? "success" : "info"}
                        />
                        {goal._optimistic ? (
                          <StatusBadge label="Saving" tone="info" />
                        ) : null}
                      </div>
                      <p className="text-sm leading-6 text-[color:var(--muted)]">
                        {goal.description || "No description added."}
                      </p>
                      <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                        Updated {new Date(goal.updatedAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 lg:max-w-[240px] lg:justify-end">
                      <button
                        type="button"
                        onClick={() => handleToggleCompleted(goal)}
                        disabled={Boolean(goal._optimistic)}
                        className="rounded-full border border-[color:var(--border)] bg-white px-4 py-2 text-sm font-medium text-[color:var(--foreground)] transition hover:border-[color:var(--accent)] hover:bg-[color:var(--panel)] disabled:opacity-60"
                      >
                        {goal.completed ? "Mark active" : "Mark done"}
                      </button>
                      <button
                        type="button"
                        onClick={() => startEdit(goal)}
                        disabled={Boolean(goal._optimistic)}
                        className="rounded-full border border-[color:var(--border)] bg-white px-4 py-2 text-sm font-medium text-[color:var(--foreground)] transition hover:border-[color:var(--accent)] hover:bg-[color:var(--panel)] disabled:opacity-60"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(goal)}
                        disabled={Boolean(goal._optimistic)}
                        className="rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-60"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </SectionCard>
      </div>
    </SectionShell>
  );
}
