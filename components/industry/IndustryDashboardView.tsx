"use client";

import React from "react";
import { Users, CheckCircle2, Clock, AlertCircle, Info } from "lucide-react";
import { IndustryHeader } from "./IndustryHeader";
import { IndustryStudentList, type IndustryStudentItem } from "./IndustryStudentList";

interface IndustryDashboardViewProps {
  supervisorName: string;
  supervisorEmail: string;
  students: IndustryStudentItem[];
}

export function IndustryDashboardView({
  supervisorName,
  supervisorEmail,
  students,
}: IndustryDashboardViewProps) {
  const totalAssigned = students.length;
  const completedReviews = students.filter((s) => s.isReviewSubmitted).length;
  const pendingReviews = totalAssigned - completedReviews;

  return (
    <div className="min-h-screen bg-surface-container-low text-on-surface">
      <IndustryHeader supervisorName={supervisorName} supervisorEmail={supervisorEmail} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Welcome & Instruction Banner */}
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 p-6 shadow-xs relative overflow-hidden">
          <div className="max-w-3xl relative z-10">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold tracking-wide font-heading uppercase mb-2">
              <Info className="size-3" />
              Monthly SIWES Review Cycle
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">
              Welcome, {supervisorName || "Industry Supervisor"}
            </h1>
            <p className="font-sans text-sm text-on-surface-variant mt-1.5 leading-relaxed">
              As an accredited Industry Supervisor for Ekiti State University, your role is to periodically
              evaluate your assigned interns across 7 core workplace competencies at the end of each calendar month.
              Your evaluations contribute <strong>50%</strong> of each student&apos;s final university SIWES grade.
            </p>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-primary/5 to-transparent pointer-events-none hidden md:block" />
        </div>

        {/* Unassigned Warning Banner */}
        {totalAssigned === 0 && (
          <div className="rounded-xl bg-amber-50 border border-amber-200/80 p-4 text-xs text-amber-900 flex items-start gap-3 shadow-xs">
            <AlertCircle className="size-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-sm text-amber-950 font-heading">
                No Active Student Placements Assigned
              </h3>
              <p className="mt-1 text-amber-800 leading-relaxed font-sans">
                Your supervisor account is registered, but there are currently no approved Ekiti State University SIWES student placements linked to your supervision. Once your student registers their industrial attachment and the department confirms your assignment, your interns will automatically appear here.
              </p>
            </div>
          </div>
        )}

        {/* 3 Metric Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/60 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant font-heading">
                Assigned Interns
              </span>
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Users className="size-4" />
              </div>
            </div>
            <div className="font-heading text-3xl font-bold text-on-surface">{totalAssigned}</div>
            <div className="mt-2 text-[11px] text-on-surface-variant flex items-center gap-1">
              <span>Active student placements under your mentorship</span>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/60 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant font-heading">
                Reviews Completed
              </span>
              <div className="w-8 h-8 rounded-lg bg-success-container text-on-success-container flex items-center justify-center">
                <CheckCircle2 className="size-4" />
              </div>
            </div>
            <div className="font-heading text-3xl font-bold text-on-surface">{completedReviews}</div>
            <div className="mt-2 text-[11px] text-on-surface-variant flex items-center gap-1">
              <span>Monthly evaluations submitted this cycle</span>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/60 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant font-heading">
                Reviews Due
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center">
                <Clock className="size-4" />
              </div>
            </div>
            <div className="font-heading text-3xl font-bold text-on-surface">{pendingReviews}</div>
            <div className="mt-2 text-[11px] text-on-surface-variant flex items-center gap-1">
              <span>Awaiting monthly rubric score and attestation</span>
            </div>
          </div>
        </div>

        {/* Assigned Students Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading font-bold text-lg text-on-surface tracking-tight">
              Assigned Student Interns
            </h2>
          </div>
          <IndustryStudentList students={students} />
        </div>
      </main>
    </div>
  );
}
