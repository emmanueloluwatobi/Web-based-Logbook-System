"use client";

import React, { useState, useEffect, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Save,
  Loader2,
  X,
  PlusCircle,
} from "lucide-react";
import { toast } from "sonner";
import { logAttendance } from "@/actions/attendance";

export interface AttendanceRecordItem {
  id: string;
  date: string;
  checkIn: string;
  checkOut: string | null;
  hours: string | null;
  status: "present" | "late" | "absent";
  createdAt?: string;
}

interface AttendanceFormProps {
  editingRecord: AttendanceRecordItem | null;
  onCancelEdit?: () => void;
}

export function AttendanceForm({ editingRecord, onCancelEdit }: AttendanceFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Today in YYYY-MM-DD
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  const [date, setDate] = useState(todayStr);
  const [checkIn, setCheckIn] = useState("08:30");
  const [checkOut, setCheckOut] = useState("17:00");
  const [status, setStatus] = useState<"present" | "late" | "absent">("present");

  // Sync editing record into form state
  useEffect(() => {
    if (editingRecord) {
      setDate(editingRecord.date);
      setCheckIn(editingRecord.checkIn ? editingRecord.checkIn.slice(0, 5) : "08:30");
      setCheckOut(editingRecord.checkOut ? editingRecord.checkOut.slice(0, 5) : "");
      setStatus(editingRecord.status);
    } else {
      setDate(todayStr);
      setCheckIn("08:30");
      setCheckOut("17:00");
      setStatus("present");
    }
  }, [editingRecord, todayStr]);

  // Derived hours calculation in real-time
  const calculatedHours = useMemo(() => {
    if (!checkIn || !checkOut) return null;
    const [inH, inM] = checkIn.split(":").map(Number);
    const [outH, outM] = checkOut.split(":").map(Number);

    if (isNaN(inH) || isNaN(inM) || isNaN(outH) || isNaN(outM)) return null;

    const inMinutes = inH * 60 + inM;
    const outMinutes = outH * 60 + outM;

    if (outMinutes <= inMinutes) return null;

    const diff = (outMinutes - inMinutes) / 60;
    return diff.toFixed(2);
  }, [checkIn, checkOut]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!date) {
      toast.error("Please choose an attendance date.");
      return;
    }

    if (!checkIn) {
      toast.error("Please specify a check-in time.");
      return;
    }

    if (checkOut && !calculatedHours) {
      toast.error("Check-out time must be later than check-in time.");
      return;
    }

    const formData = new FormData();
    if (editingRecord) {
      formData.append("id", editingRecord.id);
    }
    formData.append("date", date);
    formData.append("checkIn", checkIn);
    if (checkOut) {
      formData.append("checkOut", checkOut);
    }
    formData.append("status", status);

    startTransition(async () => {
      try {
        const res = await logAttendance(formData);
        if (!res.success) {
          toast.error(res.error || "Failed to log attendance.");
          return;
        }

        toast.success(
          editingRecord
            ? "Attendance record updated successfully!"
            : "Attendance logged successfully!"
        );

        if (editingRecord && onCancelEdit) {
          onCancelEdit();
        } else {
          // Reset check-in/out to standard defaults
          setCheckIn("08:30");
          setCheckOut("17:00");
        }

        router.refresh();
      } catch (err) {
        console.error("Attendance form error:", err);
        toast.error("An unexpected error occurred while saving attendance.");
      }
    });
  };

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-xs">
      <div className="flex items-center justify-between pb-4 mb-5 border-b border-outline-variant/60">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            {editingRecord ? <Save className="size-4" /> : <PlusCircle className="size-4" />}
          </div>
          <div>
            <h3 className="font-heading text-base font-bold text-on-surface">
              {editingRecord ? "Edit Attendance Record" : "Log Daily Work Attendance"}
            </h3>
            <p className="text-xs text-on-surface-variant">
              {editingRecord
                ? `Modifying entry for ${editingRecord.date}`
                : "Record your daily clock-in and clock-out timestamps"}
            </p>
          </div>
        </div>

        {editingRecord && onCancelEdit && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-outline-variant text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors"
          >
            <X className="size-3.5" />
            <span>Cancel</span>
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Date */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant font-heading">
              Work Date *
            </label>
            <div className="relative">
              <input
                type="date"
                value={date}
                max={todayStr}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full text-sm rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
              />
            </div>
          </div>

          {/* Check-In */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant font-heading">
              Check-In Time *
            </label>
            <input
              type="time"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              required
              className="w-full text-sm rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
            />
          </div>

          {/* Check-Out */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant font-heading">
              Check-Out Time
            </label>
            <input
              type="time"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className="w-full text-sm rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
            />
          </div>

          {/* Derived Hours Display */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant font-heading">
              Hours (Derived)
            </label>
            <div className="h-[38px] px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/60 flex items-center justify-between text-sm">
              <span className="font-semibold text-on-surface">
                {calculatedHours ? `${calculatedHours} hrs` : "—"}
              </span>
              <span className="text-[10px] text-on-surface-variant uppercase tracking-wider">
                {calculatedHours ? "Computed" : "Pending"}
              </span>
            </div>
          </div>
        </div>

        {/* Status Radio Pills */}
        <div className="space-y-1.5 pt-1">
          <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant font-heading">
            Attendance Status *
          </label>
          <div className="flex flex-wrap items-center gap-2.5">
            {[
              {
                id: "present",
                label: "Present (Full Day)",
                icon: CheckCircle2,
                activeClass: "bg-success-container text-on-success-container border-emerald-500",
              },
              {
                id: "late",
                label: "Late Arrival",
                icon: AlertCircle,
                activeClass: "bg-warning-container text-on-warning-container border-amber-500",
              },
              {
                id: "absent",
                label: "Absent (Excused/Unexcused)",
                icon: XCircle,
                activeClass: "bg-error-container text-on-error-container border-error",
              },
            ].map((opt) => {
              const Icon = opt.icon;
              const isSelected = status === opt.id;
              return (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setStatus(opt.id as typeof status)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium border transition-all ${
                    isSelected
                      ? `${opt.activeClass} font-semibold shadow-xs`
                      : "bg-surface-container-lowest border-outline-variant text-on-surface-variant hover:bg-surface-container-low"
                  }`}
                >
                  <Icon className="size-3.5 shrink-0" />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-on-primary text-sm font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all shadow-xs disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Saving Record...</span>
              </>
            ) : (
              <>
                <Save className="size-4" />
                <span>{editingRecord ? "Update Attendance" : "Log Work Attendance"}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
