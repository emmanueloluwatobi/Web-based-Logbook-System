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
    const { error: staffError } = await assertStaff();
    if (staffError) return { success: false, error: staffError };

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

    // Verify supervisor user exists and is a supervisor
    const [supervisor] = await db
      .select({ id: user.id })
      .from(user)
      .where(and(eq(user.id, schoolSupervisorId), eq(user.role, "school_supervisor")))
      .limit(1);

    if (!supervisor) {
      return { success: false, error: "Selected supervisor is not a valid School Supervisor." };
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

    revalidatePath("/admin/placements");
    revalidatePath("/student/placement");
    revalidatePath("/student");

    return { success: true, data: updated };
  } catch (error) {
    console.error("[actions/placement.approveStudentPlacement]", error);
    return { success: false, error: "Failed to approve placement." };
  }
}

export async function createDepartmentPlacement(formData: FormData): Promise<PlacementMutationResult> {
  try {
    const { error: staffError } = await assertStaff();
    if (staffError) return { success: false, error: staffError };

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

    if (!schoolSupervisorId) {
      return { success: false, error: "School Supervisor assignment is required." };
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

    revalidatePath("/admin/placements");
    revalidatePath("/student/placement");
    revalidatePath("/student");

    return { success: true, data: created };
  } catch (error) {
    console.error("[actions/placement.createDepartmentPlacement]", error);
    return { success: false, error: "Failed to create department placement." };
  }
}

export async function updatePlacement(formData: FormData): Promise<PlacementMutationResult> {
  try {
    const { error: staffError } = await assertStaff();
    if (staffError) return { success: false, error: staffError };

    const placementId = formData.get("id") as string;
    const organizationId = formData.get("organizationId") as string;
    const schoolSupervisorId = formData.get("schoolSupervisorId") as string;
    const startDate = formData.get("startDate") as string;
    const endDate = formData.get("endDate") as string;
    const targetDaysRaw = formData.get("targetDays");
    const status = formData.get("status") as "pending" | "active" | "completed";

    if (!placementId) {
      return { success: false, error: "Placement ID is required." };
    }

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
    if (schoolSupervisorId) updatePayload.schoolSupervisorId = schoolSupervisorId;
    if (startDate) updatePayload.startDate = startDate;
    if (endDate) updatePayload.endDate = endDate;
    if (targetDaysRaw) {
      const td = parseInt(String(targetDaysRaw), 10);
      if (!isNaN(td) && td > 0) updatePayload.targetDays = td;
    }
    if (status && ["pending", "active", "completed"].includes(status)) {
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

    return { success: true };
  } catch (error) {
    console.error("[actions/placement.deletePlacement]", error);
    return { success: false, error: "Failed to delete placement." };
  }
}
