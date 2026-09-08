"use client";

import React from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { IncompleteProfileBanner } from "./IncompleteProfileBanner";
import { TrainingProgressCard } from "./TrainingProgressCard";
import { PlacementSummaryCard } from "./PlacementSummaryCard";
import { EntryStatusTable } from "./EntryStatusTable";

interface StudentDashboardViewProps {
  studentName?: string;
  departmentName?: string;
  isProfileComplete?: boolean;
  missingFields?: string[];
}

export function StudentDashboardView({
  studentName = "Adeola Babatunde",
  departmentName = "Computer Science",
  isProfileComplete = false,
  missingFields = [
    "Matric Number",
    "Program",
    "Level",
    "Session",
    "Phone Number",
    "Profile Photo",
  ],
}: StudentDashboardViewProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* 1. Incomplete Profile Banner (links to /student/profile) */}
      <IncompleteProfileBanner
        isProfileComplete={isProfileComplete}
        missingFields={missingFields}
      />

      {/* 2. Welcome Line & Primary "New Entry" Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">
            Welcome back, {studentName}
          </h1>
          <p className="font-sans text-sm text-on-surface-variant mt-1">
            Active 6-Month SIWES Placement at Chevron Nigeria Limited · Week 6 of 12 (42 entries logged)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/student/logbook"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:bg-primary-container active:scale-[0.98] transition-all shadow-xs"
          >
            <Plus className="size-4" />
            <span>New Entry</span>
          </Link>
        </div>
      </div>

      {/* 3. Top Metrics Row: Training Progress Card & Inverted Placement Summary Card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrainingProgressCard
          daysCompleted={42}
          targetDays={60}
          hoursLogged={336}
          targetHours={480}
          currentWeek={6}
          totalWeeks={12}
        />

        <PlacementSummaryCard
          organizationName="Chevron Nigeria Limited"
          roleTitle="IT Infrastructure & Network Engineering Intern"
          startDate="Jun 2, 2026"
          endDate="Aug 28, 2026"
          durationWeeks={12}
          status="Active"
          schoolSupervisorName="Dr. Babatunde Adeyemi"
          industrySupervisorName="Engr. Folake Oladipo"
          location="Chevron Drive, Lekki Peninsula, Lagos State"
        />
      </div>

      {/* 4. Entry Status Summary Table (Recent entries with hours, dates, status badges) */}
      <EntryStatusTable />
    </div>
  );
}

