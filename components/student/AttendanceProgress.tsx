"use client";

import React from "react";
import { CheckCircle2, CalendarCheck, Clock } from "lucide-react";

interface AttendanceProgressProps {
  daysCompleted: number;
  targetDays: number;
  totalHours: number;
}

export function AttendanceProgress({
  daysCompleted,
  targetDays = 60,
  totalHours,
}: AttendanceProgressProps) {
  const safeTarget = Math.max(1, targetDays);
  const percentage = Math.min(100, Math.round((daysCompleted / safeTarget) * 100));
  const daysRemaining = Math.max(0, targetDays - daysCompleted);

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-xs flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <CalendarCheck className="size-5" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold text-on-surface">
                Training Attendance Progress
              </h2>
              <p className="text-xs text-on-surface-variant">
                Cumulative days verified towards institutional SIWES completion requirement
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success-container text-on-success-container text-xs font-semibold self-start sm:self-auto">
            <CheckCircle2 className="size-3.5" />
            <span>{percentage}% Requirement Met</span>
          </span>
        </div>

        {/* Big Counter Metric */}
        <div className="flex items-baseline justify-between mb-3">
          <div className="flex items-baseline gap-2">
            <span className="font-heading text-3xl sm:text-4xl font-bold text-on-surface tracking-tight">
              {daysCompleted}
            </span>
            <span className="text-sm font-medium text-on-surface-variant">
              / {targetDays} days completed
            </span>
          </div>
          <span className="text-xs font-semibold text-primary font-heading">
            {daysRemaining === 0 ? "Target Completed!" : `${daysRemaining} days remaining`}
          </span>
        </div>

        {/* Progress Bar: 8px height, rounded-full, track bg-surface-container-high, fill bg-primary */}
        <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Sub-metric Tiles */}
      <div className="grid grid-cols-3 gap-3 pt-5 mt-5 border-t border-outline-variant/60">
        <div className="p-3 rounded-xl bg-surface-container-low/50 border border-outline-variant/40">
          <span className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider font-heading block">
            Days Present
          </span>
          <span className="font-heading text-lg sm:text-xl font-bold text-on-surface mt-0.5 block">
            {daysCompleted} <span className="text-xs font-normal text-on-surface-variant">days</span>
          </span>
        </div>

        <div className="p-3 rounded-xl bg-surface-container-low/50 border border-outline-variant/40">
          <span className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider font-heading block">
            Hours Logged
          </span>
          <span className="font-heading text-lg sm:text-xl font-bold text-on-surface mt-0.5 block">
            {totalHours.toFixed(1)} <span className="text-xs font-normal text-on-surface-variant">hrs</span>
          </span>
        </div>

        <div className="p-3 rounded-xl bg-surface-container-low/50 border border-outline-variant/40">
          <span className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider font-heading block">
            Days Left
          </span>
          <span className="font-heading text-lg sm:text-xl font-bold text-on-surface mt-0.5 block">
            {daysRemaining} <span className="text-xs font-normal text-on-surface-variant">days</span>
          </span>
        </div>
      </div>
    </div>
  );
}
