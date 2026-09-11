"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  UserCheck,
  Users,
  GraduationCap,
  Mail,
  ShieldCheck,
  Info,
  ChevronRight,
} from "lucide-react";

export interface HodSupervisorItem {
  id: string;
  name: string;
  email: string;
  assignedStudentCount: number;
}

interface HodSupervisorRosterProps {
  supervisors: HodSupervisorItem[];
  departmentName: string;
}

export function HodSupervisorRoster({
  supervisors,
  departmentName,
}: HodSupervisorRosterProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredSupervisors = useMemo(() => {
    if (!searchTerm.trim()) return supervisors;
    const term = searchTerm.toLowerCase();
    return supervisors.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        s.email.toLowerCase().includes(term)
    );
  }, [supervisors, searchTerm]);

  const totalAssigned = useMemo(() => {
    return supervisors.reduce((sum, s) => sum + s.assignedStudentCount, 0);
  }, [supervisors]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-on-surface">
            Department Supervisors
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            School supervisors and student assignment workloads for {departmentName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high text-xs font-semibold text-on-surface-variant">
            <UserCheck className="size-3.5 text-primary" />
            <span>{supervisors.length} Supervisors</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-xs font-semibold text-primary">
            <Users className="size-3.5" />
            <span>{totalAssigned} Students Assigned</span>
          </span>
        </div>
      </div>

      {/* Info notice explaining supervisor management */}
      <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/60 flex items-start gap-3">
        <Info className="size-4 text-primary shrink-0 mt-0.5" />
        <div className="text-xs text-on-surface-variant leading-relaxed">
          <span className="font-semibold text-on-surface">Supervisor Roster:</span> Supervisor accounts are provisioned by university administrators. To assign a supervisor to a student, visit the{" "}
          <Link
            href="/hod/students"
            className="text-primary font-semibold hover:underline"
          >
            Students
          </Link>{" "}
          page and select the target student.
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 shadow-xs">
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Search supervisors by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary transition-colors placeholder:text-on-surface-variant/60"
          />
        </div>
      </div>

      {/* Supervisors Table Card */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-xs overflow-hidden">
        {filteredSupervisors.length === 0 ? (
          <div className="p-12 text-center">
            <div className="size-12 rounded-full bg-surface-container-high mx-auto flex items-center justify-center mb-3">
              <UserCheck className="size-6 text-on-surface-variant" />
            </div>
            <h3 className="font-heading font-semibold text-on-surface text-base">
              No supervisors found
            </h3>
            <p className="text-sm text-on-surface-variant mt-1 max-w-sm mx-auto">
              {searchTerm
                ? "No supervisors match your search term."
                : "No school supervisors are currently registered in this department."}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-container-low/60 border-b border-outline-variant text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-5">Supervisor</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4 text-center">Assigned Students</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/60">
                {filteredSupervisors.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-surface-container-low transition-colors"
                  >
                    {/* Supervisor Name + Email */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-emerald-500/10 text-emerald-700 font-bold text-xs flex items-center justify-center shrink-0">
                          {s.name
                            .split(" ")
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-on-surface">
                            {s.name}
                          </div>
                          <div className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                            <Mail className="size-3" />
                            <span>{s.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-xs font-medium">
                        <ShieldCheck className="size-3" />
                        <span>School Supervisor</span>
                      </span>
                    </td>

                    {/* Department */}
                    <td className="py-3.5 px-4">
                      <span className="text-xs text-on-surface font-medium">
                        {departmentName}
                      </span>
                    </td>

                    {/* Assigned Student Count */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                          s.assignedStudentCount > 0
                            ? "bg-primary/10 text-primary"
                            : "bg-surface-container-high text-on-surface-variant"
                        }`}
                      >
                        <Users className="size-3" />
                        <span>
                          {s.assignedStudentCount}{" "}
                          {s.assignedStudentCount === 1 ? "student" : "students"}
                        </span>
                      </span>
                    </td>

                    {/* Action link */}
                    <td className="py-3.5 px-5 text-right">
                      <Link
                        href="/hod/students"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-container transition-colors"
                      >
                        <span>Assign Students</span>
                        <ChevronRight className="size-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        {filteredSupervisors.length > 0 && (
          <div className="py-3 px-5 bg-surface-container-low/40 border-t border-outline-variant flex items-center justify-between text-xs text-on-surface-variant">
            <span>
              Showing {filteredSupervisors.length} of {supervisors.length} supervisors
            </span>
            <span className="italic">
              Average workload:{" "}
              {supervisors.length > 0
                ? Math.round((totalAssigned / supervisors.length) * 10) / 10
                : 0}{" "}
              students / supervisor
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
