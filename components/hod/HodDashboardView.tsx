"use client";

import React from "react";
import { GraduationCap, Sparkles } from "lucide-react";
import { HodStatCards } from "./HodStatCards";
import { NeedsAttentionTable, NeedsAttentionItem } from "./NeedsAttentionTable";
import { PlacementByOrgTable, PlacementOrgStat } from "./PlacementByOrgTable";

interface HodDashboardViewProps {
  hodName: string;
  departmentName: string;
  sessionName: string;
  stats: {
    totalStudents: number;
    onPlacement: number;
    withoutPlacement: number;
    totalSupervisors: number;
    studentsPerSupervisor: number;
  };
  needsAttention: NeedsAttentionItem[];
  placementByOrg: PlacementOrgStat[];
}

export function HodDashboardView({
  hodName,
  departmentName,
  sessionName,
  stats,
  needsAttention,
  placementByOrg,
}: HodDashboardViewProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner / Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-outline-variant/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed text-[11px] font-semibold tracking-wide font-heading uppercase">
              <GraduationCap className="size-3.5" />
              Department Head
            </span>
            <span className="text-xs text-on-surface-variant">•</span>
            <span className="text-xs font-medium text-on-surface-variant">
              {sessionName} Session
            </span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">
            Welcome back, {hodName}
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant font-sans mt-1">
            Faculty of Science · Department of {departmentName}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-surface-container-low border border-outline-variant/60 text-xs font-medium text-on-surface-variant flex items-center gap-2 shadow-xs">
            <Sparkles className="size-3.5 text-primary" />
            <span>SIWES Placement Active</span>
          </div>
        </div>
      </div>

      {/* 5 Stat Cards */}
      <HodStatCards stats={stats} />

      {/* Needs Attention Table */}
      <NeedsAttentionTable items={needsAttention} />

      {/* Placements by Organization */}
      <PlacementByOrgTable data={placementByOrg} />
    </div>
  );
}
