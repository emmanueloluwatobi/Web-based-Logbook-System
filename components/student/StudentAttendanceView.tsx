"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CalendarCheck,
  Building2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { AttendanceProgress } from "./AttendanceProgress";
import { AttendanceForm, type AttendanceRecordItem } from "./AttendanceForm";
import { AttendanceTable } from "./AttendanceTable";

export interface StudentAttendancePlacementInfo {
  id: string;
  organizationName: string;
  targetDays: number;
  startDate: string;
  endDate: string;
  status: string;
}

interface StudentAttendanceViewProps {
  placement: StudentAttendancePlacementInfo | null;
  records: AttendanceRecordItem[];
}

export function StudentAttendanceView({ placement, records }: StudentAttendanceViewProps) {
  const [editingRecord, setEditingRecord] = useState<AttendanceRecordItem | null>(null);

  // Compute stats for the progress bar
  const daysCompleted = records.filter((r) => r.status === "present").length;
  const targetDays = placement?.targetDays || 60;
  const totalHours = records.reduce((sum, r) => sum + (r.hours ? parseFloat(r.hours) : 0), 0);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-on-surface-variant font-medium">
          <Link href="/student" className="hover:text-primary transition-colors">
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-on-surface font-semibold">Attendance</span>
        </div>

        {placement && (
          <span className="text-xs text-on-surface-variant flex items-center gap-1.5 bg-surface-container-low px-3 py-1 rounded-full border border-outline-variant/60">
            <Building2 className="size-3 text-primary" />
            <span className="font-medium text-on-surface truncate max-w-[200px]">
              {placement.organizationName}
            </span>
          </span>
        )}
      </div>

      {/* Page Title Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-on-surface">
          Work Attendance Log
        </h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Self-report daily industrial training hours and track institutional completion progress
        </p>
      </div>

      {!placement || placement.status !== "active" ? (
        /* Unplaced / Inactive State Banner */
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-8 shadow-xs text-center max-w-xl mx-auto my-6 space-y-4">
          <div className="size-12 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 flex items-center justify-center mx-auto">
            <AlertTriangle className="size-6" />
          </div>
          <div>
            <h2 className="font-heading text-lg font-bold text-on-surface">
              Active Placement Required
            </h2>
            <p className="text-xs text-on-surface-variant mt-1 max-w-md mx-auto leading-relaxed">
              You must have an approved, active industrial training placement before you can self-report work attendance.
            </p>
          </div>
          <div>
            <Link
              href="/student/placement"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary/90 transition-colors shadow-xs"
            >
              <span>Go to My Placement</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        /* Active Placement — Full Attendance Suite */
        <div className="space-y-6">
          {/* Progress Bar ("42 / 60 days completed" driven by placement.target_days) */}
          <AttendanceProgress
            daysCompleted={daysCompleted}
            targetDays={targetDays}
            totalHours={totalHours}
          />

          {/* Manual Entry Form */}
          <AttendanceForm
            editingRecord={editingRecord}
            onCancelEdit={() => setEditingRecord(null)}
          />

          {/* Attendance History Table */}
          <AttendanceTable
            records={records}
            onEditRecord={(rec) => {
              setEditingRecord(rec);
              window.scrollTo({ top: 180, behavior: "smooth" });
            }}
          />
        </div>
      )}
    </div>
  );
}
