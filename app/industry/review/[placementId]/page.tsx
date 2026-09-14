import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { eq, and, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  placement,
  user,
  studentProfile,
  organization,
  department,
  logbookEntry,
  attendance,
  monthlyIndustryReview,
} from "@/db/schema";
import { IndustryHeader } from "@/components/industry/IndustryHeader";
import { MonthlyDigestCard, type MonthlyDigestEntry } from "@/components/industry/MonthlyDigestCard";
import { MonthlyReviewForm, type ExistingReviewData } from "@/components/industry/MonthlyReviewForm";
import { ArrowLeft, Building2, User } from "lucide-react";

export const metadata: Metadata = {
  title: "Monthly Student Evaluation · Industry Supervisor Portal",
  description: "Evaluate intern performance and submit scored rubric assessment.",
};

export const dynamic = "force-dynamic";

interface ReviewPageProps {
  params: Promise<{
    placementId: string;
  }>;
}

export default async function IndustryReviewPage({ params }: ReviewPageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    redirect("/login/industry");
  }

  if (session.user.role !== "industry_supervisor") {
    redirect("/login/industry");
  }

  const { placementId } = await params;

  // 1. Fetch placement record and verify ownership
  const [placementRecord] = await db
    .select({
      id: placement.id,
      industrySupervisorId: placement.industrySupervisorId,
      startDate: placement.startDate,
      endDate: placement.endDate,
      targetDays: placement.targetDays,
      status: placement.status,
      studentId: placement.studentId,
      organizationId: placement.organizationId,
      organizationName: organization.name,
      studentUserId: studentProfile.userId,
      matricNumber: studentProfile.matricNumber,
      studentName: user.name,
      studentEmail: user.email,
      departmentId: user.departmentId,
    })
    .from(placement)
    .innerJoin(studentProfile, eq(placement.studentId, studentProfile.id))
    .innerJoin(user, eq(studentProfile.userId, user.id))
    .innerJoin(organization, eq(placement.organizationId, organization.id))
    .where(eq(placement.id, placementId))
    .limit(1);

  if (!placementRecord) {
    notFound();
  }

  // Security check: Must be assigned to this supervisor
  if (placementRecord.industrySupervisorId !== session.user.id) {
    return (
      <div className="min-h-screen bg-surface-container-low flex items-center justify-center p-4">
        <div className="bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant/60 max-w-md text-center">
          <h2 className="font-heading font-bold text-lg text-on-surface mb-2">Access Unauthorized</h2>
          <p className="font-sans text-xs text-on-surface-variant mb-6">
            You are not designated as the Industry Supervisor for this placement.
          </p>
          <Link
            href="/industry"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary rounded-lg text-xs font-medium"
          >
            <ArrowLeft className="size-3.5" />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  // 2. Department name
  let departmentName = "Department";
  if (placementRecord.departmentId) {
    const [dept] = await db
      .select({ name: department.name })
      .from(department)
      .where(eq(department.id, placementRecord.departmentId))
      .limit(1);
    if (dept) departmentName = dept.name;
  }

  // Current review month (YYYY-MM)
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // 3. Fetch daily logbook entries for the current month
  const rawEntries = await db
    .select({
      id: logbookEntry.id,
      entryDate: logbookEntry.entryDate,
      hoursWorked: logbookEntry.hoursWorked,
      activityDescription: logbookEntry.activityDescription,
      status: logbookEntry.status,
    })
    .from(logbookEntry)
    .where(
      and(
        eq(logbookEntry.placementId, placementId),
        eq(logbookEntry.studentId, placementRecord.studentId)
      )
    )
    .orderBy(desc(logbookEntry.entryDate));

  // Filter entries to the current review month
  const monthEntries: MonthlyDigestEntry[] = rawEntries
    .filter((e) => e.entryDate.startsWith(currentMonth))
    .map((e) => ({
      id: e.id,
      entryDate: e.entryDate,
      hoursWorked: parseFloat(e.hoursWorked) || 0,
      activityDescription: e.activityDescription,
      status: e.status,
    }));

  const totalMonthHours = monthEntries.reduce((acc, curr) => acc + curr.hoursWorked, 0);

  // 4. Fetch attendance records for the month
  const attendanceRecords = await db
    .select({
      date: attendance.date,
      status: attendance.status,
    })
    .from(attendance)
    .where(eq(attendance.placementId, placementId));

  const monthAttendance = attendanceRecords.filter((a) => a.date.startsWith(currentMonth));
  const daysPresent = monthAttendance.filter((a) => a.status === "present").length;

  // 5. Fetch existing review for this month if already submitted
  const [existing] = await db
    .select()
    .from(monthlyIndustryReview)
    .where(
      and(
        eq(monthlyIndustryReview.placementId, placementId),
        eq(monthlyIndustryReview.reviewMonth, currentMonth)
      )
    )
    .limit(1);

  const existingReviewData: ExistingReviewData | null = existing
    ? {
        id: existing.id,
        reviewMonth: existing.reviewMonth,
        scores: existing.scores,
        comment: existing.comment,
        attestationName: existing.attestationName,
        attestationOfficeId: existing.attestationOfficeId,
        reviewedAt: existing.reviewedAt.toISOString(),
      }
    : null;

  return (
    <div className="min-h-screen bg-surface-container-low text-on-surface pb-12">
      <IndustryHeader
        supervisorName={session.user.name}
        supervisorEmail={session.user.email}
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Navigation Breadcrumb */}
        <div>
          <Link
            href="/industry"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline mb-3"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back to Interns Roster</span>
          </Link>

          {/* Student Profile Header Card */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/60 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-heading font-bold text-lg border border-primary/20 shrink-0">
                <User className="size-6" />
              </div>
              <div>
                <h1 className="font-heading text-xl font-bold text-on-surface tracking-tight">
                  {placementRecord.studentName}
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-on-surface-variant">
                  <span className="font-mono px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface">
                    {placementRecord.matricNumber || "Matric No Pending"}
                  </span>
                  <span>•</span>
                  <span>{departmentName}</span>
                </div>
              </div>
            </div>

            <div className="text-right text-xs text-on-surface-variant border-t sm:border-t-0 pt-3 sm:pt-0 border-outline-variant/40">
              <p className="font-semibold text-on-surface">{placementRecord.organizationName}</p>
              <p className="text-[11px] text-on-surface-variant/80">
                {placementRecord.startDate} to {placementRecord.endDate}
              </p>
            </div>
          </div>
        </div>

        {/* Read-only Monthly Activity Digest */}
        <MonthlyDigestCard
          month={currentMonth}
          daysPresent={daysPresent}
          totalHours={totalMonthHours}
          entries={monthEntries}
        />

        {/* 7-Criteria Performance Review Form */}
        <MonthlyReviewForm
          placementId={placementId}
          studentName={placementRecord.studentName}
          defaultSupervisorName={session.user.name}
          currentMonth={currentMonth}
          existingReview={existingReviewData}
        />
      </main>
    </div>
  );
}
