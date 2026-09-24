"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { eq, and, inArray, ilike } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  organization,
  placement,
  studentProfile,
  user,
  logbookEntry,
} from "@/db/schema";
import { auth } from "@/lib/auth";
import { sendPlacementApprovedEmail, logNotification } from "@/lib/resend";

export interface PlacementMutationResult<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
}

/**
 * Ensures session has administrative or HOD authority.
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
      error: "Only Administrators and Heads of Department can perform this action",
      session: null,
    };
  }

  return { error: null, session };
}

/**
 * For HOD users, verifies that the target student belongs to the HOD's own department.
 * Admin users bypass this check entirely.
 */
async function verifyHodDepartmentScope(
  session: { user: { id: string; role: string; departmentId?: string | null } },
  targetStudentProfileId: string
): Promise<{ error: string | null }> {
  // Admin bypasses department check
  if (session.user.role === "admin") return { error: null };

  if (!session.user.departmentId) {
    return { error: "Your account is not assigned to a department." };
  }

  // Fetch the student's user record to check departmentId
  const [studentData] = await db
    .select({ departmentId: user.departmentId })
    .from(studentProfile)
    .innerJoin(user, eq(studentProfile.userId, user.id))
    .where(eq(studentProfile.id, targetStudentProfileId))
    .limit(1);

  if (!studentData) return { error: "Student not found." };

  if (studentData.departmentId !== session.user.departmentId) {
    return { error: "You can only manage students within your own department." };
  }

  return { error: null };
}

/**
 * Verifies that the designated supervisor exists, has the 'school_supervisor' role,
 * and if the caller is an HOD, belongs to the same department as the HOD.
 * Admin users bypass the departmental restriction.
 */
async function verifySupervisorEligibility(
  session: { user: { id: string; role: string; departmentId?: string | null } },
  supervisorUserId: string
): Promise<{ error: string | null }> {
  if (!supervisorUserId) {
    return { error: "School Supervisor ID is required." };
  }

  const [supervisor] = await db
    .select({ id: user.id, role: user.role, departmentId: user.departmentId })
    .from(user)
    .where(eq(user.id, supervisorUserId))
    .limit(1);

  if (!supervisor) {
    return { error: "Selected user was not found." };
  }

  if (supervisor.role !== "school_supervisor") {
    return { error: "Selected user is not a registered School Supervisor." };
  }

  if (session.user.role === "hod" && session.user.departmentId) {
    if (supervisor.departmentId !== session.user.departmentId) {
      return { error: "You can only assign supervisors from your own department." };
    }
  }

  return { error: null };
}

/**
 * Ensures session belongs to a student and returns their profile.
 */
async function assertStudent() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    return { error: "Authentication required", session: null, profile: null };
  }

  if (session.user.role !== "student") {
    return {
      error: "Only students are authorized to access this action",
      session: null,
      profile: null,
    };
  }

  let [profile] = await db
    .select()
    .from(studentProfile)
    .where(eq(studentProfile.userId, session.user.id))
    .limit(1);

  if (!profile) {
    const [created] = await db
      .insert(studentProfile)
      .values({
        userId: session.user.id,
        isProfileComplete: false,
      })
      .returning();
    profile = created;
  }

  return { error: null, session, profile };
}

/**
 * Feature 15: Dispatches placement_approved notification to student.
 */
async function notifyStudentOfApprovedPlacement({
  studentProfileId,
  organizationId,
  schoolSupervisorId,
  startDate,
  endDate,
}: {
  studentProfileId: string;
  organizationId: string;
  schoolSupervisorId?: string | null;
  startDate: string;
  endDate: string;
}): Promise<void> {
  try {
    const [studentData] = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
      })
      .from(studentProfile)
      .innerJoin(user, eq(studentProfile.userId, user.id))
      .where(eq(studentProfile.id, studentProfileId))
      .limit(1);

    if (!studentData) return;

    const [org] = await db
      .select({ name: organization.name })
      .from(organization)
      .where(eq(organization.id, organizationId))
      .limit(1);

    let supervisorName: string | null = null;
    if (schoolSupervisorId) {
      const [sup] = await db
        .select({ name: user.name })
        .from(user)
        .where(eq(user.id, schoolSupervisorId))
        .limit(1);
      if (sup) supervisorName = sup.name;
    }

    await sendPlacementApprovedEmail({
      to: studentData.email,
      studentName: studentData.name,
      organizationName: org?.name || "Your Approved Organization",
      supervisorName,
      startDate,
      endDate,
    });

    await logNotification({
      userId: studentData.id,
      type: "placement_approved",
      message: `SIWES Placement approved at ${org?.name || "organization"} (${startDate} to ${endDate}).`,
    });
  } catch (error) {
    console.error("[actions/placement.notifyStudentOfApprovedPlacement] Failed to dispatch placement approval notification:", error);
  }
}

// ==========================================
// Organization CRUD (Staff)
// ==========================================

export async function createOrganization(formData: FormData): Promise<PlacementMutationResult> {
  try {
    const { error: staffError } = await assertStaff();
    if (staffError) return { success: false, error: staffError };

    const name = (formData.get("name") as string)?.trim();
    const address = (formData.get("address") as string)?.trim();
    const stateRegion = (formData.get("stateRegion") as string)?.trim();
    const industryType = (formData.get("industryType") as string)?.trim();

    if (!name || !address || !stateRegion || !industryType) {
      return { success: false, error: "All organization fields are required." };
    }

    const [created] = await db
      .insert(organization)
      .values({
        name,
        address,
        stateRegion,
        industryType,
      })
      .returning();

    revalidatePath("/admin/organizations");
    revalidatePath("/admin/placements");
    revalidatePath("/student/placement");

    return { success: true, data: created };
  } catch (error) {
    console.error("[actions/placement.createOrganization]", error);
    return { success: false, error: "Failed to create organization." };
  }
}

export async function updateOrganization(formData: FormData): Promise<PlacementMutationResult> {
  try {
    const { error: staffError } = await assertStaff();
    if (staffError) return { success: false, error: staffError };

    const id = formData.get("id") as string;
    const name = (formData.get("name") as string)?.trim();
    const address = (formData.get("address") as string)?.trim();
    const stateRegion = (formData.get("stateRegion") as string)?.trim();
    const industryType = (formData.get("industryType") as string)?.trim();

    if (!id || !name || !address || !stateRegion || !industryType) {
      return { success: false, error: "All organization fields are required." };
    }

    const [updated] = await db
      .update(organization)
      .set({
        name,
        address,
        stateRegion,
        industryType,
      })
      .where(eq(organization.id, id))
      .returning();

    revalidatePath("/admin/organizations");
    revalidatePath("/admin/placements");
    revalidatePath("/student/placement");

    return { success: true, data: updated };
  } catch (error) {
    console.error("[actions/placement.updateOrganization]", error);
    return { success: false, error: "Failed to update organization." };
  }
}

export async function deleteOrganization(id: string): Promise<PlacementMutationResult> {
  try {
    const { error: staffError } = await assertStaff();
    if (staffError) return { success: false, error: staffError };

    if (!id) return { success: false, error: "Organization ID is required." };

    // Check if placements exist
    const [attached] = await db
      .select({ id: placement.id })
      .from(placement)
      .where(eq(placement.organizationId, id))
      .limit(1);

    if (attached) {
      return {
        success: false,
        error: "Cannot delete this organization because active student placements are attached to it.",
      };
    }

    await db.delete(organization).where(eq(organization.id, id));

    revalidatePath("/admin/organizations");
    revalidatePath("/admin/placements");
    revalidatePath("/student/placement");

    return { success: true };
  } catch (error) {
    console.error("[actions/placement.deleteOrganization]", error);
    return { success: false, error: "Failed to delete organization." };
  }
}

// ==========================================
// Student Self-Submission Flow
// ==========================================

export async function submitStudentPlacement(formData: FormData): Promise<PlacementMutationResult> {
  try {
    const { error: studentError, profile } = await assertStudent();
    if (studentError || !profile) return { success: false, error: studentError || "Unauthorized" };

    // Check if student already has a pending or active placement
    const [existing] = await db
      .select({ id: placement.id, status: placement.status })
      .from(placement)
      .where(
        and(
          eq(placement.studentId, profile.id),
          inArray(placement.status, ["pending", "active"])
        )
      )
      .limit(1);

    if (existing) {
      return {
        success: false,
        error: `You already have a registered placement in ${existing.status} status.`,
      };
    }

    let organizationId = (formData.get("organizationId") as string) || "";
    const isNewOrg = formData.get("isNewOrg") === "true" || organizationId === "new" || !organizationId;

    if (isNewOrg) {
      const orgName = (formData.get("orgName") as string)?.trim();
      const orgAddress = (formData.get("orgAddress") as string)?.trim();
      const orgStateRegion = (formData.get("orgStateRegion") as string)?.trim();
      const orgIndustryType = (formData.get("orgIndustryType") as string)?.trim();

      if (!orgName || !orgAddress || !orgStateRegion || !orgIndustryType) {
        return { success: false, error: "Please provide all details for your training organization." };
      }

      // Check if organization with same name already exists (case-insensitive)
      let [matchedOrg] = await db
        .select()
        .from(organization)
        .where(ilike(organization.name, orgName))
        .limit(1);

      if (!matchedOrg) {
        const [newOrg] = await db
          .insert(organization)
          .values({
            name: orgName,
            address: orgAddress,
            stateRegion: orgStateRegion,
            industryType: orgIndustryType,
          })
          .returning();
        matchedOrg = newOrg;
      }
      organizationId = matchedOrg.id;
    }

    const startDate = formData.get("startDate") as string;
    const endDate = formData.get("endDate") as string;
    const targetDaysRaw = formData.get("targetDays");
    const targetDays = targetDaysRaw ? parseInt(String(targetDaysRaw), 10) : 60;

    if (!startDate || !endDate) {
      return { success: false, error: "Training start date and end date are required." };
    }

    const startObj = new Date(startDate);
    const endObj = new Date(endDate);

    if (isNaN(startObj.getTime()) || isNaN(endObj.getTime())) {
      return { success: false, error: "Please provide valid calendar dates." };
    }

    const startYear = startObj.getFullYear();
    const endYear = endObj.getFullYear();

    if (startYear < 2020 || startYear > 2040 || endYear < 2020 || endYear > 2040) {
      return { success: false, error: "Training dates must have a valid year between 2020 and 2040." };
    }

    if (endObj <= startObj) {
      return { success: false, error: "End date must be after start date." };
    }

    // Insert student self-secured placement with status = 'pending'
    const [created] = await db
      .insert(placement)
      .values({
        studentId: profile.id,
        organizationId,
        schoolSupervisorId: null, // assigned by Admin/HOD upon approval
        startDate,
        endDate,
        targetDays: isNaN(targetDays) || targetDays < 1 ? 60 : targetDays,
        placementSource: "self_secured",
        status: "pending",
      })
      .returning();

    revalidatePath("/student/placement");
    revalidatePath("/student");
    revalidatePath("/admin/placements");

    return { success: true, data: created };
  } catch (error) {
    console.error("[actions/placement.submitStudentPlacement]", error);
    return { success: false, error: "Failed to submit placement registration." };
  }
}

// ==========================================
// Admin/HOD Review, Approval & Direct Placement Flow
// ==========================================

export async function approveStudentPlacement(formData: FormData): Promise<PlacementMutationResult> {
  try {
    const { error: staffError, session } = await assertStaff();
    if (staffError || !session) return { success: false, error: staffError || "Unauthorized" };

    const placementId = formData.get("placementId") as string;
    const schoolSupervisorId = formData.get("schoolSupervisorId") as string;
    const startDate = formData.get("startDate") as string;
    const endDate = formData.get("endDate") as string;
    const targetDaysRaw = formData.get("targetDays");

    if (!placementId) {
      return { success: false, error: "Placement ID is required." };
    }

    if (!schoolSupervisorId) {
      return { success: false, error: "You must assign an academic School Supervisor to approve this placement." };
    }

    const { error: supervisorError } = await verifySupervisorEligibility(session, schoolSupervisorId);
    if (supervisorError) {
      return { success: false, error: supervisorError };
    }

    // HOD department-scoping: verify student is in same department
    const [placementRecord] = await db
      .select({ studentId: placement.studentId })
      .from(placement)
      .where(eq(placement.id, placementId))
      .limit(1);

    if (placementRecord) {
      const { error: scopeError } = await verifyHodDepartmentScope(session, placementRecord.studentId);
      if (scopeError) return { success: false, error: scopeError };
    }

    const updatePayload: Record<string, unknown> = {
      schoolSupervisorId,
      status: "active",
    };

    if (startDate) updatePayload.startDate = startDate;
    if (endDate) updatePayload.endDate = endDate;
    if (targetDaysRaw) {
      const td = parseInt(String(targetDaysRaw), 10);
      if (!isNaN(td) && td > 0) updatePayload.targetDays = td;
    }

    const [updated] = await db
      .update(placement)
      .set(updatePayload)
      .where(eq(placement.id, placementId))
      .returning();

    // Feature 15: Notify student of approved placement
    await notifyStudentOfApprovedPlacement({
      studentProfileId: updated.studentId,
      organizationId: updated.organizationId,
      schoolSupervisorId: updated.schoolSupervisorId,
      startDate: updated.startDate,
      endDate: updated.endDate,
    });

    revalidatePath("/admin/placements");
    revalidatePath("/student/placement");
    revalidatePath("/student");
    revalidatePath("/hod");
    revalidatePath("/hod/students");
    revalidatePath(`/hod/students/${updated.studentId}`);

    return { success: true, data: updated };
  } catch (error) {
    console.error("[actions/placement.approveStudentPlacement]", error);
    return { success: false, error: "Failed to approve placement." };
  }
}

export async function declineStudentPlacement(formData: FormData): Promise<PlacementMutationResult> {
  try {
    const { error: staffError, session } = await assertStaff();
    if (staffError || !session) return { success: false, error: staffError || "Unauthorized" };

    const placementId = formData.get("placementId") as string;
    const reason = (formData.get("reason") as string)?.trim() || "";

    if (!placementId) {
      return { success: false, error: "Placement ID is required." };
    }

    const [placementRecord] = await db
      .select({ id: placement.id, studentId: placement.studentId, status: placement.status })
      .from(placement)
      .where(eq(placement.id, placementId))
      .limit(1);

    if (!placementRecord) {
      return { success: false, error: "Placement not found." };
    }

    if (placementRecord.status !== "pending") {
      return { success: false, error: "Only pending placement requests can be declined." };
    }

    // Verify HOD department scoping
    const { error: scopeError } = await verifyHodDepartmentScope(session, placementRecord.studentId);
    if (scopeError) return { success: false, error: scopeError };

    const [updated] = await db
      .update(placement)
      .set({
        status: "rejected",
        rejectionReason: reason || "Declined by department SIWES coordinator.",
      })
      .where(eq(placement.id, placementId))
      .returning();

    // Log notification for student
    try {
      const [studentData] = await db
        .select({ userId: user.id })
        .from(studentProfile)
        .innerJoin(user, eq(studentProfile.userId, user.id))
        .where(eq(studentProfile.id, placementRecord.studentId))
        .limit(1);

      if (studentData) {
        await logNotification({
          userId: studentData.userId,
          type: "placement_rejected",
          message: `Your SIWES placement request has been declined${reason ? `: ${reason}` : "."}`,
        });
      }
    } catch (notifyErr) {
      console.error("[actions/placement.declineStudentPlacement] Notification error:", notifyErr);
    }

    revalidatePath("/admin/placements");
    revalidatePath("/student/placement");
    revalidatePath("/student");
    revalidatePath("/hod");
    revalidatePath("/hod/students");
    revalidatePath(`/hod/students/${placementRecord.studentId}`);

    return { success: true, data: updated };
  } catch (error) {
    console.error("[actions/placement.declineStudentPlacement]", error);
    return { success: false, error: "Failed to decline placement." };
  }
}

export async function createDepartmentPlacement(formData: FormData): Promise<PlacementMutationResult> {
  try {
    const { error: staffError, session } = await assertStaff();
    if (staffError || !session) return { success: false, error: staffError || "Unauthorized" };

    const studentProfileId = formData.get("studentProfileId") as string;
    let organizationId = (formData.get("organizationId") as string) || "";
    const schoolSupervisorId = formData.get("schoolSupervisorId") as string;
    const startDate = formData.get("startDate") as string;
    const endDate = formData.get("endDate") as string;
    const targetDaysRaw = formData.get("targetDays");
    const targetDays = targetDaysRaw ? parseInt(String(targetDaysRaw), 10) : 60;
    const isNewOrg = formData.get("isNewOrg") === "true";

    if (!studentProfileId) {
      return { success: false, error: "Student selection is required." };
    }

    // HOD department-scoping: verify student is in same department
    const { error: scopeError } = await verifyHodDepartmentScope(session, studentProfileId);
    if (scopeError) return { success: false, error: scopeError };

    if (!schoolSupervisorId) {
      return { success: false, error: "School Supervisor assignment is required." };
    }

    const { error: supervisorError } = await verifySupervisorEligibility(session, schoolSupervisorId);
    if (supervisorError) {
      return { success: false, error: supervisorError };
    }

    if (!startDate || !endDate) {
      return { success: false, error: "Start and end dates are required." };
    }

    const startObj = new Date(startDate);
    const endObj = new Date(endDate);

    if (isNaN(startObj.getTime()) || isNaN(endObj.getTime())) {
      return { success: false, error: "Please provide valid calendar dates." };
    }

    const startYear = startObj.getFullYear();
    const endYear = endObj.getFullYear();

    if (startYear < 2020 || startYear > 2040 || endYear < 2020 || endYear > 2040) {
      return { success: false, error: "Training dates must have a valid year between 2020 and 2040." };
    }

    if (endObj <= startObj) {
      return { success: false, error: "End date must be after start date." };
    }

    // Check if student already has active placement
    const [existing] = await db
      .select({ id: placement.id })
      .from(placement)
      .where(
        and(
          eq(placement.studentId, studentProfileId),
          inArray(placement.status, ["pending", "active"])
        )
      )
      .limit(1);

    if (existing) {
      return { success: false, error: "This student already has an active or pending placement." };
    }

    // Handle new organization if provided
    if (isNewOrg || !organizationId) {
      const orgName = (formData.get("orgName") as string)?.trim();
      const orgAddress = (formData.get("orgAddress") as string)?.trim();
      const orgStateRegion = (formData.get("orgStateRegion") as string)?.trim();
      const orgIndustryType = (formData.get("orgIndustryType") as string)?.trim();

      if (!orgName || !orgAddress || !orgStateRegion || !orgIndustryType) {
        return { success: false, error: "All organization fields are required." };
      }

      const [newOrg] = await db
        .insert(organization)
        .values({
          name: orgName,
          address: orgAddress,
          stateRegion: orgStateRegion,
          industryType: orgIndustryType,
        })
        .returning();
      organizationId = newOrg.id;
    }

    const [created] = await db
      .insert(placement)
      .values({
        studentId: studentProfileId,
        organizationId,
        schoolSupervisorId,
        startDate,
        endDate,
        targetDays: isNaN(targetDays) || targetDays < 1 ? 60 : targetDays,
        placementSource: "department_assigned",
        status: "active",
      })
      .returning();

    // Feature 15: Notify student of approved placement
    await notifyStudentOfApprovedPlacement({
      studentProfileId: created.studentId,
      organizationId: created.organizationId,
      schoolSupervisorId: created.schoolSupervisorId,
      startDate: created.startDate,
      endDate: created.endDate,
    });

    revalidatePath("/admin/placements");
    revalidatePath("/student/placement");
    revalidatePath("/student");
    revalidatePath("/hod");
    revalidatePath("/hod/students");

    return { success: true, data: created };
  } catch (error) {
    console.error("[actions/placement.createDepartmentPlacement]", error);
    return { success: false, error: "Failed to create department placement." };
  }
}

export async function updatePlacement(formData: FormData): Promise<PlacementMutationResult> {
  try {
    const { error: staffError, session } = await assertStaff();
    if (staffError || !session) return { success: false, error: staffError || "Unauthorized" };

    const placementId = formData.get("id") as string;
    const organizationId = formData.get("organizationId") as string;
    const schoolSupervisorId = formData.get("schoolSupervisorId") as string;
    const startDate = formData.get("startDate") as string;
    const endDate = formData.get("endDate") as string;
    const targetDaysRaw = formData.get("targetDays");
    const status = formData.get("status") as "pending" | "active" | "completed" | "rejected";

    if (!placementId) {
      return { success: false, error: "Placement ID is required." };
    }

    // Verify HOD department scoping
    const [existingPlacement] = await db
      .select({ id: placement.id, studentId: placement.studentId })
      .from(placement)
      .where(eq(placement.id, placementId))
      .limit(1);

    if (!existingPlacement) {
      return { success: false, error: "Placement not found." };
    }

    const { error: scopeError } = await verifyHodDepartmentScope(session, existingPlacement.studentId);
    if (scopeError) return { success: false, error: scopeError };

    if (startDate && endDate) {
      const startObj = new Date(startDate);
      const endObj = new Date(endDate);
      if (isNaN(startObj.getTime()) || isNaN(endObj.getTime())) {
        return { success: false, error: "Please provide valid calendar dates." };
      }
      const startYear = startObj.getFullYear();
      const endYear = endObj.getFullYear();
      if (startYear < 2020 || startYear > 2040 || endYear < 2020 || endYear > 2040) {
        return { success: false, error: "Training dates must have a valid year between 2020 and 2040." };
      }
      if (endObj <= startObj) {
        return { success: false, error: "End date must be after start date." };
      }
    }

    const updatePayload: Record<string, unknown> = {};
    if (organizationId) updatePayload.organizationId = organizationId;
    if (schoolSupervisorId) {
      const { error: supervisorError } = await verifySupervisorEligibility(session, schoolSupervisorId);
      if (supervisorError) {
        return { success: false, error: supervisorError };
      }
      updatePayload.schoolSupervisorId = schoolSupervisorId;
    }
    if (startDate) updatePayload.startDate = startDate;
    if (endDate) updatePayload.endDate = endDate;
    if (targetDaysRaw) {
      const td = parseInt(String(targetDaysRaw), 10);
      if (!isNaN(td) && td > 0) updatePayload.targetDays = td;
    }
    if (status && ["pending", "active", "completed", "rejected"].includes(status)) {
      updatePayload.status = status;
    }

    const [updated] = await db
      .update(placement)
      .set(updatePayload)
      .where(eq(placement.id, placementId))
      .returning();

    revalidatePath("/admin/placements");
    revalidatePath("/student/placement");
    revalidatePath("/student");
    revalidatePath("/hod");
    revalidatePath("/hod/students");
    revalidatePath(`/hod/students/${existingPlacement.studentId}`);

    return { success: true, data: updated };
  } catch (error) {
    console.error("[actions/placement.updatePlacement]", error);
    return { success: false, error: "Failed to update placement." };
  }
}

export async function deletePlacement(id: string): Promise<PlacementMutationResult> {
  try {
    const { error: staffError } = await assertStaff();
    if (staffError) return { success: false, error: staffError };

    if (!id) return { success: false, error: "Placement ID is required." };

    // Check if logbook entries exist
    const [hasEntries] = await db
      .select({ id: logbookEntry.id })
      .from(logbookEntry)
      .where(eq(logbookEntry.placementId, id))
      .limit(1);

    if (hasEntries) {
      return {
        success: false,
        error: "Cannot delete this placement because student logbook entries are already attached to it.",
      };
    }

    await db.delete(placement).where(eq(placement.id, id));

    revalidatePath("/admin/placements");
    revalidatePath("/student/placement");
    revalidatePath("/student");
    revalidatePath("/hod");
    revalidatePath("/hod/students");

    return { success: true };
  } catch (error) {
    console.error("[actions/placement.deletePlacement]", error);
    return { success: false, error: "Failed to delete placement." };
  }
}

// ==========================================
// HOD — Supervisor Assignment
// ==========================================

export async function assignSupervisor(
  studentProfileId: string,
  supervisorId: string
): Promise<PlacementMutationResult> {
  try {
    const { error: staffError, session } = await assertStaff();
    if (staffError || !session) return { success: false, error: staffError || "Unauthorized" };

    if (!studentProfileId || !supervisorId) {
      return { success: false, error: "Student and supervisor selections are required." };
    }

    // Department-scoping: verify student is in HOD's department
    const { error: scopeError } = await verifyHodDepartmentScope(session, studentProfileId);
    if (scopeError) return { success: false, error: scopeError };

    const { error: supervisorError } = await verifySupervisorEligibility(session, supervisorId);
    if (supervisorError) {
      return { success: false, error: supervisorError };
    }

    // Find the student's active or pending placement
    const [activePlacement] = await db
      .select({ id: placement.id })
      .from(placement)
      .where(
        and(
          eq(placement.studentId, studentProfileId),
          inArray(placement.status, ["pending", "active"])
        )
      )
      .limit(1);

    if (!activePlacement) {
      return { success: false, error: "This student does not have an active or pending placement to assign a supervisor to." };
    }

    await db
      .update(placement)
      .set({ schoolSupervisorId: supervisorId })
      .where(eq(placement.id, activePlacement.id));

    revalidatePath("/hod");
    revalidatePath("/hod/students");
    revalidatePath(`/hod/students/${studentProfileId}`);
    revalidatePath("/supervisor");
    revalidatePath("/student/placement");
    revalidatePath("/student");
    revalidatePath("/admin/placements");

    return { success: true };
  } catch (error) {
    console.error("[actions/placement.assignSupervisor]", error);
    return { success: false, error: "Failed to assign supervisor." };
  }
}
