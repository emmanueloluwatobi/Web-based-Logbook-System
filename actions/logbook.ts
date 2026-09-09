"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  studentProfile,
  logbookEntry,
  placement,
  organization,
  user,
  supervisorFeedback,
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

  // Check if student has a pending placement awaiting approval
  const [pendingPlacement] = await db
    .select()
    .from(placement)
    .where(
      and(
        eq(placement.studentId, profileId),
        eq(placement.status, "pending")
      )
    )
    .limit(1);

  if (pendingPlacement) {
    return null;
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


export interface VersionChainItem {
  id: string;
  versionNumber: number;
  entryDate: string;
  status: "draft" | "submitted" | "approved" | "rejected" | "needs_correction";
  hoursWorked: number;
  activityDescription: string;
  skillsGained?: string | null;
  challenges?: string | null;
  attachmentUrl?: string | null;
  submittedAt?: string | null;
  parentEntryId?: string | null;
  feedback?: {
    action: "approved" | "rejected";
    comment?: string | null;
    supervisorName?: string | null;
    createdAt?: string | null;
  } | null;
}

export interface EntryMutationResult {
  success: boolean;
  error?: string;
  data?: {
    id: string;
    status: string;
    entryDate: string;
    versionNumber?: number;
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
    if (!activePlacement) {
      return {
        success: false,
        error:
          "Your placement registration is pending department approval. Daily logbook entries unlock once your placement and academic supervisor are approved.",
      };
    }

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
 * Invariant: Only allowed while status is 'draft'.
 * Entries requiring correction must go through resubmitEntry instead.
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

    // Enforce lock invariant: strictly draft entries only
    if (existing.status !== "draft") {
      return {
        success: false,
        error:
          existing.status === "needs_correction"
            ? "Entries requiring correction cannot be edited in-place. Please resubmit as a new version."
            : "This entry has been submitted or reviewed and is locked from editing.",
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
        versionNumber: updated.versionNumber,
      },
    };
  } catch (error) {
    console.error("[actions/logbook.updateEntry]", error);
    return { success: false, error: "Failed to update logbook entry. Please try again." };
  }
}

/**
 * Submit an existing draft entry for review.
 * Sets status to 'submitted' and submittedAt to now().
 * For entries with status 'needs_correction', use resubmitEntry instead.
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

    if (existing.status !== "draft") {
      return {
        success: false,
        error:
          existing.status === "needs_correction"
            ? "Entries requiring correction must be resubmitted through the correction flow."
            : "This entry has already been submitted or finalized.",
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
        versionNumber: updated.versionNumber,
      },
    };
  } catch (error) {
    console.error("[actions/logbook.submitEntry]", error);
    return { success: false, error: "Failed to submit logbook entry. Please try again." };
  }
}

/**
 * Resubmit an entry that was marked 'needs_correction'.
 * Immutability invariant:
 * - Creates a NEW logbook_entry row with parentEntryId = original entry's id,
 *   versionNumber = original's versionNumber + 1, and status = 'submitted'.
 * - The original row is NEVER edited — its status remains 'needs_correction'
 *   permanently as the historical record.
 */
export async function resubmitEntry(
  entryIdOrFormData: string | FormData,
  optionalFormData?: FormData
): Promise<EntryMutationResult> {
  try {
    const { error: authError, profile } = await assertStudent();
    if (authError || !profile) {
      return { success: false, error: authError || "Unauthorized" };
    }

    let originalEntryId: string;
    let formData: FormData | undefined;

    if (typeof entryIdOrFormData === "string") {
      originalEntryId = entryIdOrFormData;
      formData = optionalFormData;
    } else {
      formData = entryIdOrFormData;
      originalEntryId = (formData.get("originalEntryId") || formData.get("id")) as string;
    }

    if (!originalEntryId) {
      return { success: false, error: "Original entry ID is required for resubmission." };
    }

    // Verify ownership and status of the original entry
    const [original] = await db
      .select()
      .from(logbookEntry)
      .where(
        and(
          eq(logbookEntry.id, originalEntryId),
          eq(logbookEntry.studentId, profile.id)
        )
      )
      .limit(1);

    if (!original) {
      return { success: false, error: "Original logbook entry not found." };
    }

    if (original.status !== "needs_correction") {
      return {
        success: false,
        error: "Only entries marked as 'needs_correction' can be resubmitted.",
      };
    }

    // Check if this entry has already been resubmitted to prevent duplicate branches
    const [existingChild] = await db
      .select({ id: logbookEntry.id, versionNumber: logbookEntry.versionNumber })
      .from(logbookEntry)
      .where(eq(logbookEntry.parentEntryId, original.id))
      .limit(1);

    if (existingChild) {
      return {
        success: false,
        error: `A newer revision (Version ${existingChild.versionNumber}) has already been created for this entry.`,
      };
    }

    // Parse updated values from formData (if provided) or fallback to original
    const entryDate = formData ? ((formData.get("entryDate") as string) || original.entryDate) : original.entryDate;
    const hoursWorkedRaw = formData ? formData.get("hoursWorked") : null;
    const activityDescriptionRaw = formData ? formData.get("activityDescription") : null;
    const skillsGainedRaw = formData ? formData.get("skillsGained") : null;
    const challengesRaw = formData ? formData.get("challenges") : null;
    const attachmentFile = formData ? (formData.get("attachment") as File | null) : null;

    const activityDescription =
      activityDescriptionRaw !== null && activityDescriptionRaw !== undefined
        ? (activityDescriptionRaw as string).trim()
        : original.activityDescription;

    if (!activityDescription) {
      return {
        success: false,
        error: "Activity description cannot be empty when resubmitting.",
      };
    }

    const skillsGained =
      skillsGainedRaw !== null && skillsGainedRaw !== undefined
        ? (skillsGainedRaw as string).trim() || null
        : original.skillsGained;

    const challenges =
      challengesRaw !== null && challengesRaw !== undefined
        ? (challengesRaw as string).trim() || null
        : original.challenges;

    const hoursWorked = hoursWorkedRaw
      ? Math.max(0.5, Math.min(24, parseFloat(String(hoursWorkedRaw)) || 8.0))
      : parseFloat(original.hoursWorked);

    const newEntryId = crypto.randomUUID();
    let attachmentUrl = original.attachmentUrl;

    if (attachmentFile && attachmentFile.size > 0) {
      if (attachmentFile.size > 10 * 1024 * 1024) {
        return { success: false, error: "Attachment size must not exceed 10MB" };
      }

      const fileBuffer = Buffer.from(await attachmentFile.arrayBuffer());
      const uploadRes = await uploadLogbookAttachment({
        studentId: profile.id,
        entryId: newEntryId,
        file: fileBuffer,
        filename: attachmentFile.name,
        contentType: attachmentFile.type || "application/octet-stream",
      });

      if (uploadRes.error) {
        return { success: false, error: `Attachment upload failed: ${uploadRes.error}` };
      }

      attachmentUrl = uploadRes.url || null;
    }

    // Insert new row — original row remains untouched permanently
    const [created] = await db
      .insert(logbookEntry)
      .values({
        id: newEntryId,
        studentId: profile.id,
        placementId: original.placementId,
        parentEntryId: original.id,
        versionNumber: original.versionNumber + 1,
        entryDate,
        activityDescription,
        skillsGained,
        challenges,
        hoursWorked: String(hoursWorked.toFixed(1)),
        attachmentUrl,
        status: "submitted",
        submittedAt: new Date(),
      })
      .returning();

    revalidatePath("/student/logbook");
    revalidatePath(`/student/logbook/${original.id}`);
    revalidatePath(`/student/logbook/${created.id}`);
    revalidatePath("/student");

    return {
      success: true,
      data: {
        id: created.id,
        status: created.status,
        entryDate: created.entryDate,
        versionNumber: created.versionNumber,
      },
    };
  } catch (error) {
    console.error("[actions/logbook.resubmitEntry]", error);
    return { success: false, error: "Failed to resubmit entry. Please try again." };
  }
}

/**
 * Retrieve the full version history chain for an entry (oldest to newest).
 * Traverses parentEntryId to find root, then collects all versions in the chain.
 */
export async function getEntryVersionChain(entryId: string): Promise<VersionChainItem[]> {
  try {
    // 1. Fetch current entry
    const [current] = await db
      .select()
      .from(logbookEntry)
      .where(eq(logbookEntry.id, entryId))
      .limit(1);

    if (!current) return [];

    // 2. Walk up parentEntryId to find the root entry
    let root = current;
    while (root.parentEntryId) {
      const [parent] = await db
        .select()
        .from(logbookEntry)
        .where(eq(logbookEntry.id, root.parentEntryId))
        .limit(1);

      if (!parent) break;
      root = parent;
    }

    // 3. Fetch all entries for this student and placement
    const entriesWithFeedback = await db
      .select({
        entry: logbookEntry,
        feedback: supervisorFeedback,
        supervisorName: user.name,
      })
      .from(logbookEntry)
      .leftJoin(supervisorFeedback, eq(logbookEntry.id, supervisorFeedback.entryId))
      .leftJoin(user, eq(supervisorFeedback.supervisorId, user.id))
      .where(
        and(
          eq(logbookEntry.studentId, root.studentId),
          eq(logbookEntry.placementId, root.placementId)
        )
      );

    // 4. Trace the linear chain starting at root
    const chain: VersionChainItem[] = [];
    const entryMap = new Map<string, (typeof entriesWithFeedback)[0]>();
    const childMap = new Map<string, string>(); // parentId -> childId

    for (const item of entriesWithFeedback) {
      entryMap.set(item.entry.id, item);
      if (item.entry.parentEntryId) {
        childMap.set(item.entry.parentEntryId, item.entry.id);
      }
    }

    let cursorId: string | undefined = root.id;
    while (cursorId && entryMap.has(cursorId)) {
      const item = entryMap.get(cursorId)!;
      chain.push({
        id: item.entry.id,
        versionNumber: item.entry.versionNumber,
        entryDate: item.entry.entryDate,
        status: item.entry.status as
          | "draft"
          | "submitted"
          | "approved"
          | "rejected"
          | "needs_correction",
        hoursWorked: parseFloat(item.entry.hoursWorked) || 8.0,
        activityDescription: item.entry.activityDescription,
        skillsGained: item.entry.skillsGained,
        challenges: item.entry.challenges,
        attachmentUrl: item.entry.attachmentUrl,
        submittedAt: item.entry.submittedAt ? item.entry.submittedAt.toISOString() : null,
        parentEntryId: item.entry.parentEntryId,
        feedback: item.feedback
          ? {
              action: item.feedback.action as "approved" | "rejected",
              comment: item.feedback.comment,
              supervisorName: item.supervisorName,
              createdAt: item.feedback.createdAt.toISOString(),
            }
          : null,
      });

      cursorId = childMap.get(cursorId);
    }

    // If for some reason childMap didn't link everything, fallback to sorting all matching on root.id or parent chains
    if (chain.length === 0) {
      chain.push({
        id: current.id,
        versionNumber: current.versionNumber,
        entryDate: current.entryDate,
        status: current.status as
          | "draft"
          | "submitted"
          | "approved"
          | "rejected"
          | "needs_correction",
        hoursWorked: parseFloat(current.hoursWorked) || 8.0,
        activityDescription: current.activityDescription,
        skillsGained: current.skillsGained,
        challenges: current.challenges,
        attachmentUrl: current.attachmentUrl,
        submittedAt: current.submittedAt ? current.submittedAt.toISOString() : null,
        parentEntryId: current.parentEntryId,
        feedback: null,
      });
    }

    // Sort by versionNumber ascending (oldest to newest)
    return chain.sort((a, b) => a.versionNumber - b.versionNumber);
  } catch (error) {
    console.error("[actions/logbook.getEntryVersionChain]", error);
    return [];
  }
}
