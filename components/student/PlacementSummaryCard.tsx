"use client";

import React from "react";
import {
  Building2,
  Calendar,
  Briefcase,
  UserCheck,
  MapPin,
  ShieldCheck,
} from "lucide-react";

interface PlacementSummaryCardProps {
  organizationName?: string;
  roleTitle?: string;
  startDate?: string;
  endDate?: string;
  durationWeeks?: number;
  status?: string;
  schoolSupervisorName?: string;
  industrySupervisorName?: string;
  location?: string;
}

export function PlacementSummaryCard({
  organizationName = "Chevron Nigeria Limited",
  roleTitle = "IT Infrastructure & Systems Support Intern",
  startDate = "Jun 2, 2026",
  endDate = "Aug 28, 2026",
  durationWeeks = 12,
  status = "Active",
  schoolSupervisorName = "Dr. Babatunde Adeyemi",
  industrySupervisorName = "Engr. Folake Oladipo",
  location = "Lekki Peninsula, Lagos State",
}: PlacementSummaryCardProps) {
  return (
    <div className="bg-primary text-on-primary border border-primary rounded-2xl p-6 flex flex-col justify-between shadow-sm relative overflow-hidden">
      {/* Decorative backdrop gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--color-primary-container),transparent_65%)] opacity-40 pointer-events-none" />
      <div className="absolute -bottom-16 -right-16 w-64 h-64 rounded-full bg-primary-container/25 blur-2xl pointer-events-none" />

      {/* Top row: Pill badge + Status */}
      <div className="relative z-10 flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-surface-container-lowest/15 flex items-center justify-center text-on-primary">
            <Building2 className="size-4" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider font-heading text-on-primary-container">
            Approved SIWES Placement
          </span>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-lowest/20 border border-white/20 text-xs font-semibold tracking-wide text-on-primary">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span>{status}</span>
        </span>
      </div>

      {/* Main Info */}
      <div className="relative z-10 my-2">
        <h3 className="font-heading text-2xl font-bold tracking-tight text-on-primary">
          {organizationName}
        </h3>
        <p className="font-sans text-sm text-on-primary-container flex items-center gap-1.5 mt-1 font-medium">
          <Briefcase className="size-4 shrink-0 opacity-80" />
          <span>{roleTitle}</span>
        </p>

        <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-on-primary-container mt-3">
          <div className="flex items-center gap-1.5">
            <Calendar className="size-3.5 opacity-80" />
            <span>{startDate} – {endDate} ({durationWeeks} Weeks)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="size-3.5 opacity-80" />
            <span>{location}</span>
          </div>
        </div>
      </div>

      {/* Supervisors Footer */}
      <div className="relative z-10 pt-5 mt-5 border-t border-white/15 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-2.5 rounded-xl bg-surface-container-lowest/10 border border-white/10">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-on-primary-container font-heading">
            School Supervisor
          </p>
          <p className="text-xs font-semibold text-on-primary mt-0.5 flex items-center gap-1.5 truncate">
            <UserCheck className="size-3.5 text-on-primary shrink-0" />
            <span className="truncate">{schoolSupervisorName}</span>
          </p>
        </div>

        <div className="p-2.5 rounded-xl bg-surface-container-lowest/10 border border-white/10">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-on-primary-container font-heading">
            Industry Supervisor
          </p>
          <p className="text-xs font-semibold text-on-primary mt-0.5 flex items-center gap-1.5 truncate">
            <ShieldCheck className="size-3.5 text-on-primary shrink-0" />
            <span className="truncate">{industrySupervisorName}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
