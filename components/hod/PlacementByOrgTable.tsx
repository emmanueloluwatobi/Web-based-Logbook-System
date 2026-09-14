"use client";

import React from "react";
import { Building2, MapPin } from "lucide-react";

export interface PlacementOrgStat {
  organizationName: string;
  stateRegion: string;
  studentCount: number;
}

interface PlacementByOrgTableProps {
  data: PlacementOrgStat[];
}

export function PlacementByOrgTable({ data }: PlacementByOrgTableProps) {
  if (data.length === 0) {
    return (
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-10 shadow-xs text-center flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-surface-container-low flex items-center justify-center">
          <Building2 className="size-6 text-on-surface-variant" />
        </div>
        <p className="text-sm font-medium text-on-surface">No placement data</p>
        <p className="text-xs text-on-surface-variant max-w-xs">
          Placement statistics will appear here once students are placed at organizations.
        </p>
      </div>
    );
  }

  const totalStudents = data.reduce((sum, d) => sum + d.studentCount, 0);

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-xs overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-outline-variant/60">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/12 flex items-center justify-center">
            <Building2 className="size-4 text-primary" />
          </div>
          <h3 className="font-heading text-sm font-bold text-on-surface">Placements by Organization</h3>
          <span className="ml-auto px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold font-heading">
            {data.length} org{data.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-outline-variant/60">
              <th className="text-left px-5 py-3 text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider font-heading">
                Organization
              </th>
              <th className="text-left px-5 py-3 text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider font-heading">
                Location
              </th>
              <th className="text-center px-5 py-3 text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider font-heading">
                Students
              </th>
              <th className="text-right px-5 py-3 text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider font-heading">
                Share
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => {
              const share = totalStudents > 0 ? Math.round((row.studentCount / totalStudents) * 100) : 0;
              return (
                <tr
                  key={row.organizationName}
                  className={`hover:bg-surface-container-low transition-colors ${
                    index < data.length - 1 ? "border-b border-outline-variant/40" : ""
                  }`}
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-surface-container-low flex items-center justify-center shrink-0">
                        <Building2 className="size-3.5 text-on-surface-variant" />
                      </div>
                      <span className="font-medium text-on-surface text-sm">{row.organizationName}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1 text-xs text-on-surface-variant">
                      <MapPin className="size-3" />
                      {row.stateRegion}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span className="font-heading font-semibold text-on-surface">{row.studentCount}</span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <div className="w-16 h-1.5 rounded-full bg-surface-container-high overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${share}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-on-surface-variant font-medium w-8 text-right">
                        {share}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
