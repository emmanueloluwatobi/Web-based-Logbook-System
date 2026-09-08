"use client";

import React, { useState } from "react";
import {
  Calendar,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  AlertTriangle,
  X,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import {
  createSession,
  updateSession,
  setActiveSession,
  deleteSession,
} from "@/actions/admin";

export interface SessionItem {
  id: string;
  label: string;
  isActive: boolean;
}

interface SessionListProps {
  initialSessions: SessionItem[];
}

export function SessionList({ initialSessions }: SessionListProps) {
  const [sessions] = useState<SessionItem[]>(initialSessions);

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<SessionItem | null>(null);
  const [deletingSession, setDeletingSession] = useState<SessionItem | null>(null);

  // Form states
  const [label, setLabel] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [activatingId, setActivatingId] = useState<string | null>(null);

  // Open Create Dialog
  const handleOpenCreate = () => {
    setLabel("");
    setIsActive(sessions.length === 0); // Default to active if it's the first session
    setFormError(null);
    setIsCreateOpen(true);
  };

  // Open Edit Dialog
  const handleOpenEdit = (sess: SessionItem) => {
    setLabel(sess.label);
    setIsActive(sess.isActive);
    setFormError(null);
    setEditingSession(sess);
  };

  // Submit Create
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!label.trim()) {
      setFormError("Session label is required (e.g. 2025/2026).");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await createSession({
        label: label.trim(),
        isActive,
      });

      if (!res.success) {
        setFormError(res.error || "Failed to create academic session.");
        toast.error(res.error || "Failed to create session");
        setIsSubmitting(false);
        return;
      }

      toast.success("Academic session created");
      setIsCreateOpen(false);
      setIsSubmitting(false);
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
      setIsSubmitting(false);
    }
  };

  // Submit Edit
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSession) return;
    setFormError(null);

    if (!label.trim()) {
      setFormError("Session label is required (e.g. 2025/2026).");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await updateSession({
        id: editingSession.id,
        label: label.trim(),
        isActive,
      });

      if (!res.success) {
        setFormError(res.error || "Failed to update academic session.");
        toast.error(res.error || "Failed to update session");
        setIsSubmitting(false);
        return;
      }

      toast.success("Academic session updated");
      setEditingSession(null);
      setIsSubmitting(false);
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
      setIsSubmitting(false);
    }
  };

  // Toggle Active
  const handleSetActive = async (id: string, currentLabel: string) => {
    try {
      setActivatingId(id);
      const res = await setActiveSession(id);
      if (!res.success) {
        toast.error(res.error || "Failed to set active session");
        setActivatingId(null);
        return;
      }

      toast.success(`${currentLabel} is now the active academic session`);
      setActivatingId(null);
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
      setActivatingId(null);
    }
  };

  // Submit Delete
  const handleDelete = async () => {
    if (!deletingSession) return;

    try {
      setIsSubmitting(true);
      const res = await deleteSession(deletingSession.id);
      if (!res.success) {
        toast.error(res.error || "Failed to delete academic session");
        setIsSubmitting(false);
        return;
      }

      toast.success("Academic session deleted");
      setDeletingSession(null);
      setIsSubmitting(false);
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-on-surface">
            Academic Sessions
          </h1>
          <p className="font-sans text-sm text-on-surface-variant mt-0.5">
            Define university SIWES academic years. Only one session can be active at a time.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-on-primary text-sm font-medium hover:bg-primary-container active:scale-[0.98] transition-all shadow-xs"
        >
          <Plus className="size-4" />
          <span>New Session</span>
        </button>
      </div>

      {/* Main Table Card */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden shadow-xs">
        {sessions.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-12 h-12 rounded-xl bg-surface-container-low text-primary flex items-center justify-center mx-auto mb-3">
              <Calendar className="size-6" />
            </div>
            <h3 className="font-heading text-base font-semibold text-on-surface">
              No academic sessions configured
            </h3>
            <p className="text-xs text-on-surface-variant max-w-sm mx-auto mt-1 mb-6">
              Create an academic session (e.g. 2025/2026) to anchor student SIWES placements and logbook periods.
            </p>
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-on-primary text-sm font-medium hover:bg-primary-container transition-all"
            >
              <Plus className="size-4" />
              <span>Create First Session</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/70 bg-surface-container-low/40">
                  <th className="py-3 px-6 text-xs font-semibold text-on-surface-variant uppercase tracking-wider font-heading">
                    Session Label
                  </th>
                  <th className="py-3 px-6 text-xs font-semibold text-on-surface-variant uppercase tracking-wider font-heading">
                    Status
                  </th>
                  <th className="py-3 px-6 text-xs font-semibold text-on-surface-variant uppercase tracking-wider font-heading text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40">
                {sessions.map((sess) => (
                  <tr
                    key={sess.id}
                    className="hover:bg-surface-container-low transition-colors text-sm"
                  >
                    <td className="py-4 px-6 font-medium text-on-surface">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0">
                          <Calendar className="size-4" />
                        </div>
                        <span className="font-heading text-base font-semibold">
                          {sess.label}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {sess.isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success-container text-on-success-container text-xs font-medium">
                          <CheckCircle2 className="size-3.5" />
                          <span>Active Session</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container text-on-surface-variant text-xs font-medium">
                          <Clock className="size-3.5" />
                          <span>Archived / Inactive</span>
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="inline-flex items-center gap-2">
                        {!sess.isActive && (
                          <button
                            onClick={() => handleSetActive(sess.id, sess.label)}
                            disabled={activatingId === sess.id}
                            className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-md bg-surface-container-low hover:bg-surface-container border border-outline-variant/60 text-primary transition-colors disabled:opacity-50"
                            title="Set as currently active academic session"
                          >
                            {activatingId === sess.id ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : (
                              <Sparkles className="size-3" />
                            )}
                            <span>Set Active</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEdit(sess)}
                          className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-md transition-colors"
                          title="Edit session"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          onClick={() => setDeletingSession(sess)}
                          disabled={sess.isActive}
                          className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error-container/20 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title={sess.isActive ? "Cannot delete active session" : "Delete session"}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE DIALOG MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-outline-variant">
              <h2 className="font-heading text-lg font-semibold text-on-surface">
                Create Academic Session
              </h2>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1 text-on-surface-variant hover:text-on-surface rounded-md"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 pt-4">
              {formError && (
                <div className="p-3 rounded-lg bg-error-container/40 border border-error/30 text-xs text-on-error-container flex items-start gap-2">
                  <AlertTriangle className="size-4 shrink-0 text-error mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant font-heading mb-1.5">
                  Session Label *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2025/2026"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="w-full h-10 px-3 text-sm rounded-md bg-surface-container-lowest border border-outline-variant text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-medium text-on-surface">
                    Set as active session immediately
                  </span>
                </label>
                <p className="text-[11px] text-on-surface-variant mt-1 pl-6">
                  Making this session active will automatically deactivate all other sessions.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-md border border-outline-variant bg-surface-container-lowest text-on-surface text-sm font-medium hover:bg-surface-container-low transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-on-primary text-sm font-medium hover:bg-primary-container active:scale-[0.98] transition-all disabled:opacity-50 shadow-xs"
                >
                  {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                  <span>Create Session</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT DIALOG MODAL */}
      {editingSession && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-outline-variant">
              <h2 className="font-heading text-lg font-semibold text-on-surface">
                Edit Academic Session
              </h2>
              <button
                onClick={() => setEditingSession(null)}
                className="p-1 text-on-surface-variant hover:text-on-surface rounded-md"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleEdit} className="space-y-4 pt-4">
              {formError && (
                <div className="p-3 rounded-lg bg-error-container/40 border border-error/30 text-xs text-on-error-container flex items-start gap-2">
                  <AlertTriangle className="size-4 shrink-0 text-error mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant font-heading mb-1.5">
                  Session Label *
                </label>
                <input
                  type="text"
                  required
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="w-full h-10 px-3 text-sm rounded-md bg-surface-container-lowest border border-outline-variant text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-medium text-on-surface">
                    Active academic session
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => setEditingSession(null)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-md border border-outline-variant bg-surface-container-lowest text-on-surface text-sm font-medium hover:bg-surface-container-low transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-on-primary text-sm font-medium hover:bg-primary-container active:scale-[0.98] transition-all disabled:opacity-50 shadow-xs"
                >
                  {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM DIALOG */}
      {deletingSession && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="w-11 h-11 rounded-xl bg-error-container text-on-error-container flex items-center justify-center mb-4">
              <AlertTriangle className="size-5 text-error" />
            </div>

            <h3 className="font-heading text-lg font-semibold text-on-surface">
              Delete Academic Session
            </h3>
            <p className="text-sm text-on-surface-variant mt-2">
              Are you sure you want to delete session <span className="font-semibold text-on-surface">{deletingSession.label}</span>?
            </p>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-outline-variant">
              <button
                type="button"
                onClick={() => setDeletingSession(null)}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-md border border-outline-variant bg-surface-container-lowest text-on-surface text-sm font-medium hover:bg-surface-container-low transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-error text-on-error text-sm font-medium hover:bg-error/90 active:scale-[0.98] transition-all disabled:opacity-50 shadow-xs"
              >
                {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                <span>Delete Session</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
