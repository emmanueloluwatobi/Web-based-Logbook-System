import React from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { eq, and, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  studentProfile,
  user,
  placement,
  organization,
  logbookEntry,
  supervisorFeedback,
  department,
} from "@/db/schema";
import { StudentReviewView } from "@/components/supervisor/StudentReviewView";
import type { ReviewEntryData } from "@/components/supervisor/EntryReviewCard";

export const metadata: Metadata = {
  title: "Student Review — ULS EKSU SIWES",
  description: "Review logbook entries for an assigned student.",
};

export const dynamic = "force-dynamic";

export default async function SupervisorStudentReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: studentProfileId } = await params;

  let session = null;
  try {
    session = await auth.api.getSession({
      headers: await headers(),
    });
  } catch (err) {
    console.error("[SupervisorStudentReviewPage] Error getting session:", err);
  }

  if (!session || session.user.role !== "school_supervisor") {
    notFound();
  }

  // Verify this student is assigned to the current supervisor via placement
  const [studentPlacement] = await db
    .select({
      placement: placement,
      org: organization,
    })
    .from(placement)
    .innerJoin(organization, eq(placement.organizationId, organization.id))
    .where(
      and(
        eq(placement.studentId, studentProfileId),
        eq(placement.schoolSupervisorId, session.user.id)
      )
    )
    .limit(1);

  if (!studentPlacement) {
    notFound();
  }

  // Fetch student profile + user details
  const [studentData] = await db
    .select({
      profile: studentProfile,
      user: user,
      department: department,
    })
    .from(studentProfile)
    .innerJoin(user, eq(studentProfile.userId, user.id))
    .leftJoin(department, eq(user.departmentId, department.id))
    .where(eq(studentProfile.id, studentProfileId))
    .limit(1);

  if (!studentData) {
    notFound();
  }

  // Fetch all entries for this student, joined with feedback
  const entriesWithFeedback = await db
    .select({
      entry: logbookEntry,
      feedbackAction: supervisorFeedback.action,
      feedbackComment: supervisorFeedback.comment,
      feedbackCreatedAt: supervisorFeedback.createdAt,
      reviewerName: user.name,
    })
    .from(logbookEntry)
    .leftJoin(supervisorFeedback, eq(logbookEntry.id, supervisorFeedback.entryId))
    .leftJoin(user, eq(supervisorFeedback.supervisorId, user.id))
    .where(eq(logbookEntry.studentId, studentProfileId))
    .orderBy(desc(logbookEntry.entryDate));

  // Shape entries for the client component
  const entries: ReviewEntryData[] = entriesWithFeedback.map((row) => ({
    id: row.entry.id,
    entryDate: row.entry.entryDate,
    activityDescription: row.entry.activityDescription,
    skillsGained: row.entry.skillsGained,
    challenges: row.entry.challenges,
    hoursWorked: row.entry.hoursWorked,
    status: row.entry.status as ReviewEntryData["status"],
    versionNumber: row.entry.versionNumber,
    parentEntryId: row.entry.parentEntryId,
    attachmentUrl: row.entry.attachmentUrl,
    submittedAt: row.entry.submittedAt,
    feedback: row.feedbackAction
      ? {
          action: row.feedbackAction as "approved" | "rejected",
          comment: row.feedbackComment,
          supervisorName: row.reviewerName || "Supervisor",
          createdAt: row.feedbackCreatedAt
            ? row.feedbackCreatedAt.toISOString()
            : new Date().toISOString(),
        }
      : null,
  }));

  // Calculate stats
  const stats = {
    total: entries.length,
    submitted: entries.filter((e) => e.status === "submitted").length,
    approved: entries.filter((e) => e.status === "approved").length,
    needsCorrection: entries.filter((e) => e.status === "needs_correction").length,
    draft: entries.filter((e) => e.status === "draft").length,
  };

  // Format placement dates for display
  const formatPlacementDate = (dateStr: string): string => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  return (
    <StudentReviewView
      student={{
        profileId: studentData.profile.id,
        name: studentData.user.name,
        matricNumber: studentData.profile.matricNumber,
        departmentName: studentData.department?.name || null,
        organizationName: studentPlacement.org.name,
        placementStart: formatPlacementDate(studentPlacement.placement.startDate),
        placementEnd: formatPlacementDate(studentPlacement.placement.endDate),
        placementStatus: studentPlacement.placement.status,
      }}
      entries={entries}
      stats={stats}
    />
  );
}
