"use client";

import React from "react";
import { CheckCircle2, TrendingUp } from "lucide-react";

interface TrainingProgressCardProps {
  daysCompleted?: number;
  targetDays?: number;
  hoursLogged?: number;
  targetHours?: number;
  currentWeek?: number;
  totalWeeks?: number;
}

export function TrainingProgressCard({
  daysCompleted = 42,
  targetDays = 60,
  hoursLogged = 336,
  targetHours = 480,
  currentWeek = 6,
  totalWeeks = 12,
}: TrainingProgressCardProps) {
  const percentCompleted = Math.min(
    100,
    Math.round((daysCompleted / (targetDays || 1)) * 100)
  );

  const daysRemaining = Math.max(0, targetDays - daysCompleted);

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 flex flex-col justify-between shadow-xs">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-surface-container-low text-primary flex items-center justify-center">
              <TrendingUp className="size-4" />
            </div>
            <h3 className="font-heading text-lg font-semibold text-on-surface">
              Attachment Training Progress
            </h3>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-success-container text-on-success-container text-xs font-semibold">
            <CheckCircle2 className="size-3" />
            <span>Week {currentWeek} of {totalWeeks} · On Track</span>
          </span>
        </div>
        <p className="text-xs text-on-surface-variant font-sans mb-6">
          Cumulative industrial training duration verified against institutional requirement.
        </p>

        {/* Big Fraction Metric */}
        <div className="flex items-baseline justify-between mb-3">
          <div className="flex items-baseline gap-2">
            <span className="font-heading text-3xl sm:text-4xl font-bold text-on-surface tracking-tight">
              {daysCompleted}
            </span>
            <span className="text-sm font-medium text-on-surface-variant">
              / {targetDays} verified work days
            </span>
          </div>
          <span className="font-heading text-lg font-bold text-primary">
            {percentCompleted}%
          </span>
        </div>

        {/* Progress Bar (height: 8px, rounded-full, track bg-surface-container-high, fill bg-primary) */}
        <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
            style={{ width: `${percentCompleted}%` }}
          />
        </div>
      </div>

      {/* Sub-Metrics Grid */}
      <div className="grid grid-cols-3 gap-3 pt-6 mt-6 border-t border-outline-variant/60">
        <div className="p-3 rounded-xl bg-surface-container-low/60 border border-outline-variant/40">
          <p className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider font-heading">
            Days Remaining
          </p>
          <p className="font-heading text-xl font-bold text-on-surface mt-1">
            {daysRemaining} <span className="text-xs font-normal text-on-surface-variant">days</span>
          </p>
        </div>

        <div className="p-3 rounded-xl bg-surface-container-low/60 border border-outline-variant/40">
          <p className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider font-heading">
            Hours Worked
          </p>
          <p className="font-heading text-xl font-bold text-on-surface mt-1">
            {hoursLogged} <span className="text-xs font-normal text-on-surface-variant">/ {targetHours}h</span>
          </p>
        </div>

        <div className="p-3 rounded-xl bg-surface-container-low/60 border border-outline-variant/40">
          <p className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider font-heading">
            Daily Average
          </p>
          <p className="font-heading text-xl font-bold text-on-surface mt-1">
            {(hoursLogged / (daysCompleted || 1)).toFixed(1)} <span className="text-xs font-normal text-on-surface-variant">hrs/day</span>
          </p>
        </div>
      </div>
    </div>
  );
}
