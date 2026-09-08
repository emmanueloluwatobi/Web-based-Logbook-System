"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { eq, and, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  studentProfile,
  logbookEntry,
  placement,
  organization,
  user,
} from "@/db/schema";
import { auth } from "@/lib/auth";
import { uploadLogbookAttachment } from "@/lib/supabase-storage";

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

  // Get or verify linked studentProfile
  let [profile] = await db
    .select()
    .from(studentProfile)
    .where(eq(studentProfile.userId, session.user.id))
    .limit(1);

  if (!profile) {
    // Auto-create minimal profile if missing
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
 * Ensures a placement record exists for the student.
 * While Placement Admin CRUD is in Phase 3 (Feature 10), this ensures
 * the foreign key invariant on logbook_entry.placement_id is satisfied.
 */
async function ensureStudentPlacement(profileId: string) {
  // Check for existing active placement
  const [existingPlacement] = await db
    .select()
    .from(placement)
    .where(
      and(
        eq(placement.studentId, profileId),
        eq(placement.status, "active")
      )
    )
    .limit(1);

  if (existingPlacement) {
    return existingPlacement;
  }

  // Find or create default placement organization
  let [defaultOrg] = await db
    .select()
    .from(organization)
    .where(eq(organization.name, "Chevron Nigeria Limited"))
    .limit(1);

  if (!defaultOrg) {
    const [newOrg] = await db
      .insert(organization)
      .values({
        name: "Chevron Nigeria Limited",
        address: "Chevron Drive, Lekki Peninsula",
        stateRegion: "Lagos State",
        industryType: "Energy / IT Infrastructure",
      })
      .returning();
    defaultOrg = newOrg;
  }

  // Find any school supervisor in Computer Science as fallback supervisor, or fallback to admin
  let [supervisor] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.role, "school_supervisor"))
    .limit(1);

  if (!supervisor) {
    const [fallbackUser] = await db
      .select({ id: user.id })
      .from(user)
      .limit(1);
    supervisor = fallbackUser;
  }

  const [newPlacement] = await db
    .insert(placement)
    .values({
      studentId: profileId,
      organizationId: defaultOrg.id,
      schoolSupervisorId: supervisor.id,
      startDate: "2026-08-01",
      endDate: "2026-11-30",
      targetDays: 60,
      placementSource: "self_secured",
      status: "active",
    })
    .returning();

  return newPlacement;
}


export interface EntryMutationResult {
  success: boolean;
  error?: string;
  data?: {
    id: string;
    status: string;
    entryDate: string;
  };
}

/**
 * Create a new logbook entry (as draft or submitted for review).
 */
export async function createEntry(formData: FormData): Promise<EntryMutationResult> {
  try {
    const { error: authError, profile } = await assertStudent();
    if (authError || !profile) {
      return { success: false, error: authError || "Unauthorized" };
    }

    const entryDate = formData.get("entryDate") as string;
    const hoursWorkedRaw = formData.get("hoursWorked");
    const activityDescription = (formData.get("activityDescription") as string) || "";
    const skillsGained = (formData.get("skillsGained") as string) || "";
    const challenges = (formData.get("challenges") as string) || "";
    const isDraft = formData.get("isDraft") === "true";
    const attachmentFile = formData.get("attachment") as File | null;

    if (!entryDate) {
      return { success: false, error: "Entry date is required" };
    }

    if (!isDraft && !activityDescription.trim()) {
      return {
        success: false,
        error: "Activity description is required when submitting for review",
      };
    }

    const hoursWorked = Math.max(0.5, Math.min(24, parseFloat(String(hoursWorkedRaw)) || 8.0));

    // Ensure placement exists
    const activePlacement = await ensureStudentPlacement(profile.id);

    const entryId = crypto.randomUUID();
    let attachmentUrl: string | null = null;

    // Handle optional file upload to Supabase Storage (path: ${studentId}/${entryId}/${filename})
    if (attachmentFile && attachmentFile.size > 0) {
      if (attachmentFile.size > 10 * 1024 * 1024) {
        return { success: false, error: "Attachment size must not exceed 10MB" };
      }

      const fileBuffer = Buffer.from(await attachmentFile.arrayBuffer());
      const uploadRes = await uploadLogbookAttachment({
        studentId: profile.id,
        entryId,
        file: fileBuffer,
        filename: attachmentFile.name,
        contentType: attachmentFile.type || "application/octet-stream",
      });

      if (uploadRes.error) {
        return { success: false, error: `Attachment upload failed: ${uploadRes.error}` };
      }

      attachmentUrl = uploadRes.url || null;
    }

    const [created] = await db
      .insert(logbookEntry)
      .values({
        id: entryId,
        studentId: profile.id,
        placementId: activePlacement.id,
        entryDate,
        activityDescription: activityDescription.trim(),
        skillsGained: skillsGained.trim() || null,
        challenges: challenges.trim() || null,
        hoursWorked: String(hoursWorked.toFixed(1)),
        attachmentUrl,
        status: isDraft ? "draft" : "submitted",
        submittedAt: isDraft ? null : new Date(),
        versionNumber: 1,
      })
      .returning();

    revalidatePath("/student/logbook");
    revalidatePath("/student");

    return {
      success: true,
      data: {
        id: created.id,
        status: created.status,
        entryDate: created.entryDate,
      },
    };
  } catch (error) {
    console.error("[actions/logbook.createEntry]", error);
    return { success: false, error: "Failed to create logbook entry. Please try again." };
  }
}

/**
 * Update an existing logbook entry.
 * Invariant: Only allowed while status is 'draft' or 'needs_correction'.
 * Locked from editing once submitted until a supervisor acts.
 */
export async function updateEntry(formData: FormData): Promise<EntryMutationResult> {
  try {
    const { error: authError, profile } = await assertStudent();
    if (authError || !profile) {
      return { success: false, error: authError || "Unauthorized" };
    }

    const entryId = formData.get("id") as string;
    if (!entryId) {
      return { success: false, error: "Entry ID is required" };
    }

    // Verify ownership and fetch current status
    const [existing] = await db
      .select()
      .from(logbookEntry)
      .where(
        and(
          eq(logbookEntry.id, entryId),
          eq(logbookEntry.studentId, profile.id)
        )
      )
      .limit(1);

    if (!existing) {
      return { success: false, error: "Logbook entry not found" };
    }

    // Enforce lock invariant
    if (existing.status !== "draft" && existing.status !== "needs_correction") {
      return {
        success: false,
        error: "This entry is submitted or reviewed and is locked from editing.",
      };
    }

    const entryDate = (formData.get("entryDate") as string) || existing.entryDate;
    const hoursWorkedRaw = formData.get("hoursWorked");
    const activityDescription =
      formData.get("activityDescription") !== null
        ? (formData.get("activityDescription") as string)
        : existing.activityDescription;
    const skillsGained =
      formData.get("skillsGained") !== null
        ? (formData.get("skillsGained") as string)
        : existing.skillsGained;
    const challenges =
      formData.get("challenges") !== null
        ? (formData.get("challenges") as string)
        : existing.challenges;
    const attachmentFile = formData.get("attachment") as File | null;

    const hoursWorked = hoursWorkedRaw
      ? Math.max(0.5, Math.min(24, parseFloat(String(hoursWorkedRaw)) || 8.0))
      : parseFloat(existing.hoursWorked);

    let attachmentUrl = existing.attachmentUrl;

    if (attachmentFile && attachmentFile.size > 0) {
      if (attachmentFile.size > 10 * 1024 * 1024) {
        return { success: false, error: "Attachment size must not exceed 10MB" };
      }

      const fileBuffer = Buffer.from(await attachmentFile.arrayBuffer());
      const uploadRes = await uploadLogbookAttachment({
        studentId: profile.id,
        entryId: existing.id,
        file: fileBuffer,
        filename: attachmentFile.name,
        contentType: attachmentFile.type || "application/octet-stream",
      });

      if (uploadRes.error) {
        return { success: false, error: `Attachment upload failed: ${uploadRes.error}` };
      }

      attachmentUrl = uploadRes.url || null;
    }

    const [updated] = await db
      .update(logbookEntry)
      .set({
        entryDate,
        activityDescription: activityDescription.trim(),
        skillsGained: skillsGained ? skillsGained.trim() : null,
        challenges: challenges ? challenges.trim() : null,
        hoursWorked: String(hoursWorked.toFixed(1)),
        attachmentUrl,
      })
      .where(eq(logbookEntry.id, existing.id))
      .returning();

    revalidatePath("/student/logbook");
    revalidatePath(`/student/logbook/${existing.id}`);
    revalidatePath("/student");

    return {
      success: true,
      data: {
        id: updated.id,
        status: updated.status,
        entryDate: updated.entryDate,
      },
    };
  } catch (error) {
    console.error("[actions/logbook.updateEntry]", error);
    return { success: false, error: "Failed to update logbook entry. Please try again." };
  }
}

/**
 * Submit an existing draft or needs_correction entry for review.
 * Sets status to 'submitted' and submittedAt to now().
 */
export async function submitEntry(entryId: string): Promise<EntryMutationResult> {
  try {
    const { error: authError, profile } = await assertStudent();
    if (authError || !profile) {
      return { success: false, error: authError || "Unauthorized" };
    }

    const [existing] = await db
      .select()
      .from(logbookEntry)
      .where(
        and(
          eq(logbookEntry.id, entryId),
          eq(logbookEntry.studentId, profile.id)
        )
      )
      .limit(1);

    if (!existing) {
      return { success: false, error: "Logbook entry not found" };
    }

    if (existing.status !== "draft" && existing.status !== "needs_correction") {
      return {
        success: false,
        error: "This entry has already been submitted or finalized.",
      };
    }

    if (!existing.activityDescription.trim()) {
      return {
        success: false,
        error: "Cannot submit an entry without an activity description.",
      };
    }

    const [updated] = await db
      .update(logbookEntry)
      .set({
        status: "submitted",
        submittedAt: new Date(),
      })
      .where(eq(logbookEntry.id, existing.id))
      .returning();

    revalidatePath("/student/logbook");
    revalidatePath(`/student/logbook/${existing.id}`);
    revalidatePath("/student");

    return {
      success: true,
      data: {
        id: updated.id,
        status: updated.status,
        entryDate: updated.entryDate,
      },
    };
  } catch (error) {
    console.error("[actions/logbook.submitEntry]", error);
    return { success: false, error: "Failed to submit logbook entry. Please try again." };
  }
}
