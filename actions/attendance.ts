"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { eq, and, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { attendance, placement, studentProfile } from "@/db/schema";
import { auth } from "@/lib/auth";

export interface AttendanceMutationResult<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
}

/**
 * Ensures caller is an authenticated student and retrieves their student profile.
 */
async function assertStudent() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    return { error: "Authentication required", profile: null, session: null };
  }

  if (session.user.role !== "student") {
    return { error: "Only students can log work attendance.", profile: null, session: null };
  }

  const [profile] = await db
    .select()
    .from(studentProfile)
    .where(eq(studentProfile.userId, session.user.id))
    .limit(1);

  if (!profile) {
    return {
      error: "Student profile not found. Please complete your registration.",
      profile: null,
      session,
    };
  }

  return { error: null, profile, session };
}

/**
 * Logs or updates an attendance record for a student on their active placement.
 */
export async function logAttendance(formData: FormData): Promise<AttendanceMutationResult> {
  try {
    const { error: authError, profile } = await assertStudent();
    if (authError || !profile) return { success: false, error: authError || "Unauthorized" };

    const recordId = (formData.get("id") as string)?.trim() || null;
    const date = (formData.get("date") as string)?.trim();
    const checkIn = (formData.get("checkIn") as string)?.trim();
    const checkOut = (formData.get("checkOut") as string)?.trim() || null;
    const status = (formData.get("status") as "present" | "late" | "absent") || "present";

    if (!date) {
      return { success: false, error: "Please select an attendance date." };
    }

    if (!checkIn) {
      return { success: false, error: "Check-in time is required." };
    }

    if (!["present", "late", "absent"].includes(status)) {
      return { success: false, error: "Invalid attendance status." };
    }

    // Check active placement
    const [activePlacement] = await db
      .select({ id: placement.id })
      .from(placement)
      .where(
        and(
          eq(placement.studentId, profile.id),
          eq(placement.status, "active")
        )
      )
      .limit(1);

    if (!activePlacement) {
      return {
        success: false,
        error: "You need an active, approved industrial placement before logging attendance.",
      };
    }

    // Derive hours if checkOut is supplied
    let hours: string | null = null;
    if (checkIn && checkOut) {
      const [inH, inM] = checkIn.split(":").map(Number);
      const [outH, outM] = checkOut.split(":").map(Number);

      if (isNaN(inH) || isNaN(inM) || isNaN(outH) || isNaN(outM)) {
        return { success: false, error: "Invalid check-in or check-out time format." };
      }

      const inTotal = inH * 60 + inM;
      const outTotal = outH * 60 + outM;

      if (outTotal <= inTotal) {
        return { success: false, error: "Check-out time must be strictly after check-in time." };
      }

      const diffHours = (outTotal - inTotal) / 60;
      hours = diffHours.toFixed(2);
    }

    if (recordId) {
      // Updating an existing record by ID
      const [existing] = await db
        .select()
        .from(attendance)
        .where(
          and(
            eq(attendance.id, recordId),
            eq(attendance.studentId, profile.id)
          )
        )
        .limit(1);

      if (!existing) {
        return { success: false, error: "Attendance record not found." };
      }

      const [updated] = await db
        .update(attendance)
        .set({
          date,
          checkIn,
          checkOut,
          hours,
          status,
        })
        .where(eq(attendance.id, recordId))
        .returning();

      revalidatePath("/student/attendance");
      revalidatePath("/student");

      return { success: true, data: updated };
    }

    // Check if an attendance record already exists for this exact date
    const [existingDate] = await db
      .select({ id: attendance.id })
      .from(attendance)
      .where(
        and(
          eq(attendance.studentId, profile.id),
          eq(attendance.date, date)
        )
      )
      .limit(1);

    if (existingDate) {
      // Update existing date record
      const [updated] = await db
        .update(attendance)
        .set({
          checkIn,
          checkOut,
          hours,
          status,
        })
        .where(eq(attendance.id, existingDate.id))
        .returning();

      revalidatePath("/student/attendance");
      revalidatePath("/student");

      return { success: true, data: updated };
    }

    // Insert new attendance record
    const [created] = await db
      .insert(attendance)
      .values({
        studentId: profile.id,
        placementId: activePlacement.id,
        date,
        checkIn,
        checkOut,
        hours,
        status,
      })
      .returning();

    revalidatePath("/student/attendance");
    revalidatePath("/student");

    return { success: true, data: created };
  } catch (error) {
    console.error("[actions/attendance.logAttendance]", error);
    return { success: false, error: "Failed to log attendance." };
  }
}

/**
 * Deletes an attendance entry owned by the calling student.
 */
export async function deleteAttendance(id: string): Promise<AttendanceMutationResult> {
  try {
    const { error: authError, profile } = await assertStudent();
    if (authError || !profile) return { success: false, error: authError || "Unauthorized" };

    if (!id) {
      return { success: false, error: "Attendance ID is required." };
    }

    const [existing] = await db
      .select({ id: attendance.id })
      .from(attendance)
      .where(
        and(
          eq(attendance.id, id),
          eq(attendance.studentId, profile.id)
        )
      )
      .limit(1);

    if (!existing) {
      return { success: false, error: "Attendance entry not found or unauthorized." };
    }

    await db.delete(attendance).where(eq(attendance.id, id));

    revalidatePath("/student/attendance");
    revalidatePath("/student");

    return { success: true };
  } catch (error) {
    console.error("[actions/attendance.deleteAttendance]", error);
    return { success: false, error: "Failed to delete attendance entry." };
  }
}
