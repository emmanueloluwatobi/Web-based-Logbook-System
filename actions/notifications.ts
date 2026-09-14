"use server";

import { eq, and, inArray, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  placement,
  studentProfile,
  user,
  department,
  logbookEntry,
} from "@/db/schema";
import { sendOverdueSummaryEmail, logNotification } from "@/lib/resend";

export interface OverdueCheckResult {
  success: boolean;
  error?: string;
  data?: {
    departmentsProcessed: number;
    departmentsNotified: number;
    totalOverdueCount: number;
  };
}

/**
 * Feature 15: Scans all active placements for students who have not submitted
 * any logbook entries in the last 7+ calendar days, groups them by department,
 * and emails an inactivity digest to the departmental HOD.
 */
export async function triggerOverdueNotificationCheck(): Promise<OverdueCheckResult> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Fetch all active placements with student user details
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

    if (!activePlacements || activePlacements.length === 0) {
      return {
        success: true,
        data: {
          departmentsProcessed: 0,
          departmentsNotified: 0,
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

    for (const p of activePlacements) {
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
