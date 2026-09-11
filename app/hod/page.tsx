import React from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { eq, and, sql, inArray, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  department,
  placement,
  studentProfile,
  user,
  logbookEntry,
  organization,
  academicSession,
  program,
} from "@/db/schema";
import { HodDashboardView } from "@/components/hod/HodDashboardView";
import type { NeedsAttentionItem } from "@/components/hod/NeedsAttentionTable";
import type { PlacementOrgStat } from "@/components/hod/PlacementByOrgTable";

export const metadata: Metadata = {
  title: "HOD Dashboard — ULS EKSU SIWES",
  description: "Head of Department dashboard for SIWES placement and logbook management.",
};

export const dynamic = "force-dynamic";

export default async function HodDashboardPage() {
  let session = null;
  try {
    session = await auth.api.getSession({
      headers: await headers(),
    });
  } catch (err) {
    console.error("[HodDashboardPage] Error getting session:", err);
  }

  const departmentId = session?.user?.departmentId;

  // Fetch department name
  let departmentName = "Department";
  if (departmentId) {
    try {
      const [dept] = await db
        .select({ name: department.name })
        .from(department)
        .where(eq(department.id, departmentId))
        .limit(1);
      if (dept?.name) departmentName = dept.name;
    } catch (err) {
      console.error("[HodDashboardPage] Error fetching department:", err);
    }
  }

  // Fetch active session label
  let sessionLabel = "2025/2026";
  try {
    const [activeSession] = await db
      .select({ label: academicSession.label })
      .from(academicSession)
      .where(eq(academicSession.isActive, true))
      .limit(1);
    if (activeSession?.label) sessionLabel = activeSession.label;
  } catch (err) {
    console.error("[HodDashboardPage] Error fetching session:", err);
  }

  // ── Compute stats and build needs-attention + placement-by-org ──

  let stats = {
    totalStudents: 0,
    onPlacement: 0,
    withoutPlacement: 0,
    totalSupervisors: 0,
    studentsPerSupervisor: 0,
  };
  let needsAttention: NeedsAttentionItem[] = [];
  let placementByOrg: PlacementOrgStat[] = [];

  if (departmentId) {
    try {
      // 1. All students in this department
      const deptStudents = await db
        .select({
          profileId: studentProfile.id,
          studentName: user.name,
          matricNumber: studentProfile.matricNumber,
        })
        .from(studentProfile)
        .innerJoin(user, eq(studentProfile.userId, user.id))
        .where(eq(user.departmentId, departmentId));

      stats.totalStudents = deptStudents.length;
      const studentProfileIds = deptStudents.map((s) => s.profileId);

      // 2. All supervisors in this department
      const deptSupervisors = await db
        .select({ id: user.id })
        .from(user)
        .where(
          and(
            eq(user.role, "school_supervisor"),
            eq(user.departmentId, departmentId)
          )
        );
      stats.totalSupervisors = deptSupervisors.length;

      if (studentProfileIds.length > 0) {
        // 3. Placements for department students
        const deptPlacements = await db
          .select({
            id: placement.id,
            studentId: placement.studentId,
            organizationId: placement.organizationId,
            status: placement.status,
            createdAt: placement.createdAt,
          })
          .from(placement)
          .where(inArray(placement.studentId, studentProfileIds));

        // Students with active placement
        const studentsWithActivePlacement = new Set(
          deptPlacements
            .filter((p) => p.status === "active")
            .map((p) => p.studentId)
        );
        stats.onPlacement = studentsWithActivePlacement.size;
        stats.withoutPlacement = stats.totalStudents - studentsWithActivePlacement.size;

        // Students per supervisor
        stats.studentsPerSupervisor =
          stats.totalSupervisors > 0
            ? Math.round((stats.onPlacement / stats.totalSupervisors) * 10) / 10
            : 0;

        // 4. Overdue students: no entry with submittedAt within last 7 days
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        // Students who DO have a recent submission (any status, as long as submittedAt is set)
        const recentSubmitters = await db
          .select({ studentId: logbookEntry.studentId })
          .from(logbookEntry)
          .where(
            and(
              inArray(logbookEntry.studentId, studentProfileIds),
              sql`${logbookEntry.submittedAt} IS NOT NULL`,
              sql`${logbookEntry.submittedAt} >= ${sevenDaysAgo.toISOString()}`
            )
          )
          .groupBy(logbookEntry.studentId);

        const recentSubmitterIds = new Set(recentSubmitters.map((r) => r.studentId));

        // Only flag students who are on active placement but haven't submitted recently
        const overdueStudents = deptStudents.filter(
          (s) => studentsWithActivePlacement.has(s.profileId) && !recentSubmitterIds.has(s.profileId)
        );

        for (const s of overdueStudents) {
          // Find their last submitted entry to compute "days since"
          const [lastEntry] = await db
            .select({ submittedAt: logbookEntry.submittedAt })
            .from(logbookEntry)
            .where(
              and(
                eq(logbookEntry.studentId, s.profileId),
                sql`${logbookEntry.submittedAt} IS NOT NULL`
              )
            )
            .orderBy(desc(logbookEntry.submittedAt))
            .limit(1);

          const daysSince = lastEntry?.submittedAt
            ? Math.floor((Date.now() - new Date(lastEntry.submittedAt).getTime()) / (1000 * 60 * 60 * 24))
            : 999; // Never submitted

          needsAttention.push({
            studentProfileId: s.profileId,
            studentName: s.studentName,
            matricNumber: s.matricNumber || "—",
            issueType: "overdue_entries",
            daysSince,
            detail: lastEntry?.submittedAt ? `Last entry ${daysSince} days ago` : "Never submitted",
          });
        }

        // 5. Pending placements 30+ days
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const stalePending = deptPlacements.filter(
          (p) => p.status === "pending" && p.createdAt && new Date(p.createdAt) <= thirtyDaysAgo
        );

        for (const sp of stalePending) {
          const student = deptStudents.find((s) => s.profileId === sp.studentId);
          if (student) {
            const daysSince = Math.floor(
              (Date.now() - new Date(sp.createdAt).getTime()) / (1000 * 60 * 60 * 24)
            );
            needsAttention.push({
              studentProfileId: student.profileId,
              studentName: student.studentName,
              matricNumber: student.matricNumber || "—",
              issueType: "pending_placement",
              daysSince,
              detail: `Pending for ${daysSince} days`,
            });
          }
        }

        // Sort needs attention by daysSince descending
        needsAttention.sort((a, b) => b.daysSince - a.daysSince);

        // 6. Placement stats by organization
        const activePlacements = deptPlacements.filter((p) => p.status === "active" || p.status === "pending");
        const orgCountMap = new Map<string, number>();
        for (const p of activePlacements) {
          orgCountMap.set(p.organizationId, (orgCountMap.get(p.organizationId) || 0) + 1);
        }

        if (orgCountMap.size > 0) {
          const orgIds = Array.from(orgCountMap.keys());
          const orgs = await db
            .select({
              id: organization.id,
              name: organization.name,
              stateRegion: organization.stateRegion,
            })
            .from(organization)
            .where(inArray(organization.id, orgIds));

          placementByOrg = orgs
            .map((o) => ({
              organizationName: o.name,
              stateRegion: o.stateRegion,
              studentCount: orgCountMap.get(o.id) || 0,
            }))
            .sort((a, b) => b.studentCount - a.studentCount);
        }
      }
    } catch (err) {
      console.error("[HodDashboardPage] Error computing dashboard data:", err);
    }
  }

  return (
    <HodDashboardView
      hodName={session?.user?.name || "Department Head"}
      departmentName={departmentName}
      sessionName={sessionLabel}
      stats={stats}
      needsAttention={needsAttention}
      placementByOrg={placementByOrg}
    />
  );
}
