"use server";

import { eq, and, inArray, desc, gte } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import {
  placement,
  studentProfile,
  user,
  department,
  logbookEntry,
  notificationLog,
} from "@/db/schema";
import { auth } from "@/lib/auth";
import { sendOverdueSummaryEmail, logNotification } from "@/lib/resend";

export interface OverdueCheckResult {
  success: boolean;
  error?: string;
  data?: {
    departmentsProcessed: number;
    departmentsNotified: number;
    departmentsSkippedDueToRateLimit: number;
    totalOverdueCount: number;
  };
}

export interface OverdueCheckOptions {
  force?: boolean;
  cronSecret?: string;
}

/**
 * Feature 15: Scans active placements for students who have not submitted
 * any logbook entries in the last 7+ calendar days, groups them by department,
 * and emails an inactivity digest to the departmental HOD.
 *
 * Security:
 * - Requires either an internal verified cron secret, or an authenticated Admin/HOD session.
 * - HOD callers are strictly scoped to their own department.
 * - The force bypass is restricted to Admin callers and verified cron runners.
 */
export async function triggerOverdueNotificationCheck(
  options?: OverdueCheckOptions
): Promise<OverdueCheckResult> {
  try {
    // 1. Authorize caller
    let isAuthorized = false;
    let callerRole: string | null = null;
    let callerDepartmentId: string | null = null;

    const validCronSecret = process.env.CRON_SECRET;
    const incomingHeaders = await headers();
    const authHeader = incomingHeaders.get("authorization");
    const customHeader = incomingHeaders.get("x-cron-secret");

    const candidateSecret =
      options?.cronSecret ||
      (authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null) ||
      customHeader;

    if (
      validCronSecret &&
      candidateSecret &&
      candidateSecret === validCronSecret
    ) {
      isAuthorized = true;
      callerRole = "cron";
    } else {
      const session = await auth.api.getSession({
        headers: incomingHeaders,
      });

      if (session?.user && (session.user.role === "admin" || session.user.role === "hod")) {
        isAuthorized = true;
        callerRole = session.user.role;
        callerDepartmentId = session.user.departmentId || null;
      }
    }

    if (!isAuthorized) {
      return {
        success: false,
        error: "Unauthorized: You do not have permission to trigger overdue notification scans.",
      };
    }

    // Force bypass is strictly reserved for admins or verified cron runners
    const allowForce = (callerRole === "admin" || callerRole === "cron") && Boolean(options?.force);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 2. Fetch active placements with student user details
    const activePlacements = await db
      .select({
        placementId: placement.id,
        startDate: placement.startDate,
        studentProfileId: studentProfile.id,
        matricNumber: studentProfile.matricNumber,
        studentName: user.name,
        studentEmail: user.email,
        departmentId: user.departmentId,
        schoolSupervisorId: placement.schoolSupervisorId,
      })
      .from(placement)
      .innerJoin(studentProfile, eq(placement.studentId, studentProfile.id))
      .innerJoin(user, eq(studentProfile.userId, user.id))
      .where(eq(placement.status, "active"));

    // Filter to caller's department if caller is HOD
    const targetPlacements =
      callerRole === "hod" && callerDepartmentId
        ? activePlacements.filter((p) => p.departmentId === callerDepartmentId)
        : activePlacements;

    if (!targetPlacements || targetPlacements.length === 0) {
      return {
        success: true,
        data: {
          departmentsProcessed: 0,
          departmentsNotified: 0,
          departmentsSkippedDueToRateLimit: 0,
          totalOverdueCount: 0,
        },
      };
    }

    // Cache supervisor names to avoid duplicate queries
    const supervisorNames = new Map<string, string>();
    const supervisorIds = Array.from(
      new Set(
        activePlacements
          .map((p) => p.schoolSupervisorId)
          .filter((id): id is string => Boolean(id))
      )
    );

    if (supervisorIds.length > 0) {
      const supervisors = await db
        .select({ id: user.id, name: user.name })
        .from(user)
        .where(inArray(user.id, supervisorIds));

      for (const sup of supervisors) {
        supervisorNames.set(sup.id, sup.name);
      }
    }

    // 2. Identify overdue students grouped by department
    interface OverdueStudentItem {
      name: string;
      matricNumber?: string | null;
      daysSinceLastEntry: number;
      supervisorName?: string | null;
    }

    const departmentOverdueMap = new Map<string, OverdueStudentItem[]>();

    for (const p of targetPlacements) {
      if (!p.departmentId) continue;

      // Find student's most recent submitted, approved, or needs_correction entry
      const [latestEntry] = await db
        .select({ entryDate: logbookEntry.entryDate })
        .from(logbookEntry)
        .where(
          and(
            eq(logbookEntry.studentId, p.studentProfileId),
            inArray(logbookEntry.status, ["submitted", "approved", "needs_correction"])
          )
        )
        .orderBy(desc(logbookEntry.entryDate))
        .limit(1);

      const referenceDateStr = latestEntry ? latestEntry.entryDate : p.startDate;
      const referenceDate = new Date(referenceDateStr);
      referenceDate.setHours(0, 0, 0, 0);

      const diffMs = today.getTime() - referenceDate.getTime();
      const daysInactive = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

      if (daysInactive >= 7) {
        const studentItem: OverdueStudentItem = {
          name: p.studentName,
          matricNumber: p.matricNumber,
          daysSinceLastEntry: daysInactive,
          supervisorName: p.schoolSupervisorId ? supervisorNames.get(p.schoolSupervisorId) || null : null,
        };

        const currentList = departmentOverdueMap.get(p.departmentId) || [];
        currentList.push(studentItem);
        departmentOverdueMap.set(p.departmentId, currentList);
      }
    }

    let departmentsNotified = 0;
    let departmentsSkippedDueToRateLimit = 0;
    let totalOverdueCount = 0;

    // 3. For each department with overdue students, email the active HOD
    for (const [deptId, overdueList] of departmentOverdueMap.entries()) {
      totalOverdueCount += overdueList.length;

      const [deptRecord] = await db
        .select({ name: department.name })
        .from(department)
        .where(eq(department.id, deptId))
        .limit(1);

      const deptName = deptRecord ? deptRecord.name : "Academic Department";

      // Find the HOD assigned to this department
      const [hodUser] = await db
        .select({ id: user.id, name: user.name, email: user.email })
        .from(user)
        .where(and(eq(user.departmentId, deptId), eq(user.role, "hod")))
        .limit(1);

      if (hodUser) {
        // Idempotency check: Has an overdue_summary already been sent to this HOD in the last 24 hours?
        if (!allowForce) {
          const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          const [recentNotification] = await db
            .select({ id: notificationLog.id })
            .from(notificationLog)
            .where(
              and(
                eq(notificationLog.userId, hodUser.id),
                eq(notificationLog.type, "overdue_summary"),
                gte(notificationLog.sentAt, twentyFourHoursAgo)
              )
            )
            .limit(1);

          if (recentNotification) {
            departmentsSkippedDueToRateLimit++;
            continue;
          }
        }

        try {
          await sendOverdueSummaryEmail({
            to: hodUser.email,
            hodName: hodUser.name,
            departmentName: deptName,
            overdueStudents: overdueList,
          });

          await logNotification({
            userId: hodUser.id,
            type: "overdue_summary",
            message: `Overdue inactivity digest dispatched: ${overdueList.length} student(s) inactive for 7+ days in ${deptName}.`,
          });

          departmentsNotified++;
        } catch (mailError) {
          console.error(`[actions/notifications.triggerOverdueNotificationCheck] Error notifying HOD for ${deptName}:`, mailError);
        }
      }
    }

    return {
      success: true,
      data: {
        departmentsProcessed: departmentOverdueMap.size,
        departmentsNotified,
        departmentsSkippedDueToRateLimit,
        totalOverdueCount,
      },
    };
  } catch (error) {
    console.error("[actions/notifications.triggerOverdueNotificationCheck] Unexpected error:", error);
    return {
      success: false,
      error: "Failed to execute overdue submissions check.",
    };
  }
}
