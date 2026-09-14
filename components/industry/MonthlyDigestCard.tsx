"use client";

import React, { useState } from "react";
import { Calendar, Clock, FileText, ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";

export interface MonthlyDigestEntry {
  id: string;
  entryDate: string;
  hoursWorked: number;
  activityDescription: string;
  status: string;
}

interface MonthlyDigestCardProps {
  month: string; // e.g. "2026-03"
  daysPresent: number;
  totalHours: number;
  entries: MonthlyDigestEntry[];
}

export function MonthlyDigestCard({
  month,
  daysPresent,
  totalHours,
  entries,
}: MonthlyDigestCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Format month for display (e.g. "2026-03" -> "March 2026")
  let formattedMonth = month;
  try {
    const [year, m] = month.split("-");
    const d = new Date(Number(year), Number(m) - 1, 1);
    formattedMonth = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  } catch {
    formattedMonth = month;
  }

  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/60 shadow-xs overflow-hidden">
      <div className="p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded bg-primary/10 text-primary font-heading mb-1">
              <Calendar className="size-3" />
              Monthly Activity Digest
            </div>
            <h3 className="font-heading font-bold text-lg text-on-surface">
              {formattedMonth} Summary
            </h3>
          </div>

          <div className="text-right">
            <span className="text-xs text-on-surface-variant font-medium">Logged Activities</span>
            <div className="font-heading font-bold text-base text-on-surface">
              {entries.length} {entries.length === 1 ? "entry" : "entries"}
            </div>
          </div>
        </div>

        {/* 2 Mini Metric Badges */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/40 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <CheckCircle2 className="size-4" />
            </div>
            <div>
              <p className="text-[11px] text-on-surface-variant font-medium">Shifts Present</p>
              <p className="font-heading text-lg font-bold text-on-surface leading-none mt-0.5">
                {daysPresent} <span className="text-xs font-normal text-on-surface-variant">days</span>
              </p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/40 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
              <Clock className="size-4" />
            </div>
            <div>
              <p className="text-[11px] text-on-surface-variant font-medium">Total Hours Logged</p>
              <p className="font-heading text-lg font-bold text-on-surface leading-none mt-0.5">
                {totalHours.toFixed(1)}{" "}
                <span className="text-xs font-normal text-on-surface-variant">hrs</span>
              </p>
            </div>
          </div>
        </div>

        {/* Expandable Entries Accordion */}
        {entries.length > 0 ? (
          <div>
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full flex items-center justify-between py-2 text-xs font-medium text-primary hover:text-primary-container transition-colors border-t border-outline-variant/40 pt-3"
            >
              <span className="flex items-center gap-1.5">
                <FileText className="size-3.5" />
                <span>
                  {isExpanded
                    ? "Hide student daily logs"
                    : `Inspect ${entries.length} daily logbook activities`}
                </span>
              </span>
              {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </button>

            {isExpanded && (
              <div className="mt-3 space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {entries.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px] text-on-surface-variant">
                      <span className="font-medium font-mono text-on-surface">{item.entryDate}</span>
                      <span className="font-semibold px-2 py-0.5 rounded bg-surface-container-high text-on-surface">
                        {item.hoursWorked.toFixed(1)} hrs
                      </span>
                    </div>
                    <p className="text-on-surface font-sans leading-relaxed text-xs">
                      {item.activityDescription}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-on-surface-variant text-center py-2 border-t border-outline-variant/40 mt-2">
            No student daily logbook entries recorded for this calendar month yet.
          </p>
        )}
      </div>
    </div>
  );
}
