"use client";

import React, { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Edit2,
  Trash2,
  Loader2,
  Search,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { deleteAttendance } from "@/actions/attendance";
import type { AttendanceRecordItem } from "./AttendanceForm";

interface AttendanceTableProps {
  records: AttendanceRecordItem[];
  onEditRecord: (record: AttendanceRecordItem) => void;
}

export function AttendanceTable({ records, onEditRecord }: AttendanceTableProps) {
  const router = useRouter();
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const [statusFilter, setStatusFilter] = useState<"all" | "present" | "late" | "absent">("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (searchTerm.trim() !== "") {
        const term = searchTerm.toLowerCase();
        return r.date.toLowerCase().includes(term);
      }
      return true;
    });
  }, [records, statusFilter, searchTerm]);

  const handleDelete = (id: string, dateStr: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the attendance record for ${dateStr}?`
    );
    if (!confirmed) return;

    setIsDeletingId(id);
    startTransition(async () => {
      try {
        const res = await deleteAttendance(id);
        if (!res.success) {
          toast.error(res.error || "Failed to delete attendance record.");
          return;
        }
        toast.success("Attendance record removed.");
        router.refresh();
      } catch (err) {
        console.error("Delete attendance error:", err);
        toast.error("An unexpected error occurred while deleting.");
      } finally {
        setIsDeletingId(null);
      }
    });
  };

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-xs overflow-hidden">
      {/* Table Top Header & Filters */}
      <div className="p-5 border-b border-outline-variant/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-heading text-base font-bold text-on-surface">
            Attendance History Log
          </h3>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Verified institutional attendance records for this industrial training attachment
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-lg border border-outline-variant/60">
            {(
              [
                { id: "all", label: "All" },
                { id: "present", label: "Present" },
                { id: "late", label: "Late" },
                { id: "absent", label: "Absent" },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  statusFilter === f.id
                    ? "bg-surface-container-lowest text-primary font-semibold shadow-xs"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Search by date */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-on-surface-variant" />
            <input
              type="text"
              placeholder="Search date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-1 focus:ring-primary w-32 sm:w-40"
            />
          </div>
        </div>
      </div>

      {/* Table Content */}
      {filteredRecords.length === 0 ? (
        <div className="p-12 text-center">
          <div className="size-12 rounded-full bg-surface-container-high mx-auto flex items-center justify-center mb-3">
            <Clock className="size-6 text-on-surface-variant" />
          </div>
          <h4 className="font-heading font-semibold text-on-surface text-base">
            No attendance entries found
          </h4>
          <p className="text-xs text-on-surface-variant mt-1 max-w-sm mx-auto">
            {searchTerm || statusFilter !== "all"
              ? "No entries match your search criteria. Try resetting your filters."
              : "You haven't logged any work attendance yet. Use the form above to record your first daily shift."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-container-low/60 border-b border-outline-variant text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-5">Work Date</th>
                <th className="py-3.5 px-4">Check-In</th>
                <th className="py-3.5 px-4">Check-Out</th>
                <th className="py-3.5 px-4">Hours</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/60">
              {filteredRecords.map((record) => {
                const isDeleting = isDeletingId === record.id;
                return (
                  <tr
                    key={record.id}
                    className="hover:bg-surface-container-low/60 transition-colors group"
                  >
                    {/* Date */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2">
                        <Calendar className="size-4 text-primary shrink-0" />
                        <span className="font-medium text-on-surface">
                          {new Date(record.date).toLocaleDateString("en-US", {
                            weekday: "short",
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    </td>

                    {/* Check-In */}
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-xs font-semibold text-on-surface bg-surface-container-low px-2 py-0.5 rounded">
                        {record.checkIn ? record.checkIn.slice(0, 5) : "—"}
                      </span>
                    </td>

                    {/* Check-Out */}
                    <td className="py-3.5 px-4">
                      {record.checkOut ? (
                        <span className="font-mono text-xs font-semibold text-on-surface bg-surface-container-low px-2 py-0.5 rounded">
                          {record.checkOut.slice(0, 5)}
                        </span>
                      ) : (
                        <span className="text-xs text-on-surface-variant/70 italic">
                          Not recorded
                        </span>
                      )}
                    </td>

                    {/* Hours */}
                    <td className="py-3.5 px-4">
                      {record.hours ? (
                        <span className="font-semibold text-on-surface text-xs">
                          {record.hours} hrs
                        </span>
                      ) : (
                        <span className="text-xs text-on-surface-variant/70 italic">—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      {record.status === "present" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-success-container text-on-success-container text-xs font-medium">
                          <CheckCircle2 className="size-3" />
                          <span>Present</span>
                        </span>
                      ) : record.status === "late" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-warning-container text-on-warning-container text-xs font-medium">
                          <AlertCircle className="size-3" />
                          <span>Late</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-error-container text-on-error-container text-xs font-medium">
                          <XCircle className="size-3" />
                          <span>Absent</span>
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onEditRecord(record)}
                          className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors"
                          title="Edit attendance"
                        >
                          <Edit2 className="size-3.5" />
                        </button>

                        <button
                          type="button"
                          disabled={isDeleting}
                          onClick={() => handleDelete(record.id, record.date)}
                          className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/30 transition-colors disabled:opacity-50"
                          title="Delete attendance"
                        >
                          {isDeleting ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="size-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer */}
      {filteredRecords.length > 0 && (
        <div className="py-3 px-5 bg-surface-container-low/40 border-t border-outline-variant flex items-center justify-between text-xs text-on-surface-variant">
          <span>
            Showing {filteredRecords.length} of {records.length} logged shifts
          </span>
          <span className="italic">Records are subject to academic supervisor verification</span>
        </div>
      )}
    </div>
  );
}
