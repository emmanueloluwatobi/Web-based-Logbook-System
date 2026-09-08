"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  ChevronRight,
  ArrowLeft,
  FileText,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Paperclip,
  Download,
  PenSquare,
  ArrowUpRight,
  RefreshCw,
  X,
} from "lucide-react";
import { EntryStatusBadge, EntryStatus } from "./EntryStatusBadge";
import { EntryHistory } from "./EntryHistory";
import { EntryForm, LogbookEntryFormData } from "./EntryForm";
import type { VersionChainItem } from "@/actions/logbook";

export interface LogbookDetailData {
  id: string;
  entryDate: string;
  activityDescription: string;
  skillsGained?: string;
  challenges?: string;
  hoursWorked: number;
  status: EntryStatus;
  versionNumber: number;
  parentEntryId?: string | null;
  attachmentUrl?: string;
  attachmentName?: string;
  submittedAt?: string;
  supervisorFeedback?: {
    action: "approved" | "rejected";
    comment?: string;
    supervisorName: string;
    reviewedAt: string;
  };
  placementOrgName?: string;
  placementJobTitle?: string;
  placementCity?: string;
  placementState?: string;
  placementSupervisor?: string;
}

interface EntryDetailViewProps {
  entry: LogbookDetailData;
  versionChain: VersionChainItem[];
  hasChildVersion?: boolean;
  latestVersionId?: string;
  latestVersionNumber?: number;
}

export function EntryDetailView({
  entry,
  versionChain,
  hasChildVersion = false,
  latestVersionId,
  latestVersionNumber,
}: EntryDetailViewProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);

  const formatDateTitle = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split("-");
      const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return d.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const handleEditComplete = (data: any) => {
    setIsEditing(false);
    if (data?.id && data.id !== entry.id) {
      router.push(`/student/logbook/${data.id}`);
    } else {
      router.refresh();
    }
  };

  // Convert entry data to form initial data format
  const formInitialData: LogbookEntryFormData = {
    id: entry.id,
    entryDate: entry.entryDate,
    hoursWorked: entry.hoursWorked,
    activityDescription: entry.activityDescription,
    skillsGained: entry.skillsGained || "",
    challenges: entry.challenges || "",
    attachmentName: entry.attachmentName,
    attachmentUrl: entry.attachmentUrl,
    status: entry.status,
    versionNumber: entry.versionNumber,
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-on-surface-variant font-medium">
        <Link href="/student" className="hover:text-primary transition-colors">
          Dashboard
        </Link>
        <ChevronRight className="size-3 text-outline" />
        <Link href="/student/logbook" className="hover:text-primary transition-colors">
          Daily Logbook
        </Link>
        <ChevronRight className="size-3 text-outline" />
        <span className="text-on-surface font-semibold truncate max-w-[200px]">
          {entry.entryDate} (v{entry.versionNumber})
        </span>
      </div>

      {/* Editing Mode View */}
      {isEditing ? (
        <div className="space-y-5">
          {/* Rejection Notice Banner above form for reference */}
          {entry.status === "needs_correction" && entry.supervisorFeedback && (
            <div className="rounded-2xl border border-error/40 bg-error-container/20 p-5 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-error-container text-on-error-container flex items-center justify-center shrink-0 mt-0.5">
                  <AlertCircle className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-heading text-sm font-bold text-on-surface">
                      Supervisor Feedback to Address
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="text-xs text-on-surface-variant hover:text-on-surface inline-flex items-center gap-1 font-medium"
                    >
                      <X className="size-3.5" />
                      <span>Cancel Edit</span>
                    </button>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    From {entry.supervisorFeedback.supervisorName}:
                  </p>
                  {entry.supervisorFeedback.comment && (
                    <div className="mt-2 p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/60">
                      <p className="text-xs text-on-surface italic leading-relaxed">
                        "{entry.supervisorFeedback.comment}"
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Pre-filled Entry Form */}
          <EntryForm
            initialData={formInitialData}
            mode={entry.status === "needs_correction" ? "resubmit" : "edit"}
            onSubmit={handleEditComplete}
            onCancel={() => setIsEditing(false)}
          />
        </div>
      ) : (
        /* Normal Detail View */
        <>
          {/* Newer Version Alert (if viewing historical version that has already been corrected) */}
          {hasChildVersion && latestVersionId && (
            <div className="rounded-2xl border border-primary/30 bg-primary-fixed/20 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary text-on-primary flex items-center justify-center shrink-0">
                  <RefreshCw className="size-4" />
                </div>
                <div>
                  <p className="font-heading text-xs sm:text-sm font-bold text-on-surface">
                    Historical Record · Version {entry.versionNumber}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    A newer revision (Version {latestVersionNumber}) of this entry has been submitted.
                  </p>
                </div>
              </div>

              <Link
                href={`/student/logbook/${latestVersionId}`}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container active:scale-[0.98] transition-all shadow-xs shrink-0"
              >
                <span>View Latest Version (v{latestVersionNumber})</span>
                <ArrowUpRight className="size-3.5" />
              </Link>
            </div>
          )}

          {/* Top Header Card */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">
                  {formatDateTitle(entry.entryDate)}
                </h1>
                <EntryStatusBadge status={entry.status} />
                <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-xs font-mono font-medium border border-outline-variant/40">
                  Version {entry.versionNumber} {entry.versionNumber === 1 ? "(Initial)" : "(Revision)"}
                </span>
              </div>
              <p className="font-sans text-xs sm:text-sm text-on-surface-variant mt-1.5 flex items-center gap-2">
                <Calendar className="size-3.5 text-primary" />
                <span>SIWES Attachment Day</span>
                <span>·</span>
                <Clock className="size-3.5 text-primary" />
                <span>{entry.hoursWorked.toFixed(1)} verified work hours</span>
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              {/* Resubmit CTA when entry needs correction and has not yet been resubmitted */}
              {entry.status === "needs_correction" && !hasChildVersion && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container active:scale-[0.98] transition-all shadow-xs"
                >
                  <PenSquare className="size-3.5" />
                  <span>Revise & Resubmit Entry</span>
                </button>
              )}

              {/* Edit draft action */}
              {entry.status === "draft" && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container active:scale-[0.98] transition-all shadow-xs"
                >
                  <PenSquare className="size-3.5" />
                  <span>Edit Draft</span>
                </button>
              )}

              <Link
                href="/student/logbook?view=all"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface text-xs font-semibold hover:bg-surface-container-low transition-all shadow-xs"
              >
                <ArrowLeft className="size-3.5" />
                <span>Back to Entries</span>
              </Link>
            </div>
          </div>

          {/* Prominent Supervisor Rejection / Feedback Card */}
          {entry.supervisorFeedback && (
            <div
              className={`rounded-2xl border p-5 shadow-xs transition-all ${
                entry.supervisorFeedback.action === "approved"
                  ? "bg-success-container/20 border-success/30 text-on-surface"
                  : "bg-error-container/20 border-error/40 text-on-surface"
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-xs ${
                    entry.supervisorFeedback.action === "approved"
                      ? "bg-success-container text-on-success-container"
                      : "bg-error-container text-on-error-container"
                  }`}
                >
                  {entry.supervisorFeedback.action === "approved" ? (
                    <CheckCircle2 className="size-5" />
                  ) : (
                    <AlertCircle className="size-5" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-heading text-sm sm:text-base font-bold text-on-surface">
                        {entry.supervisorFeedback.action === "approved"
                          ? "Verified & Approved by School Supervisor"
                          : "Supervisor Revision Request (Needs Correction)"}
                      </h3>
                      {entry.status === "needs_correction" && !hasChildVersion && (
                        <span className="px-2 py-0.5 rounded-full bg-error text-on-error text-[10px] font-semibold uppercase font-heading tracking-wide">
                          Action Required
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-on-surface-variant font-medium">
                      Reviewed by {entry.supervisorFeedback.supervisorName}
                    </span>
                  </div>

                  {entry.supervisorFeedback.comment ? (
                    <div className="mt-3 p-3.5 rounded-xl bg-surface-container-lowest border border-outline-variant/70 shadow-xs">
                      <p className="text-xs sm:text-sm text-on-surface font-sans leading-relaxed italic">
                        "{entry.supervisorFeedback.comment}"
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-on-surface-variant mt-1.5">
                      Logbook entry verified and approved with full credit for {entry.hoursWorked} training hours.
                    </p>
                  )}

                  {/* Quick Resubmit Button inside the rejection card */}
                  {entry.status === "needs_correction" && !hasChildVersion && (
                    <div className="mt-3.5 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container active:scale-[0.98] transition-all shadow-xs"
                      >
                        <PenSquare className="size-3.5" />
                        <span>Resubmit Entry with Corrections</span>
                      </button>
                      <span className="text-[11px] text-on-surface-variant font-sans">
                        Your original entry will be kept as Version 1; a new Version 2 will be submitted.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Activity, Skills, Challenges, Version Chain */}
            <div className="lg:col-span-2 space-y-6">
              {/* Daily Activity */}
              <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-xs">
                <div className="flex items-center gap-2.5 pb-4 border-b border-outline-variant/60">
                  <div className="w-8 h-8 rounded-lg bg-surface-container-low text-primary flex items-center justify-center">
                    <FileText className="size-4" />
                  </div>
                  <h2 className="font-heading text-base font-bold text-on-surface">
                    Daily Activity Description
                  </h2>
                </div>
                <p className="text-sm text-on-surface font-sans leading-relaxed mt-4 whitespace-pre-wrap">
                  {entry.activityDescription}
                </p>
              </div>

              {/* Skills Gained */}
              <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-xs">
                <div className="flex items-center gap-2.5 pb-4 border-b border-outline-variant/60">
                  <div className="w-8 h-8 rounded-lg bg-surface-container-low text-primary flex items-center justify-center">
                    <Sparkles className="size-4" />
                  </div>
                  <h2 className="font-heading text-base font-bold text-on-surface">
                    Technical Skills & Knowledge Gained
                  </h2>
                </div>
                <p className="text-sm text-on-surface font-sans leading-relaxed mt-4 whitespace-pre-wrap">
                  {entry.skillsGained || "No specific skills noted for this entry."}
                </p>
              </div>

              {/* Challenges Encountered */}
              <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-xs">
                <div className="flex items-center gap-2.5 pb-4 border-b border-outline-variant/60">
                  <div className="w-8 h-8 rounded-lg bg-surface-container-low text-primary flex items-center justify-center">
                    <AlertCircle className="size-4" />
                  </div>
                  <h2 className="font-heading text-base font-bold text-on-surface">
                    Challenges Encountered & Solutions
                  </h2>
                </div>
                <p className="text-sm text-on-surface font-sans leading-relaxed mt-4 whitespace-pre-wrap">
                  {entry.challenges || "No operational challenges reported for this day."}
                </p>
              </div>

              {/* Version History Component */}
              <EntryHistory history={versionChain} currentEntryId={entry.id} />
            </div>

            {/* Right Col: Metadata & Placement Context */}
            <div className="space-y-6">
              {/* Metadata Card */}
              <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-xs">
                <h3 className="font-heading text-sm font-bold text-on-surface uppercase tracking-wider pb-3 border-b border-outline-variant/60">
                  Entry Metadata
                </h3>

                <dl className="mt-4 space-y-3.5 text-xs">
                  <div className="flex items-center justify-between">
                    <dt className="text-on-surface-variant font-medium">Logbook ID</dt>
                    <dd className="font-mono font-semibold text-on-surface truncate max-w-[150px]">
                      {entry.id}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-on-surface-variant font-medium">Training Date</dt>
                    <dd className="font-semibold text-on-surface">{entry.entryDate}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-on-surface-variant font-medium">Hours Logged</dt>
                    <dd className="font-mono font-semibold text-primary">
                      {entry.hoursWorked.toFixed(1)} hrs
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-on-surface-variant font-medium">Current Status</dt>
                    <dd>
                      <EntryStatusBadge status={entry.status} />
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-on-surface-variant font-medium">Version</dt>
                    <dd className="font-semibold text-on-surface">
                      Version {entry.versionNumber} {entry.versionNumber === 1 ? "(Initial)" : "(Revision)"}
                    </dd>
                  </div>
                  {entry.parentEntryId && (
                    <div className="flex items-center justify-between">
                      <dt className="text-on-surface-variant font-medium">Parent Entry</dt>
                      <dd>
                        <Link
                          href={`/student/logbook/${entry.parentEntryId}`}
                          className="text-primary hover:underline font-mono text-[11px]"
                        >
                          v{entry.versionNumber - 1} view
                        </Link>
                      </dd>
                    </div>
                  )}
                  {entry.submittedAt && (
                    <div className="flex items-center justify-between">
                      <dt className="text-on-surface-variant font-medium">Submitted At</dt>
                      <dd className="text-on-surface">
                        {new Date(entry.submittedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Attachment Card */}
              <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-xs">
                <h3 className="font-heading text-sm font-bold text-on-surface uppercase tracking-wider pb-3 border-b border-outline-variant/60">
                  Attachment
                </h3>

                {entry.attachmentUrl ? (
                  <div className="mt-4 p-3 rounded-xl border border-outline-variant/60 bg-surface-container-low/40 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-surface-container text-primary flex items-center justify-center shrink-0">
                        <Paperclip className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-on-surface truncate">
                          {entry.attachmentName || "Attached Document"}
                        </p>
                        <p className="text-[10px] text-on-surface-variant">Verified Attachment</p>
                      </div>
                    </div>

                    <a
                      href={entry.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors shrink-0"
                      title="View / Download attachment"
                    >
                      <Download className="size-4" />
                    </a>
                  </div>
                ) : (
                  <div className="mt-4 p-4 rounded-xl border border-dashed border-outline-variant/60 text-center text-xs text-on-surface-variant">
                    No supporting attachment uploaded for this entry.
                  </div>
                )}
              </div>

              {/* Placement Anchor */}
              <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-xs">
                <h3 className="font-heading text-sm font-bold text-on-surface uppercase tracking-wider pb-3 border-b border-outline-variant/60">
                  Assigned SIWES Placement
                </h3>

                <div className="mt-3 text-xs space-y-2">
                  <p className="font-semibold text-on-surface text-sm">{entry.placementOrgName}</p>
                  <p className="text-on-surface-variant">{entry.placementJobTitle}</p>
                  <p className="text-[11px] text-on-surface-variant/80">
                    {entry.placementCity}, {entry.placementState}
                  </p>
                  <div className="pt-2 border-t border-outline-variant/50 flex items-center justify-between text-[11px]">
                    <span className="text-on-surface-variant">Supervisor:</span>
                    <span className="font-semibold text-on-surface">{entry.placementSupervisor}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
