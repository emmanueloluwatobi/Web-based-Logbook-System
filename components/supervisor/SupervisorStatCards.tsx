"use client";

import React from "react";
import { Users, Clock, CheckCircle2, AlertCircle } from "lucide-react";

interface SupervisorStatCardsProps {
  stats?: {
    totalStudents: number;
    awaitingReview: number;
    approvedEntries: number;
    rejectedEntries: number;
  };
}

export function SupervisorStatCards({
  stats = {
    totalStudents: 14,
    awaitingReview: 6,
    approvedEntries: 58,
    rejectedEntries: 4,
  },
}: SupervisorStatCardsProps) {
  const totalProcessed = stats.approvedEntries + stats.rejectedEntries;
  const approvalRate = totalProcessed > 0 ? Math.round((stats.approvedEntries / totalProcessed) * 100) : 100;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Students Assigned */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-colors">
        <div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant font-heading">
              Assigned Students
            </span>
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Users className="size-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-heading text-3xl font-bold tracking-tight text-on-surface">
              {stats.totalStudents}
            </span>
            <span className="text-xs font-medium text-on-surface-variant">
              students
            </span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-outline-variant/50">
          <div className="flex items-center justify-between text-[11px] text-on-surface-variant font-medium mb-1.5">
            <span>Placement Active</span>
            <span className="font-semibold text-primary">100%</span>
          </div>
          <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full w-full" />
          </div>
        </div>
      </div>

      {/* 2. Entries Awaiting Review */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-colors">
        <div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant font-heading">
              Awaiting Review
            </span>
            <div className="w-9 h-9 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
              <Clock className="size-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-heading text-3xl font-bold tracking-tight text-on-surface">
              {stats.awaitingReview}
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container">
              Pending
            </span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-outline-variant/50">
          <div className="flex items-center justify-between text-[11px] text-on-surface-variant font-medium mb-1.5">
            <span>Review Queue Load</span>
            <span className="font-semibold text-on-surface">6 entries</span>
          </div>
          <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-container rounded-full"
              style={{ width: `${Math.min(100, (stats.awaitingReview / 10) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Approved Entries */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-colors">
        <div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant font-heading">
              Approved Entries
            </span>
            <div className="w-9 h-9 rounded-xl bg-success-container text-on-success-container flex items-center justify-center shrink-0">
              <CheckCircle2 className="size-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-heading text-3xl font-bold tracking-tight text-on-surface">
              {stats.approvedEntries}
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-success-container text-on-success-container">
              {approvalRate}% Rate
            </span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-outline-variant/50">
          <div className="flex items-center justify-between text-[11px] text-on-surface-variant font-medium mb-1.5">
            <span>Verified & Signed</span>
            <span className="font-semibold text-on-success-container">{stats.approvedEntries} logged</span>
          </div>
          <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-600 rounded-full"
              style={{ width: `${approvalRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* 4. Rejected / Corrections */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-colors">
        <div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant font-heading">
              Correction Requests
            </span>
            <div className="w-9 h-9 rounded-xl bg-error-container text-on-error-container flex items-center justify-center shrink-0">
              <AlertCircle className="size-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-heading text-3xl font-bold tracking-tight text-on-surface">
              {stats.rejectedEntries}
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-error-container text-on-error-container">
              Needs Fix
            </span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-outline-variant/50">
          <div className="flex items-center justify-between text-[11px] text-on-surface-variant font-medium mb-1.5">
            <span>Student Revisions</span>
            <span className="font-semibold text-error">{stats.rejectedEntries} returned</span>
          </div>
          <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden">
            <div
              className="h-full bg-error rounded-full"
              style={{ width: `${Math.min(100, (stats.rejectedEntries / 10) * 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
