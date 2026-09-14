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
import { checkRateLimit } from "@/lib/rate-limit";

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
 * Ensures caller is an authenticated Industry Supervisor with at least one
 * currently active placement assignment (placement.status = 'active').
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

  // Security Invariant: Verify supervisor has at least one active placement
  const [activePlacement] = await db
    .select({ id: placement.id, status: placement.status })
    .from(placement)
    .where(
      and(
        eq(placement.industrySupervisorId, session.user.id),
        eq(placement.status, "active"),
      ),
    )
    .limit(1);

  if (!activePlacement) {
    return {
      error:
        "No active student placement assignments found for this Industry Supervisor account. Access is restricted to supervisors with active placements.",
      session: null,
    };
  }

  return { error: null, session };
}

/**
 * Unauthenticated server action for requesting an industry supervisor login code/link.
 *
 * Implements privacy-preserving login with rate-limiting:
 * - Rate limits by IP address and normalized email to prevent brute-force attacks.
 * - Enforces the security model: Exists -> Industry Supervisor role -> placement.status === 'active'.
 * - Returns a generic, constant message to the client regardless of whether the email is
 *   unregistered, a student/staff account, an inactive mentor, or an active supervisor.
 *   This completely eliminates account and role enumeration.
 */
export async function requestIndustryLoginCode(
  rawEmail: string,
): Promise<AssessmentActionResult<{ dispatched: boolean }>> {
  try {
    const cleanEmail = rawEmail?.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return {
        success: false,
        error: "Please enter a valid corporate email address.",
      };
    }

    // Rate Limiting: max 5 requests per 60 seconds per IP and per email
    const reqHeaders = await headers();
    const forwarded = reqHeaders.get("x-forwarded-for");
    const clientIp = forwarded ? forwarded.split(",")[0].trim() : reqHeaders.get("x-real-ip") || "unknown-ip";

    const ipLimit = checkRateLimit(`industry-ip:${clientIp}`, { limit: 5, windowMs: 60_000 });
    const emailLimit = checkRateLimit(`industry-email:${cleanEmail}`, { limit: 5, windowMs: 60_000 });

    if (!ipLimit.allowed || !emailLimit.allowed) {
      return {
        success: false,
        error: "Too many login attempts. Please wait 60 seconds before trying again.",
      };
    }

    // Constant generic success response to eliminate account and role enumeration
    const genericSuccess = {
      success: true,
      data: { dispatched: true },
    };

    // Internal Eligibility Check:
    // 1. Exists in user table?
    const [foundUser] = await db
      .select({ id: user.id, role: user.role })
      .from(user)
      .where(eq(user.email, cleanEmail))
      .limit(1);

    if (!foundUser || foundUser.role !== "industry_supervisor") {
      console.warn(`[requestIndustryLoginCode] Suppressed code dispatch for non-supervisor: ${cleanEmail}`);
      return genericSuccess;
    }

    // 2. Has an active placement assignment (placement.status = 'active')?
    const [activePlacement] = await db
      .select({ id: placement.id })
      .from(placement)
      .where(
        and(
          eq(placement.industrySupervisorId, foundUser.id),
          eq(placement.status, "active"),
        ),
      )
      .limit(1);

    if (!activePlacement) {
      console.warn(
        `[requestIndustryLoginCode] Suppressed code dispatch for supervisor without active placement: ${cleanEmail}`,
      );
      return genericSuccess;
    }

    // 3. Dispatch OTP and Magic Link through Better Auth
    try {
      await auth.api.sendVerificationOTP({
        body: { email: cleanEmail, type: "sign-in" },
        headers: reqHeaders,
      });
    } catch (otpErr) {
      console.error("[requestIndustryLoginCode] OTP dispatch error:", otpErr);
    }

    try {
      await auth.api.signInMagicLink({
        body: { email: cleanEmail, callbackURL: "/industry" },
        headers: reqHeaders,
      });
    } catch (magicErr) {
      console.error("[requestIndustryLoginCode] Magic link dispatch error:", magicErr);
    }

    return genericSuccess;
  } catch (err) {
    console.error("[requestIndustryLoginCode] Error:", err);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

/**
 * Backward-compatible alias for requestIndustryLoginCode with generic privacy-preserving return.
 */
export async function verifyIndustrySupervisorEmail(
  email: string,
): Promise<AssessmentActionResult<{ exists: boolean }>> {
  const result = await requestIndustryLoginCode(email);
  return {
    success: result.success,
    error: result.error,
    data: { exists: true },
  };
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

    // Server-side attestation enforcement: require explicit confirmation
    const attested = formData.get("attested");
    if (attested !== "true" && attested !== "on") {
      return {
        success: false,
        error: "You must check and accept the legal/institutional attestation before submitting.",
      };
    }

    // Validate reviewMonth format YYYY-MM
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(reviewMonth)) {
      return { success: false, error: "Invalid review month format. Expected YYYY-MM." };
    }

    // Verify supervisor is assigned to this placement and fetch active placement dates
    const [targetPlacement] = await db
      .select({
        id: placement.id,
        industrySupervisorId: placement.industrySupervisorId,
        startDate: placement.startDate,
        endDate: placement.endDate,
        status: placement.status,
      })
      .from(placement)
      .where(
        and(
          eq(placement.id, placementId),
          eq(placement.status, "active"),
        ),
      )
      .limit(1);

    if (!targetPlacement) {
      return {
        success: false,
        error: "Placement record not found or is not currently active.",
      };
    }

    if (targetPlacement.industrySupervisorId !== session.user.id) {
      return {
        success: false,
        error: "You are not authorized to submit reviews for this student placement.",
      };
    }

    // Enforce allowed review period: no future calendar months
    const now = new Date();
    const currentCalendarMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    if (reviewMonth > currentCalendarMonth) {
      return {
        success: false,
        error: "Evaluation cannot be submitted for a future calendar month.",
      };
    }

    // Enforce review month falls within placement duration
    const placementStartMonth = targetPlacement.startDate.slice(0, 7);
    const placementEndMonth = targetPlacement.endDate.slice(0, 7);
    if (reviewMonth < placementStartMonth || reviewMonth > placementEndMonth) {
      return {
        success: false,
        error: `Review month (${reviewMonth}) must fall within the placement duration (${placementStartMonth} to ${placementEndMonth}).`,
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
      .where(
        and(
          eq(placement.industrySupervisorId, session.user.id),
          eq(placement.status, "active"),
        ),
      );

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
