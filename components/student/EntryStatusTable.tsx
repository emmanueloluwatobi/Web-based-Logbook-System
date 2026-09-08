"use client";

import React from "react";
import Link from "next/link";
import {
  BookOpen,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Calendar,
} from "lucide-react";

export type EntryStatus = "draft" | "submitted" | "approved" | "needs_correction";

export interface MockLogEntry {
  id: string;
  entryDate: string;
  activityDescription: string;
  hoursWorked: number;
  status: EntryStatus;
}

interface EntryStatusTableProps {
  entries?: MockLogEntry[];
  counts?: {
    draft: number;
    submitted: number;
    approved: number;
    needsCorrection: number;
  };
}

const DEFAULT_MOCK_ENTRIES: MockLogEntry[] = [
  {
    id: "entry-1",
    entryDate: "Yesterday",
    activityDescription:
      "Configured Cisco Catalyst 2960 switch VLAN trunking and implemented 802.1X network port security across engineering floor 3.",
    hoursWorked: 8.0,
    status: "approved",
  },
  {
    id: "entry-2",
    entryDate: "Sep 4, 2026",
    activityDescription:
      "Assisted network infrastructure lead with multimode optical fiber termination, OTDR attenuation testing, and patch panel cable management.",
    hoursWorked: 7.5,
    status: "submitted",
  },
  {
    id: "entry-3",
    entryDate: "Sep 3, 2026",
    activityDescription:
      "Diagnosed DHCP lease scope exhaustion on the primary guest Wi-Fi subnet; documented step-by-step mitigation workflow.",
    hoursWorked: 8.0,
    status: "needs_correction",
  },
  {
    id: "entry-4",
    entryDate: "Sep 2, 2026",
    activityDescription:
      "Provisioned and deployed 12 developer workstations running Ubuntu 24.04 LTS; installed internal SSL root certificates and developer toolchains.",
    hoursWorked: 8.0,
    status: "approved",
  },
  {
    id: "entry-5",
    entryDate: "Today",
    activityDescription:
      "Draft notes on server room environmental telemetry and HVAC thermal sensor monitoring dashboard deployment.",
    hoursWorked: 4.5,
    status: "draft",
  },
];

const DEFAULT_COUNTS = {
  draft: 2,
  submitted: 3,
  approved: 35,
  needsCorrection: 2,
};

export function EntryStatusTable({
  entries = DEFAULT_MOCK_ENTRIES,
  counts = DEFAULT_COUNTS,
}: EntryStatusTableProps) {
  const getStatusBadge = (status: EntryStatus) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-success-container text-on-success-container text-xs font-medium">
            <CheckCircle2 className="size-3" />
            <span>Approved</span>
          </span>
        );
      case "submitted":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-xs font-medium">
            <Clock className="size-3" />
            <span>Submitted</span>
          </span>
        );
      case "needs_correction":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-error-container text-on-error-container text-xs font-medium">
            <AlertCircle className="size-3" />
            <span>Needs Correction</span>
          </span>
        );
      case "draft":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-xs font-medium">
            <FileText className="size-3" />
            <span>Draft</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-xs flex flex-col gap-6">
      {/* Header with Title and Link */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-surface-container-low text-primary flex items-center justify-center">
              <BookOpen className="size-4" />
            </div>
            <h3 className="font-heading text-lg font-semibold text-on-surface">
              Logbook Activity & Review Status
            </h3>
          </div>
          <p className="text-xs text-on-surface-variant font-sans mt-0.5">
            Recent daily entries and current supervisor review status.
          </p>
        </div>

        <Link
          href="/student/logbook"
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-container transition-colors shrink-0"
        >
          <span>View all 42 entries</span>
          <ArrowUpRight className="size-3.5" />
        </Link>
      </div>

      {/* Status Summary Pill Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-xl bg-surface-container/60 border border-outline-variant/50 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider font-heading">
              Drafts
            </p>
            <p className="font-heading text-xl font-bold text-on-surface mt-0.5">
              {counts.draft}
            </p>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-[11px] font-medium">
            In Progress
          </span>
        </div>

        <div className="p-3 rounded-xl bg-secondary-container/30 border border-outline-variant/50 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-on-secondary-container uppercase tracking-wider font-heading">
              Submitted
            </p>
            <p className="font-heading text-xl font-bold text-on-surface mt-0.5">
              {counts.submitted}
            </p>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-medium">
            Awaiting Review
          </span>
        </div>

        <div className="p-3 rounded-xl bg-success-container/30 border border-outline-variant/50 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-on-success-container uppercase tracking-wider font-heading">
              Approved
            </p>
            <p className="font-heading text-xl font-bold text-on-surface mt-0.5">
              {counts.approved}
            </p>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-success-container text-on-success-container text-[11px] font-medium">
            Verified
          </span>
        </div>

        <div className="p-3 rounded-xl bg-error-container/30 border border-outline-variant/50 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-on-error-container uppercase tracking-wider font-heading">
              Needs Correction
            </p>
            <p className="font-heading text-xl font-bold text-on-surface mt-0.5">
              {counts.needsCorrection}
            </p>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container text-[11px] font-medium">
            Action Req.
          </span>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="overflow-x-auto border border-outline-variant/60 rounded-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-outline-variant/70 bg-surface-container-low/50">
              <th className="py-2.5 px-4 text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider font-heading">
                Date
              </th>
              <th className="py-2.5 px-4 text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider font-heading">
                Daily Activity Description
              </th>
              <th className="py-2.5 px-4 text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider font-heading">
                Hours
              </th>
              <th className="py-2.5 px-4 text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider font-heading text-right">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/40">
            {entries.map((entry) => (
              <tr
                key={entry.id}
                className="hover:bg-surface-container-low transition-colors text-sm"
              >
                <td className="py-3 px-4 font-medium text-on-surface whitespace-nowrap text-xs">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="size-3.5 text-on-surface-variant" />
                    <span>{entry.entryDate}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-xs text-on-surface font-sans max-w-md">
                  <p className="line-clamp-2 leading-relaxed">{entry.activityDescription}</p>
                </td>
                <td className="py-3 px-4 text-xs font-semibold text-on-surface whitespace-nowrap font-mono">
                  {entry.hoursWorked.toFixed(1)}h
                </td>
                <td className="py-3 px-4 text-right whitespace-nowrap">
                  {getStatusBadge(entry.status)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
