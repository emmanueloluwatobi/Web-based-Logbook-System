"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Users,
  GraduationCap,
  Building2,
  UserCheck,
  UserX,
  ChevronRight,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

export type PlacementFilterStatus = "all" | "active" | "pending" | "unplaced" | "completed";

export interface HodStudentItem {
  profileId: string;
  studentName: string;
  email: string;
  matricNumber: string | null;
  programName: string | null;
  level: string | null;
  placementStatus: "active" | "pending" | "completed" | "unplaced";
  placementId?: string | null;
  organizationName?: string | null;
  supervisorName?: string | null;
  supervisorId?: string | null;
}

interface HodStudentRosterProps {
  students: HodStudentItem[];
  departmentName: string;
}

export function HodStudentRoster({ students, departmentName }: HodStudentRosterProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<PlacementFilterStatus>("all");

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      // Status filter
      if (statusFilter !== "all") {
        if (s.placementStatus !== statusFilter) return false;
      }

      // Search term
      if (searchTerm.trim() !== "") {
        const term = searchTerm.toLowerCase();
        const matchesName = s.studentName.toLowerCase().includes(term);
        const matchesMatric = s.matricNumber?.toLowerCase().includes(term) ?? false;
        const matchesProgram = s.programName?.toLowerCase().includes(term) ?? false;
        const matchesEmail = s.email.toLowerCase().includes(term);
        const matchesSupervisor = s.supervisorName?.toLowerCase().includes(term) ?? false;
        const matchesOrg = s.organizationName?.toLowerCase().includes(term) ?? false;

        return (
          matchesName ||
          matchesMatric ||
          matchesProgram ||
          matchesEmail ||
          matchesSupervisor ||
          matchesOrg
        );
      }

      return true;
    });
  }, [students, searchTerm, statusFilter]);

  // Counts for filter pills
  const counts = useMemo(() => {
    return {
      all: students.length,
      active: students.filter((s) => s.placementStatus === "active").length,
      pending: students.filter((s) => s.placementStatus === "pending").length,
      unplaced: students.filter((s) => s.placementStatus === "unplaced").length,
      completed: students.filter((s) => s.placementStatus === "completed").length,
    };
  }, [students]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-on-surface">
            Department Students
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Full student roster and placement status for {departmentName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high text-xs font-semibold text-on-surface-variant">
            <Users className="size-3.5 text-primary" />
            <span>{students.length} Total Registered</span>
          </span>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-on-surface-variant" />
            <input
              type="text"
              placeholder="Search by name, matric no, program, or supervisor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary transition-colors placeholder:text-on-surface-variant/60"
            />
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {(
              [
                { id: "all", label: "All Students", count: counts.all },
                { id: "active", label: "On Placement", count: counts.active },
                { id: "pending", label: "Pending", count: counts.pending },
                { id: "unplaced", label: "Unplaced", count: counts.unplaced },
                { id: "completed", label: "Completed", count: counts.completed },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  statusFilter === tab.id
                    ? "bg-primary text-on-primary shadow-xs font-semibold"
                    : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    statusFilter === tab.id
                      ? "bg-white/20 text-white"
                      : "bg-surface-container-high text-on-surface-variant"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Student Roster Table Card */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-xs overflow-hidden">
        {filteredStudents.length === 0 ? (
          <div className="p-12 text-center">
            <div className="size-12 rounded-full bg-surface-container-high mx-auto flex items-center justify-center mb-3">
              <Users className="size-6 text-on-surface-variant" />
            </div>
            <h3 className="font-heading font-semibold text-on-surface text-base">
              No students found
            </h3>
            <p className="text-sm text-on-surface-variant mt-1 max-w-sm mx-auto">
              {searchTerm || statusFilter !== "all"
                ? "Try adjusting your search criteria or clearing status filters."
                : "No students are currently registered in this department."}
            </p>
            {(searchTerm || statusFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                }}
                className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-container-low/60 border-b border-outline-variant text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-5">Student</th>
                  <th className="py-3.5 px-4">Matric No</th>
                  <th className="py-3.5 px-4">Program & Level</th>
                  <th className="py-3.5 px-4">Placement Status</th>
                  <th className="py-3.5 px-4">School Supervisor</th>
                  <th className="py-3.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/60">
                {filteredStudents.map((s) => (
                  <tr
                    key={s.profileId}
                    onClick={() => router.push(`/hod/students/${s.profileId}`)}
                    className="cursor-pointer hover:bg-surface-container-low transition-colors group"
                  >
                    {/* Student Name + Email */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                          {s.studentName
                            .split(" ")
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-on-surface group-hover:text-primary transition-colors">
                            {s.studentName}
                          </div>
                          <div className="text-xs text-on-surface-variant">{s.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Matric No */}
                    <td className="py-3.5 px-4">
                      {s.matricNumber ? (
                        <span className="font-mono text-xs font-semibold text-on-surface bg-surface-container-low px-2 py-0.5 rounded">
                          {s.matricNumber}
                        </span>
                      ) : (
                        <span className="text-xs text-on-surface-variant/70 italic">Not set</span>
                      )}
                    </td>

                    {/* Program & Level */}
                    <td className="py-3.5 px-4">
                      <div className="text-xs font-medium text-on-surface">
                        {s.programName || "General"}
                      </div>
                      <div className="text-[11px] text-on-surface-variant">
                        {s.level ? `${s.level} Level` : "Level not set"}
                      </div>
                    </td>

                    {/* Placement Status */}
                    <td className="py-3.5 px-4">
                      {s.placementStatus === "active" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-success-container text-on-success-container text-xs font-medium">
                          <CheckCircle2 className="size-3" />
                          <span>On Placement</span>
                        </span>
                      ) : s.placementStatus === "pending" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-warning-container text-on-warning-container text-xs font-medium">
                          <Clock className="size-3" />
                          <span>Pending Approval</span>
                        </span>
                      ) : s.placementStatus === "completed" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-xs font-medium">
                          <CheckCircle2 className="size-3" />
                          <span>Completed</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-error-container text-on-error-container text-xs font-medium">
                          <AlertCircle className="size-3" />
                          <span>Unplaced</span>
                        </span>
                      )}
                      {s.organizationName && (
                        <div className="text-[11px] text-on-surface-variant truncate max-w-[180px] mt-0.5">
                          {s.organizationName}
                        </div>
                      )}
                    </td>

                    {/* School Supervisor */}
                    <td className="py-3.5 px-4">
                      {s.supervisorName ? (
                        <div className="flex items-center gap-1.5 text-xs text-on-surface">
                          <UserCheck className="size-3.5 text-emerald-600 shrink-0" />
                          <span className="font-medium truncate max-w-[160px]">
                            {s.supervisorName}
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-300 font-medium">
                          <UserX className="size-3 shrink-0" />
                          <span>Unassigned</span>
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-5 text-right">
                      <Link
                        href={`/hod/students/${s.profileId}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-container transition-colors"
                      >
                        <span>Manage</span>
                        <ChevronRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer info */}
        {filteredStudents.length > 0 && (
          <div className="py-3 px-5 bg-surface-container-low/40 border-t border-outline-variant flex items-center justify-between text-xs text-on-surface-variant">
            <span>
              Showing {filteredStudents.length} of {students.length} students
            </span>
            <span className="italic">Click any student to assign a supervisor or configure placement</span>
          </div>
        )}
      </div>
    </div>
  );
}
