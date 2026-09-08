"use client";

import React from "react";
import Link from "next/link";
import {
  Lightbulb,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ChevronRight,
  Calendar,
} from "lucide-react";
import { EntryStatusBadge } from "./EntryStatusBadge";
import { LogbookEntryItem } from "@/lib/mock-logbook";

interface LogbookSidebarProps {
  recentEntries: LogbookEntryItem[];
  onViewAll?: () => void;
  supervisorName?: string;
  supervisorRole?: string;
}

export function LogbookSidebar({
  recentEntries,
  onViewAll,
  supervisorName = "Dr. Babatunde Adeyemi",
  supervisorRole = "School Supervisor · Computer Science",
}: LogbookSidebarProps) {
  // Take last 5 entries
  const displayEntries = recentEntries.slice(0, 5);

  const formatDate = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split("-");
      const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Submission Guidelines Card */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-2.5 pb-4 border-b border-outline-variant/60">
          <div className="w-8 h-8 rounded-lg bg-surface-container-low text-primary flex items-center justify-center shrink-0">
            <Lightbulb className="size-4" />
          </div>
          <div>
            <h3 className="font-heading text-sm font-bold text-on-surface">
              Submission Guidelines
            </h3>
            <p className="text-[11px] text-on-surface-variant font-sans">
              Best practices for daily logs
            </p>
          </div>
        </div>

        <ul className="mt-4 space-y-3">
          <li className="flex items-start gap-2.5 text-xs text-on-surface-variant leading-relaxed">
            <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
            <span>Be specific about the tasks you performed. Avoid generic statements.</span>
          </li>
          <li className="flex items-start gap-2.5 text-xs text-on-surface-variant leading-relaxed">
            <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
            <span>Highlight any new tools, software, or methodologies learned.</span>
          </li>
          <li className="flex items-start gap-2.5 text-xs text-on-surface-variant leading-relaxed">
            <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
            <span>Ensure your supervisor can easily understand your contributions.</span>
          </li>
          <li className="flex items-start gap-2.5 text-xs text-on-surface-variant leading-relaxed">
            <Clock className="size-4 text-secondary shrink-0 mt-0.5" />
            <span>Logs must be submitted by 11:59 PM local time daily to avoid late marks.</span>
          </li>
        </ul>
      </div>

      {/* 2. Assigned Supervisor Card */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 shadow-xs">
        <span className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant font-heading mb-3">
          Assigned Supervisor
        </span>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary text-on-primary font-heading font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
            {supervisorName
              .replace(/^Dr\.\s+/, "")
              .charAt(0) || "S"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-heading text-sm font-bold text-on-surface truncate">
              {supervisorName}
            </p>
            <p className="text-[11px] text-on-surface-variant truncate">
              {supervisorRole}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Recent Entries Card */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 shadow-xs flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-outline-variant/60">
          <div>
            <h3 className="font-heading text-sm font-bold text-on-surface">
              Recent Entries
            </h3>
            <p className="text-[11px] text-on-surface-variant font-sans">
              Last {displayEntries.length} logged activities
            </p>
          </div>
          {onViewAll && (
            <button
              onClick={onViewAll}
              className="text-xs font-semibold text-primary hover:text-primary-container transition-colors inline-flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="size-3.5" />
            </button>
          )}
        </div>

        {displayEntries.length === 0 ? (
          <div className="py-6 text-center text-xs text-on-surface-variant">
            No entries recorded yet.
          </div>
        ) : (
          <div className="divide-y divide-outline-variant/40 mt-1">
            {displayEntries.map((entry) => (
              <Link
                key={entry.id}
                href={`/student/logbook/${entry.id}`}
                className="py-3 flex items-center justify-between gap-3 group hover:bg-surface-container-low/50 -mx-2 px-2 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-surface-container-low text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-on-primary transition-colors">
                    <Calendar className="size-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-heading text-xs font-semibold text-on-surface group-hover:text-primary transition-colors truncate">
                      {formatDate(entry.entryDate)}
                    </p>
                    <p className="text-[11px] text-on-surface-variant truncate max-w-[120px]">
                      {entry.hoursWorked.toFixed(1)} hrs logged
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <EntryStatusBadge status={entry.status} />
                  <ArrowUpRight className="size-3.5 text-on-surface-variant group-hover:text-primary transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}

        {onViewAll && displayEntries.length > 0 && (
          <div className="pt-3 mt-2 border-t border-outline-variant/50">
            <button
              onClick={onViewAll}
              className="w-full py-2 rounded-lg border border-outline-variant bg-surface-container-low/40 hover:bg-surface-container-low text-xs font-semibold text-on-surface text-center transition-colors flex items-center justify-center gap-1.5"
            >
              <span>View All Logbook Entries</span>
              <ChevronRight className="size-3.5 text-on-surface-variant" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
