"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  BookOpen,
  Calendar,
  Clock,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  FileText,
} from "lucide-react";
import { EntryStatusBadge, EntryStatus } from "./EntryStatusBadge";
import { INITIAL_MOCK_ENTRIES, LogbookEntryItem } from "@/lib/mock-logbook";

export { INITIAL_MOCK_ENTRIES, type LogbookEntryItem };

interface LogbookEntryListProps {
  entries?: LogbookEntryItem[];
  onNewEntry?: () => void;
  onViewGuidelines?: () => void;
}

export function LogbookEntryList({
  entries = INITIAL_MOCK_ENTRIES,
  onNewEntry,
  onViewGuidelines,
}: LogbookEntryListProps) {
  const router = useRouter();
  const [filterStatus, setFilterStatus] = useState<"all" | EntryStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Compute counts
  const counts = {
    all: entries.length,
    draft: entries.filter((e) => e.status === "draft").length,
    submitted: entries.filter((e) => e.status === "submitted").length,
    approved: entries.filter((e) => e.status === "approved").length,
    needs_correction: entries.filter((e) => e.status === "needs_correction").length,
  };

  // Filter and search
  const filteredEntries = entries.filter((entry) => {
    const matchesStatus =
      filterStatus === "all" || entry.status === filterStatus;
    const matchesSearch =
      searchQuery.trim() === "" ||
      entry.activityDescription
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      entry.skillsGained?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.entryDate.includes(searchQuery);
    return matchesStatus && matchesSearch;
  });

  const formatDateLabel = (dateStr: string) => {
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

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header Card: Summary & New Entry Action */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">
            All Logbook Entries
          </h1>
          <p className="font-sans text-sm text-on-surface-variant mt-1">
            Review, track, and filter your industrial training records and verified hours.
          </p>
        </div>

        {onNewEntry && (
          <button
            onClick={onNewEntry}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:bg-primary-container active:scale-[0.98] transition-all shadow-xs shrink-0"
          >
            <Plus className="size-4" />
            <span>New Entry</span>
          </button>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/60 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant font-heading">
              Approved
            </span>
            <CheckCircle2 className="size-4 text-success" />
          </div>
          <p className="font-heading text-2xl sm:text-3xl font-bold text-on-surface mt-2">
            {counts.approved}
          </p>
          <span className="text-[11px] text-on-surface-variant/80 mt-0.5 block">
            Verified work days
          </span>
        </div>

        <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/60 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant font-heading">
              Submitted
            </span>
            <Clock className="size-4 text-secondary" />
          </div>
          <p className="font-heading text-2xl sm:text-3xl font-bold text-on-surface mt-2">
            {counts.submitted}
          </p>
          <span className="text-[11px] text-on-surface-variant/80 mt-0.5 block">
            Awaiting supervisor
          </span>
        </div>

        <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/60 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant font-heading">
              Needs Correction
            </span>
            <AlertCircle className="size-4 text-error" />
          </div>
          <p className="font-heading text-2xl sm:text-3xl font-bold text-on-surface mt-2">
            {counts.needs_correction}
          </p>
          <span className="text-[11px] text-on-surface-variant/80 mt-0.5 block">
            Requires your revision
          </span>
        </div>

        <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/60 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant font-heading">
              Drafts
            </span>
            <FileText className="size-4 text-on-surface-variant" />
          </div>
          <p className="font-heading text-2xl sm:text-3xl font-bold text-on-surface mt-2">
            {counts.draft}
          </p>
          <span className="text-[11px] text-on-surface-variant/80 mt-0.5 block">
            Unsubmitted drafts
          </span>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-xs overflow-hidden flex flex-col">
        {/* Filter and Search Bar */}
        <div className="p-4 sm:p-5 border-b border-outline-variant/60 flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-surface-container-low/30">
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { key: "all", label: "All Entries", count: counts.all },
              { key: "submitted", label: "Submitted", count: counts.submitted },
              { key: "approved", label: "Approved", count: counts.approved },
              { key: "needs_correction", label: "Correction", count: counts.needs_correction },
              { key: "draft", label: "Drafts", count: counts.draft },
            ].map((tab) => {
              const active = filterStatus === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setFilterStatus(tab.key as EntryStatus | "all")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                    active
                      ? "bg-primary text-on-primary font-semibold shadow-xs"
                      : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      active
                        ? "bg-surface-container-lowest/20 text-on-primary"
                        : "bg-surface-container text-on-surface-variant"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
            <input
              type="text"
              placeholder="Search daily activities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-3 text-xs rounded-lg bg-surface-container-lowest border border-outline-variant text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Entries Table or Empty State */}
        {filteredEntries.length === 0 ? (
          /* Empty State */
          <div className="p-12 text-center flex flex-col items-center justify-center max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-surface-container text-primary flex items-center justify-center mb-5 shadow-xs">
              <BookOpen className="size-8 text-primary" />
            </div>
            <h3 className="font-heading text-xl font-bold text-on-surface">
              {searchQuery || filterStatus !== "all"
                ? "No matching logbook entries"
                : "Your logbook is empty. Time to record your first day!"}
            </h3>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-2 leading-relaxed">
              {searchQuery || filterStatus !== "all"
                ? "Try adjusting your search query or switching to another filter tab."
                : "Document your daily activities, skills gained, and challenges to track your progress and build a comprehensive record of your industrial training."}
            </p>

            {onNewEntry && (
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={onNewEntry}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container active:scale-[0.98] transition-all shadow-xs"
                >
                  <Plus className="size-3.5" />
                  <span>Add First Entry</span>
                </button>

                {onViewGuidelines && (
                  <button
                    onClick={onViewGuidelines}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low text-on-surface text-xs font-semibold transition-all shadow-xs"
                  >
                    <FileText className="size-3.5 text-on-surface-variant" />
                    <span>View Logbook Guidelines</span>
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/70 bg-surface-container-low/40">
                  <th className="py-3 px-5 text-xs font-semibold text-on-surface-variant uppercase tracking-wider font-heading w-44">
                    Date
                  </th>
                  <th className="py-3 px-5 text-xs font-semibold text-on-surface-variant uppercase tracking-wider font-heading">
                    Daily Activity Summary
                  </th>
                  <th className="py-3 px-5 text-xs font-semibold text-on-surface-variant uppercase tracking-wider font-heading w-24">
                    Hours
                  </th>
                  <th className="py-3 px-5 text-xs font-semibold text-on-surface-variant uppercase tracking-wider font-heading w-36">
                    Status
                  </th>
                  <th className="py-3 px-5 text-xs font-semibold text-on-surface-variant uppercase tracking-wider font-heading w-20 text-right">
                    View
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40 text-sm">
                {filteredEntries.map((entry) => (
                  <tr
                    key={entry.id}
                    onClick={() => router.push(`/student/logbook/${entry.id}`)}
                    className="hover:bg-surface-container-low/60 transition-colors cursor-pointer group"
                  >
                    {/* Date */}
                    <td className="py-4 px-5 align-top">
                      <div className="flex items-center gap-2">
                        <Calendar className="size-4 text-primary shrink-0" />
                        <span className="font-heading font-semibold text-xs text-on-surface whitespace-nowrap">
                          {formatDateLabel(entry.entryDate)}
                        </span>
                      </div>
                    </td>

                    {/* Activity */}
                    <td className="py-4 px-5 align-top">
                      <p className="font-sans text-xs text-on-surface leading-relaxed line-clamp-2">
                        {entry.activityDescription}
                      </p>
                      {entry.skillsGained && (
                        <p className="text-[11px] text-on-surface-variant mt-1.5 flex items-center gap-1 line-clamp-1">
                          <span className="font-semibold text-primary font-heading">Skills:</span>{" "}
                          <span>{entry.skillsGained}</span>
                        </p>
                      )}
                      {entry.status === "needs_correction" && entry.supervisorFeedback?.comment && (
                        <div className="mt-2 p-2 rounded-lg bg-error-container/30 border border-error/20 text-[11px] text-on-error-container">
                          <span className="font-semibold font-heading">Supervisor Note:</span>{" "}
                          <span>{entry.supervisorFeedback.comment}</span>
                        </div>
                      )}
                    </td>

                    {/* Hours */}
                    <td className="py-4 px-5 align-top whitespace-nowrap">
                      <div className="inline-flex items-center gap-1 text-xs font-mono font-medium text-on-surface bg-surface-container-low px-2 py-0.5 rounded-md border border-outline-variant/40">
                        <Clock className="size-3 text-on-surface-variant" />
                        <span>{entry.hoursWorked.toFixed(1)}h</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-5 align-top whitespace-nowrap">
                      <EntryStatusBadge status={entry.status} />
                    </td>

                    {/* Action */}
                    <td className="py-4 px-5 align-top text-right whitespace-nowrap">
                      <Link
                        href={`/student/logbook/${entry.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center justify-center p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors group-hover:text-primary"
                        title="View entry details"
                      >
                        <ArrowUpRight className="size-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
