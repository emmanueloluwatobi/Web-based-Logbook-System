"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Calendar,
  Clock,
  ChevronRight,
  Building2,
  Inbox,
  FileCheck2,
} from "lucide-react";
import { EntryStatusBadge } from "@/components/student/EntryStatusBadge";

export interface ReviewQueueItem {
  id: string;
  studentId: string;
  studentName: string;
  matricNumber: string;
  organizationName: string;
  entryDate: string;
  weekNumber: number;
  dayNumber: number;
  titleSnippet: string;
  submittedAt: string;
  versionNumber: number;
  status: "submitted";
}

const MOCK_REVIEW_QUEUE: ReviewQueueItem[] = [
  {
    id: "entry-001",
    studentId: "student-1049",
    studentName: "Adeola Babatunde",
    matricNumber: "EKSU/2022/1049",
    organizationName: "Chevron Nigeria Limited",
    entryDate: "Mon, 15 Sep 2025",
    weekNumber: 4,
    dayNumber: 1,
    titleSnippet: "Configured Cisco core switches and verified VLAN routing for subnet B.",
    submittedAt: "Today, 04:15 PM",
    versionNumber: 2,
    status: "submitted",
  },
  {
    id: "entry-002",
    studentId: "student-1082",
    studentName: "Chinonso Okonkwo",
    matricNumber: "EKSU/2022/1082",
    organizationName: "MTN Nigeria Communications",
    entryDate: "Mon, 15 Sep 2025",
    weekNumber: 4,
    dayNumber: 1,
    titleSnippet: "Monitored base transceiver stations (BTS) alarm telemetry and logged microwave link dips.",
    submittedAt: "Today, 01:20 PM",
    versionNumber: 1,
    status: "submitted",
  },
  {
    id: "entry-003",
    studentId: "student-1115",
    studentName: "Fatima Ibrahim",
    matricNumber: "EKSU/2022/1115",
    organizationName: "Federal Inland Revenue Service (FIRS)",
    entryDate: "Mon, 15 Sep 2025",
    weekNumber: 4,
    dayNumber: 1,
    titleSnippet: "Assisted senior DBA in database index defragmentation and PostgreSQL vacuuming.",
    submittedAt: "Today, 11:45 AM",
    versionNumber: 1,
    status: "submitted",
  },
  {
    id: "entry-004",
    studentId: "student-1063",
    studentName: "Oluwaseun Adeleke",
    matricNumber: "EKSU/2022/1063",
    organizationName: "Zenith Bank PLC (Information Security)",
    entryDate: "Fri, 12 Sep 2025",
    weekNumber: 3,
    dayNumber: 5,
    titleSnippet: "Analyzed weekly SIEM incident logs and drafted endpoint compliance report.",
    submittedAt: "Yesterday, 05:30 PM",
    versionNumber: 1,
    status: "submitted",
  },
  {
    id: "entry-005",
    studentId: "student-1140",
    studentName: "Blessing Danjuma",
    matricNumber: "EKSU/2022/1140",
    organizationName: "Ekiti State Ministry of Science & Tech",
    entryDate: "Thu, 11 Sep 2025",
    weekNumber: 3,
    dayNumber: 4,
    titleSnippet: "Participated in fiber optic termination training and OTDR line loss testing.",
    submittedAt: "2 days ago",
    versionNumber: 1,
    status: "submitted",
  },
  {
    id: "entry-006",
    studentId: "student-1021",
    studentName: "Tunde Bakare",
    matricNumber: "EKSU/2022/1021",
    organizationName: "Paystack Payments Limited",
    entryDate: "Wed, 10 Sep 2025",
    weekNumber: 3,
    dayNumber: 3,
    titleSnippet: "Integrated webhook signature validation module and wrote unit test coverage.",
    submittedAt: "2 days ago",
    versionNumber: 2,
    status: "submitted",
  },
];

interface SupervisorReviewQueueProps {
  initialEntries?: ReviewQueueItem[];
}

export function SupervisorReviewQueue({
  initialEntries,
}: SupervisorReviewQueueProps) {
  const entries = initialEntries ?? MOCK_REVIEW_QUEUE;
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredEntries = entries.filter((item) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      item.studentName.toLowerCase().includes(query) ||
      item.matricNumber.toLowerCase().includes(query) ||
      item.organizationName.toLowerCase().includes(query) ||
      item.titleSnippet.toLowerCase().includes(query)
    );
  });

  const handleRowClick = (studentId: string) => {
    // Navigates to /supervisor/students/[id] (Feature 12)
    router.push(`/supervisor/students/${studentId}`);
  };

  return (
    <div
      id="review-queue"
      className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-xs flex flex-col gap-6"
    >
      {/* Header and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="font-heading text-lg font-bold tracking-tight text-on-surface">
              Logbook Review Queue
            </h2>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-secondary-container text-on-secondary-container">
              {filteredEntries.length} awaiting review
            </span>
          </div>
          <p className="text-xs text-on-surface-variant font-sans mt-0.5">
            Daily entries submitted by your assigned students awaiting academic review and grading.
          </p>
        </div>

        {/* Search input */}
        <div className="w-full sm:w-72 relative">
          <Search className="absolute inset-y-0 left-0 pl-3 flex items-center size-4 text-on-surface-variant pointer-events-none my-auto" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search student or matric no..."
            className="w-full h-9 pl-9 pr-3 text-xs rounded-lg bg-surface-container-low border border-outline-variant text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-hidden border border-outline-variant rounded-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low border-b border-outline-variant text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant font-heading">
              <th className="py-3 px-4">Student</th>
              <th className="py-3 px-4">Entry Date</th>
              <th className="py-3 px-4">Submitted At</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/60 text-xs">
            {filteredEntries.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-12 text-center text-on-surface-variant">
                  <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                    <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant">
                      <Inbox className="size-5" />
                    </div>
                    <p className="font-semibold text-on-surface text-sm">No entries found</p>
                    <p className="text-xs text-on-surface-variant">
                      {searchQuery
                        ? "No student submission matches your current search criteria."
                        : "All caught up! There are no logbook entries currently awaiting review."}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredEntries.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => handleRowClick(item.studentId)}
                  className="hover:bg-surface-container-low/60 cursor-pointer transition-colors group"
                >
                  {/* Student column */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-primary group-hover:text-on-primary transition-colors">
                        {item.studentName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-heading font-semibold text-on-surface group-hover:text-primary transition-colors truncate">
                            {item.studentName}
                          </span>
                          {item.versionNumber > 1 && (
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded-xs bg-primary-fixed text-on-primary-fixed text-[10px] font-semibold tracking-wide font-heading">
                              v{item.versionNumber} Resubmit
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-on-surface-variant mt-0.5">
                          <span className="font-mono">{item.matricNumber}</span>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1 truncate text-[11px] text-on-surface-variant">
                            <Building2 className="size-3 shrink-0" />
                            {item.organizationName}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Entry Date column */}
                  <td className="py-3.5 px-4">
                    <div>
                      <div className="flex items-center gap-1.5 font-medium text-on-surface">
                        <Calendar className="size-3.5 text-on-surface-variant shrink-0" />
                        <span>{item.entryDate}</span>
                      </div>
                      <div className="text-[11px] text-on-surface-variant mt-0.5 line-clamp-1 italic max-w-xs">
                        &ldquo;{item.titleSnippet}&rdquo;
                      </div>
                    </div>
                  </td>

                  {/* Submitted At column */}
                  <td className="py-3.5 px-4">
                    <div>
                      <div className="flex items-center gap-1.5 text-on-surface font-medium">
                        <Clock className="size-3.5 text-on-surface-variant shrink-0" />
                        <span>{item.submittedAt}</span>
                      </div>
                      <div className="mt-1">
                        <EntryStatusBadge status={item.status} />
                      </div>
                    </div>
                  </td>

                  {/* Action column */}
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRowClick(item.studentId);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container active:scale-[0.98] transition-all shadow-xs group-hover:shadow-sm"
                    >
                      <FileCheck2 className="size-3.5" />
                      <span>Review</span>
                      <ChevronRight className="size-3 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View */}
      <div className="md:hidden space-y-3">
        {filteredEntries.length === 0 ? (
          <div className="py-8 text-center text-on-surface-variant border border-outline-variant rounded-xl p-4">
            <p className="font-semibold text-on-surface text-sm">No entries found</p>
            <p className="text-xs text-on-surface-variant mt-1">
              {searchQuery
                ? "No student matches your search."
                : "No entries awaiting review."}
            </p>
          </div>
        ) : (
          filteredEntries.map((item) => (
            <div
              key={item.id}
              onClick={() => handleRowClick(item.studentId)}
              className="p-4 rounded-xl border border-outline-variant bg-surface-container-lowest hover:border-primary transition-all cursor-pointer flex flex-col gap-3 active:scale-[0.99]"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                    {item.studentName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-sm text-on-surface">
                      {item.studentName}
                    </h3>
                    <p className="text-[11px] text-on-surface-variant font-mono">
                      {item.matricNumber}
                    </p>
                  </div>
                </div>
                <EntryStatusBadge status={item.status} />
              </div>

              <div className="text-xs text-on-surface-variant flex items-center gap-1.5">
                <Building2 className="size-3.5 shrink-0" />
                <span className="truncate">{item.organizationName}</span>
              </div>

              <div className="pt-2 border-t border-outline-variant/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-on-surface-variant">
                  <Calendar className="size-3.5" />
                  <span>{item.entryDate}</span>
                </div>
                <div className="flex items-center gap-1 text-primary font-semibold">
                  <span>Review Entry</span>
                  <ChevronRight className="size-3.5" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
