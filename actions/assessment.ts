"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { eq, and, desc, gte, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  placement,
  user,
  studentProfile,
  organization,
  logbookEntry,
  attendance,
  monthlyIndustryReview,
  notificationLog,
  department,
  type RubricScores,
} from "@/db/schema";
import { auth } from "@/lib/auth";
import { sendIndustryInviteEmail, logNotification } from "@/lib/resend";
import { calculateRubricScore } from "@/lib/utils";

export interface AssessmentActionResult<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
}

/**
 * Ensures caller is an authenticated staff member (Admin or HOD).
 */
async function assertStaff() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    return { error: "Authentication required", session: null };
  }

  if (session.user.role !== "admin" && session.user.role !== "hod") {
    return {
      error: "Only Administrators and Heads of Department can assign industry supervisors.",
      session: null,
    };
  }

  return { error: null, session };
}

/**
 * Ensures caller is an authenticated Industry Supervisor.
 */
async function assertIndustrySupervisor() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    return { error: "Authentication required. Please sign in via the Industry Portal.", session: null };
  }

  if (session.user.role !== "industry_supervisor") {
    return {
      error: "Only registered Industry Supervisors can access this action.",
      session: null,
    };
  }

  return { error: null, session };
}

/**
 * Assigns or updates an Industry Supervisor on a student's placement,
 * creates the passwordless user account if not existing, and sends an invitation email.
 */
export async function assignIndustrySupervisor(input: {
  placementId: string;
  supervisorName: string;
  supervisorEmail: string;
}): Promise<AssessmentActionResult<{ supervisorId: string }>> {
  try {
    const { error: staffError, session } = await assertStaff();
    if (staffError || !session) return { success: false, error: staffError || "Unauthorized" };

    const placementId = input.placementId?.trim();
    const name = input.supervisorName?.trim();
    const email = input.supervisorEmail?.trim().toLowerCase();

    if (!placementId || !name || !email) {
      return { success: false, error: "Placement ID, supervisor name, and email are required." };
    }

    // Basic email format validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { success: false, error: "Please provide a valid supervisor email address." };
    }

    // Fetch placement with student & organization details
    const [targetPlacement] = await db
      .select({
        placementId: placement.id,
        studentProfileId: placement.studentId,
        studentUserId: studentProfile.userId,
        studentName: user.name,
        departmentId: user.departmentId,
        organizationName: organization.name,
      })
      .from(placement)
      .innerJoin(studentProfile, eq(placement.studentId, studentProfile.id))
      .innerJoin(user, eq(studentProfile.userId, user.id))
      .innerJoin(organization, eq(placement.organizationId, organization.id))
      .where(eq(placement.id, placementId))
      .limit(1);

    if (!targetPlacement) {
      return { success: false, error: "Placement record not found." };
    }

    // HOD department check: enforce that HOD callers must have a department attached
    if (session.user.role === "hod") {
      if (!session.user.departmentId) {
        return {
          success: false,
          error: "Your HOD account is not attached to any academic department.",
        };
      }
      if (targetPlacement.departmentId !== session.user.departmentId) {
        return {
          success: false,
          error: "You can only manage placements within your own department.",
        };
      }
    }

    // Check if user with this email already exists
    let supervisorUserId: string;
    const [existingUser] = await db
      .select({ id: user.id, role: user.role })
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (existingUser) {
      // Security: Never promote a student or staff account to industry_supervisor implicitly
      if (existingUser.role !== "industry_supervisor") {
        const roleLabel =
          existingUser.role === "student"
            ? "student"
            : existingUser.role === "school_supervisor"
              ? "school supervisor"
              : "staff member";
        return {
          success: false,
          error: `This email address is already registered to a ${roleLabel}. Industry supervisors must use a distinct corporate email address.`,
        };
      }

      supervisorUserId = existingUser.id;
      // Update name in case it changed
      await db
        .update(user)
        .set({ name })
        .where(eq(user.id, existingUser.id));
    } else {
      // Create new passwordless industry_supervisor user
      supervisorUserId = crypto.randomUUID();
      await db.insert(user).values({
        id: supervisorUserId,
        name,
        email,
        emailVerified: true,
        role: "industry_supervisor",
        departmentId: null,
      });
    }

    // Link supervisor to placement
    await db
      .update(placement)
      .set({ industrySupervisorId: supervisorUserId })
      .where(eq(placement.id, placementId));

    // Send invitation email
    try {
      await sendIndustryInviteEmail({
        to: email,
        supervisorName: name,
        studentName: targetPlacement.studentName,
        organizationName: targetPlacement.organizationName,
      });

      await logNotification({
        userId: supervisorUserId,
        type: "industry_invite",
        message: `Industry supervisor invitation dispatched to ${email} for student ${targetPlacement.studentName}.`,
      });
    } catch (mailError) {
      console.error("[actions/assessment.assignIndustrySupervisor] Mail dispatch error:", mailError);
    }

    revalidatePath("/admin/placements");
    revalidatePath("/hod/students");
    revalidatePath(`/hod/students/${targetPlacement.studentProfileId}`);
    revalidatePath("/student/placement");
    revalidatePath("/industry");

    return { success: true, data: { supervisorId: supervisorUserId } };
  } catch (error) {
    console.error("[actions/assessment.assignIndustrySupervisor]", error);
    return { success: false, error: "Failed to assign industry supervisor. Please try again." };
  }
}

/**
 * Submits or updates a monthly review by the assigned Industry Supervisor.
 */
export async function submitMonthlyReview(formData: FormData): Promise<AssessmentActionResult> {
  try {
    const { error: authError, session } = await assertIndustrySupervisor();
    if (authError || !session) return { success: false, error: authError || "Unauthorized" };

    const placementId = (formData.get("placementId") as string)?.trim();
    const reviewMonth = (formData.get("reviewMonth") as string)?.trim(); // e.g. "2026-03"
    const comment = (formData.get("comment") as string)?.trim();
    const attestationName = (formData.get("attestationName") as string)?.trim();
    const attestationOfficeId = (formData.get("attestationOfficeId") as string)?.trim();

    if (!placementId || !reviewMonth || !comment || !attestationName || !attestationOfficeId) {
      return {
        success: false,
        error: "All fields including feedback comment and attestation details are required.",
      };
    }

    // Validate reviewMonth format YYYY-MM
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(reviewMonth)) {
      return { success: false, error: "Invalid review month format. Expected YYYY-MM." };
    }

    // Verify supervisor is assigned to this placement
    const [targetPlacement] = await db
      .select({ id: placement.id, industrySupervisorId: placement.industrySupervisorId })
      .from(placement)
      .where(eq(placement.id, placementId))
      .limit(1);

    if (!targetPlacement) {
      return { success: false, error: "Placement record not found." };
    }

    if (targetPlacement.industrySupervisorId !== session.user.id) {
      return {
        success: false,
        error: "You are not authorized to submit reviews for this student placement.",
      };
    }

    // Parse and validate the 7 rubric scores
    const scoreKeys: (keyof RubricScores)[] = [
      "punctuality",
      "technicalCompetence",
      "communication",
      "teamwork",
      "problemSolving",
      "professionalism",
      "overallPerformance",
    ];

    const scoresObj = {} as Record<keyof RubricScores, number>;

    for (const key of scoreKeys) {
      const raw = formData.get(key);
      const val = Number(raw);
      if (raw === null || raw === undefined || isNaN(val) || val < 0 || val > 100) {
        return {
          success: false,
          error: `Score for ${key} must be a valid number between 0 and 100.`,
        };
      }
      scoresObj[key] = Math.round(val * 10) / 10;
    }

    const typedScores = scoresObj as RubricScores;

    // Atomic upsert backed by unique constraint (placement_id, review_month)
    const [savedReview] = await db
      .insert(monthlyIndustryReview)
      .values({
        placementId,
        industrySupervisorId: session.user.id,
        reviewMonth,
        scores: typedScores,
        comment,
        attestationName,
        attestationOfficeId,
      })
      .onConflictDoUpdate({
        target: [
          monthlyIndustryReview.placementId,
          monthlyIndustryReview.reviewMonth,
        ],
        set: {
          scores: typedScores,
          comment,
          attestationName,
          attestationOfficeId,
          reviewedAt: new Date(),
        },
      })
      .returning();

    revalidatePath("/industry");
    revalidatePath(`/industry/review/${placementId}`);

    return { success: true, data: savedReview };
  } catch (error: unknown) {
    const err = error as { code?: string };
    if (err?.code === "23505") {
      return {
        success: false,
        error: "A concurrent monthly evaluation for this period is already being processed.",
      };
    }
    console.error("[actions/assessment.submitMonthlyReview]", error);
    return { success: false, error: "Failed to save monthly evaluation. Please try again." };
  }
}

/**
 * Fetches all placements assigned to the calling Industry Supervisor with progress metrics.
 */
export async function getIndustrySupervisorPlacements() {
  const { error: authError, session } = await assertIndustrySupervisor();
  if (authError || !session) return [];

  try {
    const placements = await db
      .select({
        placementId: placement.id,
        startDate: placement.startDate,
        endDate: placement.endDate,
        targetDays: placement.targetDays,
        status: placement.status,
        studentId: studentProfile.id,
        matricNumber: studentProfile.matricNumber,
        studentName: user.name,
        studentEmail: user.email,
        departmentId: user.departmentId,
        organizationName: organization.name,
      })
      .from(placement)
      .innerJoin(studentProfile, eq(placement.studentId, studentProfile.id))
      .innerJoin(user, eq(studentProfile.userId, user.id))
      .innerJoin(organization, eq(placement.organizationId, organization.id))
      .where(eq(placement.industrySupervisorId, session.user.id));

    // For each placement, fetch department name, attendance stats, and latest review status
    const results = [];
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    for (const p of placements) {
      let deptName = "Department";
      if (p.departmentId) {
        const [dept] = await db
          .select({ name: department.name })
          .from(department)
          .where(eq(department.id, p.departmentId))
          .limit(1);
        if (dept) deptName = dept.name;
      }

      // Count days present
      const attendanceRecords = await db
        .select({ status: attendance.status })
        .from(attendance)
        .where(eq(attendance.placementId, p.placementId));

      const daysPresent = attendanceRecords.filter((a) => a.status === "present").length;

      // Check if review submitted for current month
      const [review] = await db
        .select({ id: monthlyIndustryReview.id, scores: monthlyIndustryReview.scores })
        .from(monthlyIndustryReview)
        .where(
          and(
            eq(monthlyIndustryReview.placementId, p.placementId),
            eq(monthlyIndustryReview.reviewMonth, currentMonth)
          )
        )
        .limit(1);

      results.push({
        placementId: p.placementId,
        studentName: p.studentName,
        matricNumber: p.matricNumber,
        departmentName: deptName,
        organizationName: p.organizationName,
        startDate: p.startDate,
        endDate: p.endDate,
        targetDays: p.targetDays,
        daysPresent,
        completionPercent: Math.min(100, Math.round((daysPresent / (p.targetDays || 60)) * 100)),
        currentMonth,
        isReviewSubmitted: Boolean(review),
        currentScore: review ? calculateRubricScore(review.scores) : null,
      });
    }

    return results;
  } catch (err) {
    console.error("[actions/assessment.getIndustrySupervisorPlacements]", err);
    return [];
  }
}
