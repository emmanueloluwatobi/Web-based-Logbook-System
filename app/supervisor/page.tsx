import React from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { eq, and, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  department,
  placement,
  studentProfile,
  user,
  logbookEntry,
  organization,
  supervisorFeedback,
} from "@/db/schema";
import { SupervisorDashboardView } from "@/components/supervisor/SupervisorDashboardView";
import type { ReviewQueueItem } from "@/components/supervisor/SupervisorReviewQueue";

export const metadata: Metadata = {
  title: "Supervisor Dashboard — ULS EKSU SIWES",
  description: "Ekiti State University Academic Supervisor Hub and Logbook Review Queue.",
};

export const dynamic = "force-dynamic";

export default async function SupervisorDashboardPage() {
  let session = null;
  try {
    session = await auth.api.getSession({
      headers: await headers(),
    });
  } catch (err) {
    console.error("[SupervisorDashboardPage] Error getting session:", err);
  }

  let departmentName = "Computer Science";
  if (session?.user?.departmentId) {
    try {
      const [dept] = await db
        .select()
        .from(department)
        .where(eq(department.id, session.user.departmentId))
        .limit(1);
      if (dept?.name) {
        departmentName = dept.name;
      }
    } catch (err) {
      console.error("[SupervisorDashboardPage] Error fetching department:", err);
    }
  }

  // Fetch real stats and review queue if authenticated as supervisor
  let stats = { totalStudents: 0, awaitingReview: 0, approvedEntries: 0, rejectedEntries: 0 };
  let reviewQueue: ReviewQueueItem[] = [];
  let sessionLabel = "2025/2026";

  if (session?.user?.id) {
    try {
      // Find all placements assigned to this supervisor
      const assignedPlacements = await db
        .select({
          placement: placement,
          profile: studentProfile,
          studentUser: user,
          org: organization,
        })
        .from(placement)
        .innerJoin(studentProfile, eq(placement.studentId, studentProfile.id))
        .innerJoin(user, eq(studentProfile.userId, user.id))
        .innerJoin(organization, eq(placement.organizationId, organization.id))
        .where(eq(placement.schoolSupervisorId, session.user.id));

      const assignedStudentIds = assignedPlacements.map((p) => p.profile.id);
      stats.totalStudents = assignedStudentIds.length;

      if (assignedStudentIds.length > 0) {
        // Fetch all entries for assigned students to compute stats
        const allEntries = await db
          .select({
            id: logbookEntry.id,
            status: logbookEntry.status,
            studentId: logbookEntry.studentId,
          })
          .from(logbookEntry)
          .where(
            // Drizzle doesn't have a direct inArray for dynamic arrays with the same ease,
            // so we query per-student and aggregate. For a small number of students this is fine.
            eq(logbookEntry.studentId, assignedStudentIds[0])
          );

        // Fetch entries for all assigned students
        let allStudentEntries: { id: string; status: string; studentId: string }[] = [];
        for (const studentId of assignedStudentIds) {
          const entries = await db
            .select({
              id: logbookEntry.id,
              status: logbookEntry.status,
              studentId: logbookEntry.studentId,
            })
            .from(logbookEntry)
            .where(eq(logbookEntry.studentId, studentId));

          allStudentEntries = allStudentEntries.concat(entries);
        }

        stats.awaitingReview = allStudentEntries.filter((e) => e.status === "submitted").length;
        stats.approvedEntries = allStudentEntries.filter((e) => e.status === "approved").length;
        stats.rejectedEntries = allStudentEntries.filter(
          (e) => e.status === "needs_correction" || e.status === "rejected"
        ).length;

        // Build review queue: submitted entries with student info
        const submittedEntries = await db
          .select({
            entry: logbookEntry,
            profile: studentProfile,
            studentUser: user,
          })
          .from(logbookEntry)
          .innerJoin(studentProfile, eq(logbookEntry.studentId, studentProfile.id))
          .innerJoin(user, eq(studentProfile.userId, user.id))
          .where(eq(logbookEntry.status, "submitted"))
          .orderBy(desc(logbookEntry.submittedAt));

        // Filter to only entries belonging to this supervisor's students
        const studentIdSet = new Set(assignedStudentIds);
        const filteredSubmitted = submittedEntries.filter((row) =>
          studentIdSet.has(row.profile.id)
        );

        // Build lookup map for org names
        const orgMap = new Map(
          assignedPlacements.map((p) => [p.profile.id, p.org.name])
        );

        reviewQueue = filteredSubmitted.map((row) => {
          const entryDate = (() => {
            try {
              const [year, month, day] = row.entry.entryDate.split("-");
              const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
              return d.toLocaleDateString("en-US", {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
              });
            } catch {
              return row.entry.entryDate;
            }
          })();

          const submittedAt = row.entry.submittedAt
            ? (() => {
                const now = new Date();
                const sub = new Date(row.entry.submittedAt);
                const diffMs = now.getTime() - sub.getTime();
                const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                if (diffDays === 0) {
                  return `Today, ${sub.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`;
                } else if (diffDays === 1) {
                  return `Yesterday, ${sub.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`;
                } else {
                  return `${diffDays} days ago`;
                }
              })()
            : "—";

          return {
            id: row.entry.id,
            studentId: row.profile.id,
            studentName: row.studentUser.name,
            matricNumber: row.profile.matricNumber || "—",
            organizationName: orgMap.get(row.profile.id) || "—",
            entryDate,
            weekNumber: 1,
            dayNumber: 1,
            titleSnippet:
              row.entry.activityDescription.length > 100
                ? row.entry.activityDescription.slice(0, 100) + "…"
                : row.entry.activityDescription,
            submittedAt,
            versionNumber: row.entry.versionNumber,
            status: "submitted" as const,
          };
        });
      }

      // Fetch active session label
      const { academicSession } = await import("@/db/schema");
      const [activeSession] = await db
        .select()
        .from(academicSession)
        .where(eq(academicSession.isActive, true))
        .limit(1);
      if (activeSession) {
        sessionLabel = activeSession.label;
      }
    } catch (err) {
      console.error("[SupervisorDashboardPage] Error fetching dashboard data:", err);
    }
  }

  return (
    <SupervisorDashboardView
      supervisorName={session?.user?.name || "Supervisor"}
      departmentName={departmentName}
      sessionName={sessionLabel}
      stats={stats}
      reviewQueue={reviewQueue}
    />
  );
}
