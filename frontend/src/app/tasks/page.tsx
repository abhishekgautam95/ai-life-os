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
  MessageResponse,
  MutationResponse,
  Task,
} from "@/lib/types";

type TaskItem = Task & {
  _optimistic?: boolean;
};

const emptyForm = {
  title: "",
  description: "",
};

export default function TasksPage() {
  const router = useRouter();
  const { token, user, isLoadingSession } = useAuthSession({
    requireAuth: true,
  });
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [formData, setFormData] = useState(emptyForm);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!token) {
      return;
    }

    loadTasks();
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

  async function loadTasks(options?: { silent?: boolean }) {
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
      const response = await apiRequest<CollectionResponse<Task[]>>("/tasks", {
        token: authToken,
      });

      setTasks(response.data);
    } catch (error) {
      handleApiFailure(error, "Unable to load tasks");
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

  function buildOptimisticTask(taskId: string, completed: boolean): TaskItem {
    return {
      id: taskId,
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      completed,
      userId: user?.id || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      _optimistic: true,
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (typeof token !== "string") {
      return;
    }

    const authToken = token;
    const trimmedTitle = formData.title.trim();

    if (!trimmedTitle) {
      setErrorMessage("Task title is required");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    const previousTasks = tasks;

    try {
      if (editingTaskId) {
        const existingTask = tasks.find((task) => task.id === editingTaskId);

        if (!existingTask) {
          setErrorMessage("Task not found");
          setIsSubmitting(false);
          return;
        }

        const optimisticTask: TaskItem = {
          ...existingTask,
          title: trimmedTitle,
          description: formData.description.trim() || null,
          updatedAt: new Date().toISOString(),
          _optimistic: true,
        };

        setTasks((currentTasks) =>
          currentTasks.map((task) =>
            task.id === editingTaskId ? optimisticTask : task
          )
        );

        setFormData(emptyForm);
        setEditingTaskId(null);

        const response = await apiRequest<MutationResponse<Task>>(
          `/tasks/${editingTaskId}`,
          {
            method: "PUT",
            token: authToken,
            body: JSON.stringify({
              title: trimmedTitle,
              description: formData.description.trim(),
            }),
          }
        );

        setTasks((currentTasks) =>
          currentTasks.map((task) =>
            task.id === editingTaskId ? response.data : task
          )
        );
        setSuccessMessage("Task updated successfully.");
      } else {
        const tempId = `temp-task-${Date.now()}`;
        const optimisticTask = buildOptimisticTask(tempId, false);

        setTasks((currentTasks) => [optimisticTask, ...currentTasks]);
        setFormData(emptyForm);

        const response = await apiRequest<MutationResponse<Task>>("/tasks", {
          method: "POST",
          token: authToken,
          body: JSON.stringify({
            title: trimmedTitle,
            description: formData.description.trim(),
            completed: false,
          }),
        });

        setTasks((currentTasks) =>
          currentTasks.map((task) => (task.id === tempId ? response.data : task))
        );
        setSuccessMessage("Task created successfully.");
      }
    } catch (error) {
      setTasks(previousTasks);
      handleApiFailure(error, "Unable to save task");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleCompleted(task: TaskItem) {
    if (typeof token !== "string" || task._optimistic) {
      return;
    }

    const authToken = token;
    const previousTasks = tasks;
    const optimisticTask: TaskItem = {
      ...task,
      completed: !task.completed,
      updatedAt: new Date().toISOString(),
      _optimistic: true,
    };

    setErrorMessage("");
    setSuccessMessage("");
    setTasks((currentTasks) =>
      currentTasks.map((currentTask) =>
        currentTask.id === task.id ? optimisticTask : currentTask
      )
    );

    try {
      const response = await apiRequest<MutationResponse<Task>>(
        `/tasks/${task.id}`,
        {
          method: "PUT",
          token: authToken,
          body: JSON.stringify({
            title: task.title,
            description: task.description ?? "",
            completed: !task.completed,
          }),
        }
      );

      setTasks((currentTasks) =>
        currentTasks.map((currentTask) =>
          currentTask.id === task.id ? response.data : currentTask
        )
      );
      setSuccessMessage(
        response.data.completed
          ? "Task marked complete."
          : "Task moved back to open."
      );
    } catch (error) {
      setTasks(previousTasks);
      handleApiFailure(error, "Unable to update task");
    }
  }

  async function handleDelete(task: TaskItem) {
    if (typeof token !== "string" || task._optimistic) {
      return;
    }

    const shouldDelete = window.confirm(
      `Delete "${task.title}"? This action cannot be undone.`
    );

    if (!shouldDelete) {
      return;
    }

    const authToken = token;
    const previousTasks = tasks;
    const previousForm = formData;
    const wasEditingDeletedTask = editingTaskId === task.id;

    setErrorMessage("");
    setSuccessMessage("");
    setTasks((currentTasks) =>
      currentTasks.filter((currentTask) => currentTask.id !== task.id)
    );

    if (wasEditingDeletedTask) {
      setEditingTaskId(null);
      setFormData(emptyForm);
    }

    try {
      await apiRequest<MessageResponse>(`/tasks/${task.id}`, {
        method: "DELETE",
        token: authToken,
      });

      setSuccessMessage("Task deleted successfully.");
    } catch (error) {
      setTasks(previousTasks);

      if (wasEditingDeletedTask) {
        setEditingTaskId(task.id);
        setFormData(previousForm);
      }

      handleApiFailure(error, "Unable to delete task");
    }
  }

  function startEdit(task: TaskItem) {
    if (task._optimistic) {
      return;
    }

    setEditingTaskId(task.id);
    setFormData({
      title: task.title,
      description: task.description ?? "",
    });
    setErrorMessage("");
  }

  function cancelEdit() {
    setEditingTaskId(null);
    setFormData(emptyForm);
  }

  const completedCount = useMemo(
    () => tasks.filter((task) => task.completed).length,
    [tasks]
  );
  const openCount = tasks.length - completedCount;

  return (
    <SectionShell
      eyebrow="Phase 1 Tasks"
      title="Tasks"
      description={
        user
          ? `${user.name}, keep your execution list clear, realistic, and easy to scan.`
          : "Manage your tasks."
      }
      meta={["Live CRUD", "Optimistic updates", "Scoped to current user"]}
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
            label="Total tasks"
            value={tasks.length}
            helper="Everything currently in your execution queue."
          />
          <StatCard
            label="Open"
            value={openCount}
            helper="Items that still need action."
            tone="accent"
          />
          <StatCard
            label="Completed"
            value={completedCount}
            helper="Tasks already closed out."
            tone="soft"
          />
        </div>

        <SectionCard
          eyebrow="Execution rules"
          title="Keep tasks short and actionable"
          description="Use titles for concrete next steps. Add descriptions only when the task needs context."
          tone="soft"
        >
          <ul className="space-y-2 text-sm leading-6 text-[color:var(--muted)]">
            <li>One task should represent one clear action.</li>
            <li>Mark done as soon as the task is genuinely complete.</li>
            <li>Edit and simplify old tasks instead of letting them pile up.</li>
          </ul>
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <SectionCard
          eyebrow={editingTaskId ? "Edit task" : "Add a task"}
          title={
            editingTaskId
              ? "Update the selected task"
              : "Capture the next thing to do"
          }
          description="This form stays intentionally simple so it is fast to use throughout the day."
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
                placeholder="Ship landing page"
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
                placeholder="Optional details for this task"
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
                  : editingTaskId
                    ? "Update task"
                    : "Create task"}
              </button>

              {editingTaskId ? (
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
          eyebrow="Your tasks"
          title={`${completedCount} of ${tasks.length} completed`}
          description="Review the list, update progress, and keep it current."
          action={
            <button
              type="button"
              onClick={() => loadTasks({ silent: true })}
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
            ) : tasks.length === 0 ? (
              <EmptyState
                eyebrow="No tasks yet"
                title="Start your execution list"
                description="Your task board is empty right now."
                tip="Add the single most important task you should do next."
              />
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className={`rounded-[24px] border border-[color:var(--border)] bg-white px-5 py-5 transition ${
                    task._optimistic ? "opacity-70" : ""
                  }`}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xl font-semibold tracking-[-0.03em] text-[color:var(--foreground)]">
                          {task.title}
                        </p>
                        <StatusBadge
                          label={task.completed ? "Completed" : "Open"}
                          tone={task.completed ? "success" : "warning"}
                        />
                        {task._optimistic ? (
                          <StatusBadge label="Saving" tone="info" />
                        ) : null}
                      </div>
                      <p className="text-sm leading-6 text-[color:var(--muted)]">
                        {task.description || "No description added."}
                      </p>
                      <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                        Updated {new Date(task.updatedAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 lg:max-w-[240px] lg:justify-end">
                      <button
                        type="button"
                        onClick={() => handleToggleCompleted(task)}
                        disabled={Boolean(task._optimistic)}
                        className="rounded-full border border-[color:var(--border)] bg-white px-4 py-2 text-sm font-medium text-[color:var(--foreground)] transition hover:border-[color:var(--accent)] hover:bg-[color:var(--panel)] disabled:opacity-60"
                      >
                        {task.completed ? "Mark open" : "Mark done"}
                      </button>
                      <button
                        type="button"
                        onClick={() => startEdit(task)}
                        disabled={Boolean(task._optimistic)}
                        className="rounded-full border border-[color:var(--border)] bg-white px-4 py-2 text-sm font-medium text-[color:var(--foreground)] transition hover:border-[color:var(--accent)] hover:bg-[color:var(--panel)] disabled:opacity-60"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(task)}
                        disabled={Boolean(task._optimistic)}
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
