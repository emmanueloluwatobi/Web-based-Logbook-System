"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ChevronRight,
  PenSquare,
  ListFilter,
} from "lucide-react";
import { EntryForm, LogbookEntryFormData } from "./EntryForm";
import { LogbookSidebar } from "./LogbookSidebar";
import { LogbookEntryList } from "./LogbookEntryList";
import { INITIAL_MOCK_ENTRIES, LogbookEntryItem } from "@/lib/mock-logbook";

interface StudentLogbookViewProps {
  initialEntries?: LogbookEntryItem[];
  supervisorName?: string;
  supervisorRole?: string;
}

export function StudentLogbookView({
  initialEntries = INITIAL_MOCK_ENTRIES,
  supervisorName = "Dr. Babatunde Adeyemi",
  supervisorRole = "School Supervisor · Computer Science",
}: StudentLogbookViewProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Default view is "create" (Add Daily Activity), unless ?view=all is specified
  const initialView = searchParams.get("view") === "all" ? "all" : "create";
  const [activeView, setActiveView] = useState<"create" | "all">(initialView);
  const [entries, setEntries] = useState<LogbookEntryItem[]>(initialEntries);

  useEffect(() => {
    setEntries(initialEntries);
  }, [initialEntries]);

  const handleViewChange = (view: "create" | "all") => {
    setActiveView(view);
    const params = new URLSearchParams(searchParams.toString());
    if (view === "all") {
      params.set("view", "all");
    } else {
      params.delete("view");
    }
    const query = params.toString();
    router.replace(query ? `/student/logbook?${query}` : "/student/logbook", {
      scroll: false,
    });
  };

  const handleCreateEntry = (data: LogbookEntryFormData, isDraft: boolean) => {
    const newEntry: LogbookEntryItem = {
      id: data.id || `entry-${Date.now()}`,
      entryDate: data.entryDate,
      hoursWorked: data.hoursWorked,
      activityDescription: data.activityDescription,
      skillsGained: data.skillsGained,
      challenges: data.challenges,
      attachmentName: data.attachmentName,
      status: isDraft ? "draft" : "submitted",
      submittedAt: isDraft ? undefined : new Date().toISOString(),
    };

    setEntries((prev) => [newEntry, ...prev.filter((e) => e.id !== newEntry.id)]);
    // Switch to All Entries view so student immediately sees their entry
    handleViewChange("all");
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Navigation Bar: Breadcrumbs & View Switcher Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs text-on-surface-variant font-medium">
          <Link href="/student" className="hover:text-primary transition-colors">
            Dashboard
          </Link>
          <ChevronRight className="size-3 text-outline" />
          <button
            onClick={() => handleViewChange("create")}
            className={`hover:text-primary transition-colors ${
              activeView === "create" ? "text-on-surface font-semibold" : ""
            }`}
          >
            Daily Logbook
          </button>
          {activeView === "all" && (
            <>
              <ChevronRight className="size-3 text-outline" />
              <span className="text-on-surface font-semibold">All Entries</span>
            </>
          )}
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center p-1 rounded-xl bg-surface-container-low border border-outline-variant/60 self-start sm:self-auto">
          <button
            onClick={() => handleViewChange("create")}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeView === "create"
                ? "bg-surface-container-lowest text-primary shadow-xs"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <PenSquare className="size-3.5" />
            <span>Add Daily Activity</span>
          </button>

          <button
            onClick={() => handleViewChange("all")}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeView === "all"
                ? "bg-surface-container-lowest text-primary shadow-xs"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <ListFilter className="size-3.5" />
            <span>All Entries</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeView === "all"
                  ? "bg-primary-fixed text-on-primary-fixed"
                  : "bg-surface-container text-on-surface-variant"
              }`}
            >
              {entries.length}
            </span>
          </button>
        </div>
      </div>

      {/* Main View Content */}
      {activeView === "create" ? (
        /* Primary Default View: Add Daily Activity Form + Right Sidebar */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Full-Page Form (8 cols on desktop) */}
          <div className="lg:col-span-8">
            <EntryForm
              onSubmit={handleCreateEntry}
              onCancel={() => handleViewChange("all")}
            />
          </div>

          {/* Right: Sidebar (4 cols on desktop) */}
          <div className="lg:col-span-4 lg:sticky lg:top-6">
            <LogbookSidebar
              recentEntries={entries}
              supervisorName={supervisorName}
              supervisorRole={supervisorRole}
              onViewAll={() => handleViewChange("all")}
            />
          </div>
        </div>
      ) : (
        /* Secondary View: All Entries Directory Table & Filters */
        <LogbookEntryList
          entries={entries}
          onNewEntry={() => handleViewChange("create")}
          onViewGuidelines={() => handleViewChange("create")}
        />
      )}
    </div>
  );
}
