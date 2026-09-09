"use client";

import React from "react";
import Link from "next/link";
import {
  History,
  Clock,
  ArrowRight,
  ArrowDown,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  GitCommit,
} from "lucide-react";
import { EntryStatusBadge, EntryStatus } from "./EntryStatusBadge";
import type { VersionChainItem } from "@/actions/logbook";

interface EntryHistoryProps {
  history: VersionChainItem[];
  currentEntryId: string;
}

export function EntryHistory({ history, currentEntryId }: EntryHistoryProps) {
  if (!history || history.length === 0) {
    return null;
  }

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "Draft · Not submitted";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const latestItem = history[history.length - 1];

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-xs">
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-5 border-b border-outline-variant/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-surface-container-low text-primary flex items-center justify-center shrink-0">
            <History className="size-4.5" />
          </div>
          <div>
            <h2 className="font-heading text-base font-bold text-on-surface">
              Version History & Corrections
            </h2>
            <p className="text-xs text-on-surface-variant font-sans mt-0.5">
              Immutable audit chain · {history.length} {history.length === 1 ? "version" : "versions"} recorded
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full bg-surface-container text-on-surface text-xs font-mono font-semibold border border-outline-variant/50">
            v{latestItem?.versionNumber} latest
          </span>
        </div>
      </div>

      {/* Top Revision Flow Stepper (rendered when there are multiple versions) */}
      {history.length > 1 && (
        <div className="mt-5 p-3 rounded-xl bg-surface-container-low/50 border border-outline-variant/40">
          <p className="text-[11px] font-heading font-semibold uppercase tracking-wider text-on-surface-variant mb-2.5">
            Revision Progression
          </p>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {history.map((item, idx) => {
              const isCurrent = item.id === currentEntryId;
              const isLast = idx === history.length - 1;

              return (
                <React.Fragment key={`step-${item.id}`}>
                  <Link
                    href={`/student/logbook/${item.id}`}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 border ${
                      isCurrent
                        ? "bg-primary text-on-primary border-primary shadow-xs font-semibold"
                        : "bg-surface-container-lowest text-on-surface border-outline-variant hover:bg-surface-container-low"
                    }`}
                  >
                    <span className="font-mono text-[11px]">v{item.versionNumber}</span>
                    <span className="capitalize text-[11px]">
                      {item.status.replace("_", " ")}
                    </span>
                    {isCurrent && (
                      <span className="w-1.5 h-1.5 rounded-full bg-on-primary" />
                    )}
                  </Link>

                  {!isLast && (
                    <ArrowRight className="size-3.5 text-on-surface-variant/60 shrink-0" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* Stacked Version Cards with Directed Transition Arrow */}
      <div className="mt-5 space-y-0">
        {history.map((item, index) => {
          const isCurrent = item.id === currentEntryId;
          const isInitial = item.versionNumber === 1;
          const nextItem = history[index + 1];

          return (
            <div key={item.id}>
              {/* Version Card */}
              <div
                className={`rounded-2xl border transition-all p-5 ${
                  isCurrent
                    ? "bg-surface-container-low/70 border-primary/40 shadow-xs ring-1 ring-primary/20"
                    : "bg-surface-container-lowest border-outline-variant/70 hover:border-outline-variant"
                }`}
              >
                {/* Version Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pb-3 border-b border-outline-variant/40">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-surface-container text-primary border border-outline-variant/40">
                      v{item.versionNumber}
                    </span>
                    <span className="font-heading text-sm font-bold text-on-surface">
                      {isInitial ? "Version 1: Initial Submission" : `Version ${item.versionNumber}: Correction Revision`}
                    </span>
                    {isCurrent && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary text-on-primary text-[10px] font-semibold tracking-wide uppercase font-heading shadow-xs">
                        <Eye className="size-2.5" />
                        <span>Currently Viewing</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <EntryStatusBadge status={item.status as EntryStatus} />
                  </div>
                </div>

                {/* Version Metadata Row */}
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-on-surface-variant font-sans">
                  <div className="flex items-center gap-1.5">
                    <Clock className="size-3.5 text-primary" />
                    <span>{formatDate(item.submittedAt)}</span>
                  </div>
                  <span>·</span>
                  <div className="font-mono font-medium text-on-surface">
                    {item.hoursWorked.toFixed(1)} hrs logged
                  </div>
                  {item.skillsGained && (
                    <>
                      <span>·</span>
                      <span className="truncate max-w-[200px] text-[11px] text-on-surface-variant/90">
                        Skills: {item.skillsGained}
                      </span>
                    </>
                  )}
                </div>

                {/* Activity Description Preview */}
                <div className="mt-3 p-3.5 rounded-xl bg-surface-container-lowest border border-outline-variant/50 text-xs text-on-surface font-sans leading-relaxed">
                  <p className="line-clamp-3">{item.activityDescription}</p>
                </div>

                {/* Supervisor Feedback (if reviewed on this specific version) */}
                {item.feedback && (
                  <div
                    className={`mt-3 p-3.5 rounded-xl border text-xs ${
                      item.feedback.action === "approved"
                        ? "bg-success-container/20 border-success/30 text-on-surface"
                        : "bg-error-container/20 border-error/30 text-on-surface"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {item.feedback.action === "approved" ? (
                        <CheckCircle2 className="size-4 text-success shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="size-4 text-error shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-heading font-semibold text-on-surface">
                            {item.feedback.action === "approved"
                              ? "Supervisor Approval"
                              : "Supervisor Revision Request"}
                          </span>
                          {item.feedback.supervisorName && (
                            <span className="text-[11px] text-on-surface-variant font-medium">
                              {item.feedback.supervisorName}
                            </span>
                          )}
                        </div>
                        {item.feedback.comment && (
                          <p className="text-xs text-on-surface mt-1 italic leading-relaxed">
                            &ldquo;{item.feedback.comment}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Link to switch version if not currently viewing */}
                {!isCurrent && (
                  <div className="mt-3 pt-3 border-t border-outline-variant/40 flex items-center justify-end">
                    <Link
                      href={`/student/logbook/${item.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-container transition-colors group"
                    >
                      <span>Switch to this version</span>
                      <ArrowUpRight className="size-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </Link>
                  </div>
                )}
              </div>

              {/* Semantic Directed Connector between Version N and Version N+1 */}
              {nextItem && (
                <div className="flex flex-col items-center justify-center my-3 py-1">
                  <div className="w-0.5 h-3 bg-outline-variant" />
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-low border border-outline-variant text-[11px] text-on-surface-variant font-medium shadow-2xs">
                    <GitCommit className="size-3 text-primary" />
                    <span>Resubmitted with corrections</span>
                    <span className="font-mono text-primary font-semibold text-[10px]">
                      → Version {nextItem.versionNumber}
                    </span>
                  </div>
                  <div className="w-0.5 h-3 bg-outline-variant" />
                  <ArrowDown className="size-3.5 text-outline -mt-1" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
