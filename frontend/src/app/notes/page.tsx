"use client";

import { FormEvent, useEffect, useState } from "react";
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
  Note,
} from "@/lib/types";

type NoteItem = Note & {
  _optimistic?: boolean;
};

const emptyForm = {
  title: "",
  content: "",
};

export default function NotesPage() {
  const router = useRouter();
  const { token, user, isLoadingSession } = useAuthSession({
    requireAuth: true,
  });
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [formData, setFormData] = useState(emptyForm);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!token) {
      return;
    }

    loadNotes();
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

  async function loadNotes(options?: { silent?: boolean }) {
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
      const response = await apiRequest<CollectionResponse<Note[]>>("/notes", {
        token: authToken,
      });

      setNotes(response.data);
    } catch (error) {
      handleApiFailure(error, "Unable to load notes");
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
    const trimmedContent = formData.content.trim();

    if (!trimmedTitle || !trimmedContent) {
      setErrorMessage("Title and content are required");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    const previousNotes = notes;

    try {
      if (editingNoteId) {
        const existingNote = notes.find((note) => note.id === editingNoteId);

        if (!existingNote) {
          setErrorMessage("Note not found");
          setIsSubmitting(false);
          return;
        }

        const optimisticNote: NoteItem = {
          ...existingNote,
          title: trimmedTitle,
          content: trimmedContent,
          updatedAt: new Date().toISOString(),
          _optimistic: true,
        };

        setNotes((currentNotes) =>
          currentNotes.map((note) =>
            note.id === editingNoteId ? optimisticNote : note
          )
        );

        setFormData(emptyForm);
        setEditingNoteId(null);

        const response = await apiRequest<MutationResponse<Note>>(
          `/notes/${editingNoteId}`,
          {
            method: "PUT",
            token: authToken,
            body: JSON.stringify({
              title: trimmedTitle,
              content: trimmedContent,
            }),
          }
        );

        setNotes((currentNotes) =>
          currentNotes.map((note) =>
            note.id === editingNoteId ? response.data : note
          )
        );
        setSuccessMessage("Note updated successfully.");
      } else {
        const tempId = `temp-note-${Date.now()}`;
        const optimisticNote: NoteItem = {
          id: tempId,
          title: trimmedTitle,
          content: trimmedContent,
          userId: user?.id || "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          _optimistic: true,
        };

        setNotes((currentNotes) => [optimisticNote, ...currentNotes]);
        setFormData(emptyForm);

        const response = await apiRequest<MutationResponse<Note>>("/notes", {
          method: "POST",
          token: authToken,
          body: JSON.stringify({
            title: trimmedTitle,
            content: trimmedContent,
          }),
        });

        setNotes((currentNotes) =>
          currentNotes.map((note) => (note.id === tempId ? response.data : note))
        );
        setSuccessMessage("Note created successfully.");
      }
    } catch (error) {
      setNotes(previousNotes);
      handleApiFailure(error, "Unable to save note");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(note: NoteItem) {
    if (typeof token !== "string" || note._optimistic) {
      return;
    }

    const shouldDelete = window.confirm(
      `Delete "${note.title}"? This action cannot be undone.`
    );

    if (!shouldDelete) {
      return;
    }

    const authToken = token;
    const previousNotes = notes;
    const previousForm = formData;
    const wasEditingDeletedNote = editingNoteId === note.id;

    setErrorMessage("");
    setSuccessMessage("");
    setNotes((currentNotes) =>
      currentNotes.filter((currentNote) => currentNote.id !== note.id)
    );

    if (wasEditingDeletedNote) {
      setEditingNoteId(null);
      setFormData(emptyForm);
    }

    try {
      await apiRequest<MessageResponse>(`/notes/${note.id}`, {
        method: "DELETE",
        token: authToken,
      });

      setSuccessMessage("Note deleted successfully.");
    } catch (error) {
      setNotes(previousNotes);

      if (wasEditingDeletedNote) {
        setEditingNoteId(note.id);
        setFormData(previousForm);
      }

      handleApiFailure(error, "Unable to delete note");
    }
  }

  function startEdit(note: NoteItem) {
    if (note._optimistic) {
      return;
    }

    setEditingNoteId(note.id);
    setFormData({
      title: note.title,
      content: note.content,
    });
    setErrorMessage("");
  }

  function cancelEdit() {
    setEditingNoteId(null);
    setFormData(emptyForm);
  }

  return (
    <SectionShell
      eyebrow="Phase 1 Notes"
      title="Notes"
      description={
        user
          ? `${user.name}, capture ideas, summaries, and useful context in one place.`
          : "Manage your notes."
      }
      meta={["Live CRUD", "Optimistic updates", "Quick capture"]}
    >
      {successMessage ? (
        <FeedbackBanner tone="success" message={successMessage} />
      ) : null}

      {errorMessage ? (
        <FeedbackBanner tone="error" message={errorMessage} />
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard
            label="Saved notes"
            value={notes.length}
            helper="Reusable context captured in this workspace."
          />
          <StatCard
            label="Current state"
            value={notes.length > 0 ? "Active" : "Empty"}
            helper="Use notes for ideas, references, and planning material."
            tone="soft"
          />
        </div>

        <SectionCard
          eyebrow="Writing rules"
          title="Capture context you do not want to reconstruct"
          description="Keep titles clear and content practical so notes stay useful over time."
          tone="soft"
        >
          <ul className="space-y-2 text-sm leading-6 text-[color:var(--muted)]">
            <li>Use the title like a strong subject line.</li>
            <li>Keep one note per topic, meeting, or idea.</li>
            <li>Edit and refine important notes instead of duplicating them.</li>
          </ul>
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <SectionCard
          eyebrow={editingNoteId ? "Edit note" : "Add a note"}
          title={
            editingNoteId ? "Update the selected note" : "Capture new context"
          }
          description="Write only what is useful. The best notes are easy to scan later."
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
                placeholder="Weekly planning notes"
                className="w-full rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 outline-none transition focus:border-[color:var(--accent)] focus:ring-4 focus:ring-[rgba(217,119,6,0.12)]"
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[color:var(--foreground)]">
                Content
              </span>
              <textarea
                value={formData.content}
                onChange={(event) =>
                  setFormData((currentForm) => ({
                    ...currentForm,
                    content: event.target.value,
                  }))
                }
                placeholder="Write your note here..."
                rows={8}
                className="w-full rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 outline-none transition focus:border-[color:var(--accent)] focus:ring-4 focus:ring-[rgba(217,119,6,0.12)]"
                required
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
                  : editingNoteId
                    ? "Update note"
                    : "Create note"}
              </button>

              {editingNoteId ? (
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
          eyebrow="Your notes"
          title={`${notes.length} note${notes.length === 1 ? "" : "s"} saved`}
          description="Keep reference material clean and easy to review."
          action={
            <button
              type="button"
              onClick={() => loadNotes({ silent: true })}
              disabled={isRefreshing}
              className="rounded-full border border-[color:var(--border)] bg-white px-4 py-2 text-sm font-medium text-[color:var(--foreground)] transition hover:border-[color:var(--accent)] hover:bg-[color:var(--panel)] disabled:opacity-70"
            >
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </button>
          }
        >
          <div className="space-y-4">
            {isLoadingSession || isLoading ? (
              <LoadingCardList count={3} lines={4} />
            ) : notes.length === 0 ? (
              <EmptyState
                eyebrow="No notes yet"
                title="Start building your reference layer"
                description="There is no written context in this workspace yet."
                tip="Create one note for your current focus, meeting, or planning session."
              />
            ) : (
              notes.map((note) => (
                <div
                  key={note.id}
                  className={`rounded-[24px] border border-[color:var(--border)] bg-white px-5 py-5 transition ${
                    note._optimistic ? "opacity-70" : ""
                  }`}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xl font-semibold tracking-[-0.03em] text-[color:var(--foreground)]">
                          {note.title}
                        </p>
                        {note._optimistic ? (
                          <StatusBadge label="Saving" tone="info" />
                        ) : null}
                      </div>
                      <p className="whitespace-pre-wrap text-sm leading-6 text-[color:var(--muted)]">
                        {note.content}
                      </p>
                      <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                        Updated {new Date(note.updatedAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 lg:max-w-[200px] lg:justify-end">
                      <button
                        type="button"
                        onClick={() => startEdit(note)}
                        disabled={Boolean(note._optimistic)}
                        className="rounded-full border border-[color:var(--border)] bg-white px-4 py-2 text-sm font-medium text-[color:var(--foreground)] transition hover:border-[color:var(--accent)] hover:bg-[color:var(--panel)] disabled:opacity-60"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(note)}
                        disabled={Boolean(note._optimistic)}
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
