"use client";

import React from "react";
import Link from "next/link";
import {
  ChevronRight,
  ArrowLeft,
  GraduationCap,
  Building2,
  Calendar,
  FileCheck2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Inbox,
} from "lucide-react";
import { EntryReviewCard, ReviewEntryData } from "./EntryReviewCard";

interface StudentInfo {
  profileId: string;
  name: string;
  matricNumber: string | null;
  departmentName: string | null;
  organizationName: string | null;
  placementStart: string | null;
  placementEnd: string | null;
  placementStatus: string | null;
}

interface EntryStats {
  total: number;
  submitted: number;
  approved: number;
  needsCorrection: number;
  draft: number;
}

interface StudentReviewViewProps {
  student: StudentInfo;
  entries: ReviewEntryData[];
  stats: EntryStats;
}

export function StudentReviewView({
  student,
  entries,
  stats,
}: StudentReviewViewProps) {
  const submittedEntries = entries.filter((e) => e.status === "submitted");
  const reviewedEntries = entries.filter((e) => e.status !== "submitted" && e.status !== "draft");
  const draftEntries = entries.filter((e) => e.status === "draft");

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-on-surface-variant font-medium">
        <Link
          href="/supervisor"
          className="hover:text-primary transition-colors"
        >
          Supervisor Dashboard
        </Link>
        <ChevronRight className="size-3 text-outline" />
        <span className="text-on-surface font-semibold truncate max-w-[250px]">
          {student.name}
        </span>
      </div>

      {/* Student Info Header Card */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="w-14 h-14 rounded-2xl bg-primary text-on-primary font-heading text-xl font-bold flex items-center justify-center shadow-xs shrink-0">
              {student.name.charAt(0)}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-on-surface">
                  {student.name}
                </h1>
                {student.placementStatus && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success-container text-on-success-container text-[10px] font-semibold uppercase tracking-wide font-heading">
                    <CheckCircle2 className="size-3" />
                    {student.placementStatus}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-on-surface-variant">
                {student.matricNumber && (
                  <span className="flex items-center gap-1">
                    <GraduationCap className="size-3.5" />
                    <span className="font-mono font-medium">{student.matricNumber}</span>
                  </span>
                )}
                {student.departmentName && (
                  <span className="flex items-center gap-1">
                    <span>Dept. of {student.departmentName}</span>
                  </span>
                )}
                {student.organizationName && (
                  <span className="flex items-center gap-1">
                    <Building2 className="size-3.5" />
                    <span>{student.organizationName}</span>
                  </span>
                )}
                {student.placementStart && student.placementEnd && (
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3.5" />
                    <span>{student.placementStart} — {student.placementEnd}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <Link
            href="/supervisor"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface text-xs font-semibold hover:bg-surface-container-low transition-all shadow-xs shrink-0 self-start"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back to Dashboard</span>
          </Link>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mt-5 pt-5 border-t border-outline-variant/60">
          <div className="p-3 rounded-xl bg-surface-container-low/60 border border-outline-variant/40 text-center">
            <p className="font-heading text-lg font-bold text-on-surface">{stats.total}</p>
            <p className="text-[11px] text-on-surface-variant font-medium mt-0.5">Total Entries</p>
          </div>
          <div className="p-3 rounded-xl bg-secondary-container/30 border border-outline-variant/40 text-center">
            <p className="font-heading text-lg font-bold text-on-surface">{stats.submitted}</p>
            <p className="text-[11px] text-on-surface-variant font-medium mt-0.5">Awaiting Review</p>
          </div>
          <div className="p-3 rounded-xl bg-success-container/30 border border-outline-variant/40 text-center">
            <p className="font-heading text-lg font-bold text-on-surface">{stats.approved}</p>
            <p className="text-[11px] text-on-surface-variant font-medium mt-0.5">Approved</p>
          </div>
          <div className="p-3 rounded-xl bg-error-container/30 border border-outline-variant/40 text-center">
            <p className="font-heading text-lg font-bold text-on-surface">{stats.needsCorrection}</p>
            <p className="text-[11px] text-on-surface-variant font-medium mt-0.5">Needs Correction</p>
          </div>
          <div className="p-3 rounded-xl bg-surface-container/60 border border-outline-variant/40 text-center">
            <p className="font-heading text-lg font-bold text-on-surface">{stats.draft}</p>
            <p className="text-[11px] text-on-surface-variant font-medium mt-0.5">Drafts</p>
          </div>
        </div>
      </div>

      {/* Entries Awaiting Review Section */}
      {submittedEntries.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center">
              <FileCheck2 className="size-4" />
            </div>
            <div>
              <h2 className="font-heading text-base font-bold text-on-surface">
                Entries Awaiting Your Review
              </h2>
              <p className="text-xs text-on-surface-variant">
                {submittedEntries.length} {submittedEntries.length === 1 ? "entry" : "entries"} submitted and pending academic review
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {submittedEntries.map((entry, index) => (
              <EntryReviewCard
                key={entry.id}
                entry={entry}
                defaultExpanded={index === 0}
              />
            ))}
          </div>
        </div>
      )}

      {/* Previously Reviewed Section */}
      {reviewedEntries.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-surface-container-low text-on-surface-variant flex items-center justify-center">
              <Clock className="size-4" />
            </div>
            <div>
              <h2 className="font-heading text-base font-bold text-on-surface">
                Previously Reviewed
              </h2>
              <p className="text-xs text-on-surface-variant">
                {reviewedEntries.length} {reviewedEntries.length === 1 ? "entry" : "entries"} already reviewed
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {reviewedEntries.map((entry) => (
              <EntryReviewCard key={entry.id} entry={entry} />
            ))}
          </div>
        </div>
      )}

      {/* Drafts Section (visible but not actionable) */}
      {draftEntries.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-surface-container text-on-surface-variant flex items-center justify-center">
              <AlertCircle className="size-4" />
            </div>
            <div>
              <h2 className="font-heading text-base font-bold text-on-surface">
                Draft Entries
              </h2>
              <p className="text-xs text-on-surface-variant">
                {draftEntries.length} {draftEntries.length === 1 ? "entry" : "entries"} saved as draft — not yet submitted for review
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {draftEntries.map((entry) => (
              <EntryReviewCard key={entry.id} entry={entry} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {entries.length === 0 && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-12 shadow-xs text-center flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant">
            <Inbox className="size-6" />
          </div>
          <h3 className="font-heading text-sm font-bold text-on-surface">
            No Logbook Entries Yet
          </h3>
          <p className="text-xs text-on-surface-variant max-w-sm">
            This student has not created any logbook entries yet. Entries will appear here once they start recording their daily SIWES activities.
          </p>
          <Link
            href="/supervisor"
            className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container active:scale-[0.98] transition-all shadow-xs"
          >
            <ArrowLeft className="size-3.5" />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      )}
    </div>
  );
}
