"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  Search,
  Building,
  AlertCircle,
  FileCheck2,
} from "lucide-react";

export interface IndustryStudentItem {
  placementId: string;
  studentName: string;
  matricNumber: string | null;
  departmentName: string;
  organizationName: string;
  startDate: string;
  endDate: string;
  targetDays: number;
  daysPresent: number;
  completionPercent: number;
  currentMonth: string;
  isReviewSubmitted: boolean;
  currentScore: number | null;
}

interface IndustryStudentListProps {
  students: IndustryStudentItem[];
}

export function IndustryStudentList({ students }: IndustryStudentListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredStudents = students.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      s.studentName.toLowerCase().includes(q) ||
      (s.matricNumber && s.matricNumber.toLowerCase().includes(q)) ||
      s.departmentName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Search Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/60 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
          <input
            type="text"
            placeholder="Search by student name, matric no..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-xs rounded-lg bg-surface-container-low border border-outline-variant text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
        </div>

        <div className="text-xs text-on-surface-variant font-medium self-end sm:self-center">
          Showing <span className="font-semibold text-on-surface">{filteredStudents.length}</span> of{" "}
          <span className="font-semibold text-on-surface">{students.length}</span> assigned intern(s)
        </div>
      </div>

      {/* Student Cards */}
      {filteredStudents.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-xl bg-surface-container-lowest border border-outline-variant/60">
          <div className="w-12 h-12 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center mx-auto mb-3">
            <GraduationCap className="size-6" />
          </div>
          <h3 className="font-heading font-semibold text-sm text-on-surface mb-1">
            {searchQuery ? "No matching students found" : "No students currently assigned"}
          </h3>
          <p className="font-sans text-xs text-on-surface-variant max-w-sm mx-auto">
            {searchQuery
              ? "Try adjusting your search terms to find student records."
              : "When Ekiti State University students are assigned to your workplace, they will appear here for monthly evaluation."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredStudents.map((student) => (
            <div
              key={student.placementId}
              className="bg-surface-container-lowest rounded-xl border border-outline-variant/60 p-5 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-all"
            >
              <div>
                {/* Header: Student Name & Current Status Pill */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="font-heading font-bold text-base text-on-surface tracking-tight leading-snug">
                      {student.studentName}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-on-surface-variant">
                      <span className="font-mono font-medium text-[11px] px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface">
                        {student.matricNumber || "Matric Pending"}
                      </span>
                      <span>•</span>
                      <span>{student.departmentName}</span>
                    </div>
                  </div>

                  {student.isReviewSubmitted ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-success-container text-on-success-container shrink-0">
                      <CheckCircle2 className="size-3" />
                      <span>{student.currentScore !== null ? `${student.currentScore}%` : "Reviewed"}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 shrink-0">
                      <Clock className="size-3" />
                      <span>Review Due</span>
                    </span>
                  )}
                </div>

                {/* Training Period & Host Company */}
                <div className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/40 mb-4 space-y-1.5 text-xs text-on-surface-variant">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Building className="size-3.5 text-primary" />
                      <span className="font-medium text-on-surface">{student.organizationName}</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1.5 text-on-surface-variant/80">
                      <Calendar className="size-3" />
                      <span>
                        {student.startDate} to {student.endDate}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5 mb-5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-on-surface-variant font-medium">Training Attendance</span>
                    <span className="font-heading font-semibold text-on-surface">
                      {student.daysPresent} / {student.targetDays} days{" "}
                      <span className="text-[11px] text-on-surface-variant font-normal">
                        ({student.completionPercent}%)
                      </span>
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-surface-container-high overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${student.completionPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-outline-variant/40 flex items-center justify-between">
                <span className="text-[11px] text-on-surface-variant">
                  Cycle: <strong className="text-on-surface font-semibold">{student.currentMonth}</strong>
                </span>

                <Link
                  href={`/industry/review/${student.placementId}`}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    student.isReviewSubmitted
                      ? "bg-surface-container-high text-on-surface hover:bg-surface-container-highest border border-outline-variant/60"
                      : "bg-primary text-on-primary hover:bg-primary-container active:scale-[0.98] shadow-xs"
                  }`}
                >
                  {student.isReviewSubmitted ? (
                    <>
                      <FileCheck2 className="size-3.5 text-primary" />
                      <span>View / Update Review</span>
                    </>
                  ) : (
                    <>
                      <span>Complete Monthly Review</span>
                      <ArrowRight className="size-3.5" />
                    </>
                  )}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
