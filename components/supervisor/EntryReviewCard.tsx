"use client";

import React, { useState } from "react";
import {
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  FileText,
  Sparkles,
  AlertCircle,
  Paperclip,
  Download,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { EntryStatusBadge } from "@/components/student/EntryStatusBadge";
import { approveEntry, rejectEntry } from "@/actions/review";

export interface ReviewEntryData {
  id: string;
  entryDate: string;
  activityDescription: string;
  skillsGained: string | null;
  challenges: string | null;
  hoursWorked: string;
  status: "draft" | "submitted" | "approved" | "rejected" | "needs_correction";
  versionNumber: number;
  parentEntryId: string | null;
  attachmentUrl: string | null;
  submittedAt: Date | null;
  feedback: {
    action: "approved" | "rejected";
    comment: string | null;
    supervisorName: string;
    createdAt: string;
  } | null;
}

interface EntryReviewCardProps {
  entry: ReviewEntryData;
  defaultExpanded?: boolean;
}

export function EntryReviewCard({
  entry,
  defaultExpanded = false,
}: EntryReviewCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectComment, setRejectComment] = useState("");
  const [commentError, setCommentError] = useState("");
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const hoursWorked = parseFloat(entry.hoursWorked) || 0;
  const isSubmitted = entry.status === "submitted";

  const formatDate = (dateStr: string): string => {
    try {
      const [year, month, day] = dateStr.split("-");
      const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatSubmittedAt = (date: Date | null): string => {
    if (!date) return "—";
    try {
      return new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "—";
    }
  };

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      const result = await approveEntry(entry.id);
      if (result.success) {
        toast.success("Entry approved", {
          description: `Logbook entry for ${formatDate(entry.entryDate)} has been approved.`,
        });
      } else {
        toast.error("Failed to approve", { description: result.error });
      }
    } catch {
      toast.error("An unexpected error occurred while approving.");
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectComment.trim()) {
      setCommentError("A rejection comment is required to help the student correct their entry.");
      return;
    }
    setCommentError("");
    setIsRejecting(true);
    try {
      const result = await rejectEntry(entry.id, rejectComment.trim());
      if (result.success) {
        toast.success("Correction requested", {
          description: `Entry returned to student with your feedback.`,
        });
        setShowRejectForm(false);
        setRejectComment("");
      } else {
        toast.error("Failed to reject", { description: result.error });
      }
    } catch {
      toast.error("An unexpected error occurred while rejecting.");
    } finally {
      setIsRejecting(false);
    }
  };

  const isActionInProgress = isApproving || isRejecting;

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-xs overflow-hidden transition-all hover:border-primary/30">
      {/* Collapsed Header Row — always visible */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left group"
      >
        <div className="flex items-center gap-4 min-w-0 flex-1">
          {/* Date chip */}
          <div className="shrink-0 flex items-center gap-1.5 text-xs font-medium text-on-surface">
            <Calendar className="size-3.5 text-on-surface-variant" />
            <span>{formatDate(entry.entryDate)}</span>
          </div>

          {/* Activity snippet */}
          <p className="text-xs text-on-surface-variant truncate min-w-0 flex-1 hidden sm:block">
            {entry.activityDescription.length > 80
              ? entry.activityDescription.slice(0, 80) + "…"
              : entry.activityDescription}
          </p>

          {/* Hours */}
          <div className="shrink-0 flex items-center gap-1 text-xs text-on-surface-variant">
            <Clock className="size-3.5" />
            <span className="font-mono font-medium">{hoursWorked.toFixed(1)}h</span>
          </div>

          {/* Version chip */}
          {entry.versionNumber > 1 && (
            <span className="shrink-0 px-1.5 py-0.5 rounded-sm bg-primary-fixed text-on-primary-fixed text-[10px] font-semibold tracking-wide font-heading">
              v{entry.versionNumber}
            </span>
          )}

          {/* Status badge */}
          <div className="shrink-0">
            <EntryStatusBadge status={entry.status} />
          </div>
        </div>

        {/* Expand/collapse chevron */}
        <div className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-on-surface-variant group-hover:bg-surface-container-low transition-colors">
          {isExpanded ? (
            <ChevronUp className="size-4" />
          ) : (
            <ChevronDown className="size-4" />
          )}
        </div>
      </button>

      {/* Expanded Detail Content */}
      {isExpanded && (
        <div className="px-5 pb-5 border-t border-outline-variant/60 space-y-5">
          {/* Submission metadata */}
          <div className="pt-4 flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-on-surface-variant">
            <span>
              Submitted: <span className="font-medium text-on-surface">{formatSubmittedAt(entry.submittedAt)}</span>
            </span>
            <span>
              Version: <span className="font-medium text-on-surface">{entry.versionNumber} {entry.versionNumber === 1 ? "(Initial)" : "(Revision)"}</span>
            </span>
            <span>
              Hours: <span className="font-mono font-medium text-on-surface">{hoursWorked.toFixed(1)}</span>
            </span>
          </div>

          {/* Activity Description */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-surface-container-low text-primary flex items-center justify-center">
                <FileText className="size-3.5" />
              </div>
              <h4 className="font-heading text-xs font-bold text-on-surface uppercase tracking-wider">
                Activity Description
              </h4>
            </div>
            <p className="text-sm text-on-surface font-sans leading-relaxed whitespace-pre-wrap pl-8">
              {entry.activityDescription}
            </p>
          </div>

          {/* Skills Gained */}
          {entry.skillsGained && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-surface-container-low text-primary flex items-center justify-center">
                  <Sparkles className="size-3.5" />
                </div>
                <h4 className="font-heading text-xs font-bold text-on-surface uppercase tracking-wider">
                  Skills & Knowledge Gained
                </h4>
              </div>
              <p className="text-sm text-on-surface font-sans leading-relaxed whitespace-pre-wrap pl-8">
                {entry.skillsGained}
              </p>
            </div>
          )}

          {/* Challenges */}
          {entry.challenges && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-surface-container-low text-primary flex items-center justify-center">
                  <AlertCircle className="size-3.5" />
                </div>
                <h4 className="font-heading text-xs font-bold text-on-surface uppercase tracking-wider">
                  Challenges Encountered
                </h4>
              </div>
              <p className="text-sm text-on-surface font-sans leading-relaxed whitespace-pre-wrap pl-8">
                {entry.challenges}
              </p>
            </div>
          )}

          {/* Attachment */}
          {entry.attachmentUrl && (
            <div className="pl-8">
              <a
                href={entry.attachmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-outline-variant/60 bg-surface-container-low/40 text-xs font-medium text-on-surface hover:border-primary/40 transition-colors"
              >
                <Paperclip className="size-3.5 text-on-surface-variant" />
                <span>View Attachment</span>
                <Download className="size-3 text-on-surface-variant" />
              </a>
            </div>
          )}

          {/* Previous Feedback (for non-submitted entries that already have feedback) */}
          {entry.feedback && (
            <div
              className={`rounded-xl border p-4 ${
                entry.feedback.action === "approved"
                  ? "bg-success-container/20 border-success/30"
                  : "bg-error-container/20 border-error/30"
              }`}
            >
              <div className="flex items-start gap-2.5">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    entry.feedback.action === "approved"
                      ? "bg-success-container text-on-success-container"
                      : "bg-error-container text-on-error-container"
                  }`}
                >
                  {entry.feedback.action === "approved" ? (
                    <CheckCircle2 className="size-3.5" />
                  ) : (
                    <AlertCircle className="size-3.5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-heading text-xs font-bold text-on-surface">
                      {entry.feedback.action === "approved" ? "Approved" : "Correction Requested"}
                    </p>
                    <span className="text-[11px] text-on-surface-variant">
                      by {entry.feedback.supervisorName}
                    </span>
                  </div>
                  {entry.feedback.comment && (
                    <p className="text-xs text-on-surface font-sans leading-relaxed mt-1.5 italic">
                      &ldquo;{entry.feedback.comment}&rdquo;
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons — only for submitted entries */}
          {isSubmitted && (
            <div className="pt-3 border-t border-outline-variant/60">
              {!showRejectForm ? (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={isActionInProgress}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container active:scale-[0.98] transition-all shadow-xs disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {isApproving ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="size-3.5" />
                    )}
                    <span>{isApproving ? "Approving…" : "Approve Entry"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowRejectForm(true)}
                    disabled={isActionInProgress}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-error text-on-error text-xs font-semibold hover:bg-error/90 active:scale-[0.98] transition-all shadow-xs disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <XCircle className="size-3.5" />
                    <span>Request Correction</span>
                  </button>
                </div>
              ) : (
                /* Inline Rejection Form */
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant font-heading mb-1.5">
                      Correction Comment <span className="text-error">*</span>
                    </label>
                    <textarea
                      value={rejectComment}
                      onChange={(e) => {
                        setRejectComment(e.target.value);
                        if (e.target.value.trim()) setCommentError("");
                      }}
                      placeholder="Explain what needs to be corrected so the student can revise their entry…"
                      rows={3}
                      className={`w-full p-3 text-sm rounded-lg bg-surface-container-lowest border text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-y ${
                        commentError
                          ? "border-error"
                          : "border-outline-variant"
                      }`}
                    />
                    {commentError && (
                      <p className="text-xs text-error mt-1 flex items-center gap-1">
                        <AlertCircle className="size-3" />
                        {commentError}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleReject}
                      disabled={isActionInProgress}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-error text-on-error text-xs font-semibold hover:bg-error/90 active:scale-[0.98] transition-all shadow-xs disabled:opacity-50 disabled:pointer-events-none"
                    >
                      {isRejecting ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <XCircle className="size-3.5" />
                      )}
                      <span>{isRejecting ? "Submitting…" : "Submit Correction Request"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowRejectForm(false);
                        setRejectComment("");
                        setCommentError("");
                      }}
                      disabled={isActionInProgress}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface text-xs font-semibold hover:bg-surface-container-low active:scale-[0.98] transition-all shadow-xs disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
