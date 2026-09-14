"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  logbookEntry,
  placement,
  supervisorFeedback,
  studentProfile,
  user,
} from "@/db/schema";
import { auth } from "@/lib/auth";
import { sendEntryRejectedEmail, logNotification } from "@/lib/resend";

async function assertSupervisor(): Promise<{
  error: string | null;
  session: { user: { id: string; name: string; role: string; departmentId?: string | null } } | null;
}> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    return { error: "Authentication required", session: null };
  }

  if (session.user.role !== "school_supervisor") {
    return {
      error: "Only school supervisors are authorized to review entries",
      session: null,
    };
  }

  return { error: null, session };
}

/**
 * Verifies that a logbook entry belongs to a student whose placement
 * is assigned to the current supervisor. Never trust the route param alone.
 */
async function verifyEntryOwnership(
  entryId: string,
  supervisorUserId: string
): Promise<{
  error: string | null;
  entry: typeof logbookEntry.$inferSelect | null;
  studentPlacement: typeof placement.$inferSelect | null;
}> {
  const [entry] = await db
    .select()
    .from(logbookEntry)
    .where(eq(logbookEntry.id, entryId))
    .limit(1);

  if (!entry) {
    return { error: "Logbook entry not found", entry: null, studentPlacement: null };
  }

  if (entry.status !== "submitted") {
    return {
      error:
        entry.status === "draft"
          ? "This entry is still a draft and has not been submitted for review."
          : entry.status === "approved"
          ? "This entry has already been approved."
          : "This entry has already been reviewed.",
      entry: null,
      studentPlacement: null,
    };
  }

  const [studentPlacement] = await db
    .select()
    .from(placement)
    .where(
      and(
        eq(placement.studentId, entry.studentId),
        eq(placement.schoolSupervisorId, supervisorUserId)
      )
    )
    .limit(1);

  if (!studentPlacement) {
    return {
      error: "This student is not assigned to you. You can only review entries for your assigned students.",
      entry: null,
      studentPlacement: null,
    };
  }

  return { error: null, entry, studentPlacement };
}

export async function approveEntry(
  entryId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error: authError, session } = await assertSupervisor();
    if (authError || !session) {
      return { success: false, error: authError || "Unauthorized" };
    }

    const { error: ownershipError, entry } = await verifyEntryOwnership(
      entryId,
      session.user.id
    );
    if (ownershipError || !entry) {
      return { success: false, error: ownershipError || "Entry verification failed" };
    }

    await db.transaction(async (tx) => {
      await tx
        .update(logbookEntry)
        .set({ status: "approved" })
        .where(eq(logbookEntry.id, entry.id));

      await tx.insert(supervisorFeedback).values({
        entryId: entry.id,
        supervisorId: session.user.id,
        action: "approved",
        comment: null,
      });
    });

    revalidatePath("/supervisor");
    revalidatePath(`/supervisor/students/${entry.studentId}`);
    revalidatePath("/student/logbook");
    revalidatePath(`/student/logbook/${entry.id}`);
    revalidatePath("/student");

    return { success: true };
  } catch (error) {
    console.error("[actions/review.approveEntry]", error);
    return { success: false, error: "Failed to approve entry. Please try again." };
  }
}

export async function rejectEntry(
  entryId: string,
  comment: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error: authError, session } = await assertSupervisor();
    if (authError || !session) {
      return { success: false, error: authError || "Unauthorized" };
    }

    if (!comment || !comment.trim()) {
      return {
        success: false,
        error: "A rejection comment is required when requesting corrections.",
      };
    }

    const { error: ownershipError, entry } = await verifyEntryOwnership(
      entryId,
      session.user.id
    );
    if (ownershipError || !entry) {
      return { success: false, error: ownershipError || "Entry verification failed" };
    }

    await db.transaction(async (tx) => {
      await tx
        .update(logbookEntry)
        .set({ status: "needs_correction" })
        .where(eq(logbookEntry.id, entry.id));

      await tx.insert(supervisorFeedback).values({
        entryId: entry.id,
        supervisorId: session.user.id,
        action: "rejected",
        comment: comment.trim(),
      });
    });

    // Feature 15: Send entry_rejected notification to student
    try {
      const [studentUser] = await db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
        })
        .from(studentProfile)
        .innerJoin(user, eq(studentProfile.userId, user.id))
        .where(eq(studentProfile.id, entry.studentId))
        .limit(1);

      if (studentUser) {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        await sendEntryRejectedEmail({
          to: studentUser.email,
          studentName: studentUser.name,
          entryDate: entry.entryDate,
          comment: comment.trim(),
          entryUrl: `${baseUrl}/student/logbook/${entry.id}`,
        });

        await logNotification({
          userId: studentUser.id,
          type: "entry_rejected",
          message: `Correction requested for entry on ${entry.entryDate}: "${comment.trim()}"`,
        });
      }
    } catch (emailErr) {
      console.error("[actions/review.rejectEntry] Failed to dispatch correction email:", emailErr);
    }

    revalidatePath("/supervisor");
    revalidatePath(`/supervisor/students/${entry.studentId}`);
    revalidatePath("/student/logbook");
    revalidatePath(`/student/logbook/${entry.id}`);
    revalidatePath("/student");

    return { success: true };
  } catch (error) {
    console.error("[actions/review.rejectEntry]", error);
    return { success: false, error: "Failed to reject entry. Please try again." };
  }
}
