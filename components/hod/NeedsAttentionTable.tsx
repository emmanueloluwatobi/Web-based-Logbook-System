"use client";

import React from "react";
import Link from "next/link";
import { AlertTriangle, Clock, Calendar, ChevronRight, CheckCircle2 } from "lucide-react";

export interface NeedsAttentionItem {
  studentProfileId: string;
  studentName: string;
  matricNumber: string;
  issueType: "overdue_entries" | "pending_placement";
  daysSince: number;
  detail: string;
}

interface NeedsAttentionTableProps {
  items: NeedsAttentionItem[];
}

export function NeedsAttentionTable({ items }: NeedsAttentionTableProps) {
  if (items.length === 0) {
    return (
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-10 shadow-xs text-center flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-success/10 flex items-center justify-center">
          <CheckCircle2 className="size-6 text-success" />
        </div>
        <p className="text-sm font-medium text-on-surface">All clear</p>
        <p className="text-xs text-on-surface-variant max-w-xs">
          No students with overdue entries or stalled placements right now.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-xs overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-outline-variant/60">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-warning/12 flex items-center justify-center">
            <AlertTriangle className="size-4 text-warning" />
          </div>
          <h3 className="font-heading text-sm font-bold text-on-surface">Needs Attention</h3>
          <span className="ml-auto px-2 py-0.5 rounded-full bg-warning/12 text-warning text-[11px] font-semibold font-heading">
            {items.length}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-outline-variant/60">
              <th className="text-left px-5 py-3 text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider font-heading">
                Student
              </th>
              <th className="text-left px-5 py-3 text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider font-heading">
                Issue
              </th>
              <th className="text-left px-5 py-3 text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider font-heading">
                Duration
              </th>
              <th className="text-right px-5 py-3 text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider font-heading">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr
                key={`${item.studentProfileId}-${item.issueType}`}
                className={`group hover:bg-surface-container-low transition-colors ${
                  index < items.length - 1 ? "border-b border-outline-variant/40" : ""
                }`}
              >
                <td className="px-5 py-3.5">
                  <div>
                    <p className="font-medium text-on-surface text-sm">{item.studentName}</p>
                    <p className="text-[11px] text-on-surface-variant">{item.matricNumber}</p>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                      item.issueType === "overdue_entries"
                        ? "bg-error/10 text-error"
                        : "bg-warning/10 text-warning"
                    }`}
                  >
                    {item.issueType === "overdue_entries" ? (
                      <Clock className="size-3" />
                    ) : (
                      <Calendar className="size-3" />
                    )}
                    {item.issueType === "overdue_entries" ? "Overdue Entries" : "Pending Placement"}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <p className="text-sm text-on-surface-variant">{item.daysSince} days</p>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <Link
                    href={`/hod/students/${item.studentProfileId}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                  >
                    {item.issueType === "overdue_entries" ? "Contact Supervisor" : "Review Placement"}
                    <ChevronRight className="size-3.5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
